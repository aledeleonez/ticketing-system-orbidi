import json
import logging
from typing import Any
from anthropic import Anthropic
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.user import User
from app.schemas.chat import ChatMessage, ToolCallRecord
from app.services.chat_tools import TOOLS, execute_tool

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """Eres un asistente integrado en un sistema de ticketing.

Ayudas al usuario a consultar y gestionar sus tickets en lenguaje natural,
usando las tools disponibles. Reglas:

- Usa SIEMPRE las tools para obtener o modificar información. No te inventes IDs.
- Si el usuario pide reasignar a alguien por nombre, primero busca el usuario con `find_user` para obtener su ID.
- Cuando el usuario diga "mis tickets", usa `assigned_to_me=true` o `authored_by_me=true` según el contexto.
- Para acciones destructivas (cerrar, reasignar) confirma brevemente lo que has hecho citando el ID y el título del ticket.
- Sé conciso. Responde en el mismo idioma que el usuario.
- Si una operación falla (ticket inexistente, usuario no encontrado), explica el problema con claridad.
"""

MAX_ITERATIONS = 8


def chat(
    db: Session,
    *,
    messages: list[ChatMessage],
    current_user: User,
) -> tuple[str, list[ToolCallRecord]]:
    if not settings.ANTHROPIC_API_KEY:
        raise RuntimeError("ANTHROPIC_API_KEY no configurada")

    client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    anthropic_messages: list[dict[str, Any]] = [
        {"role": m.role, "content": m.content} for m in messages
    ]

    operations: list[ToolCallRecord] = []
    iterations = 0

    while iterations < MAX_ITERATIONS:
        iterations += 1
        response = client.messages.create(
            model=settings.ANTHROPIC_MODEL,
            max_tokens=2048,
            system=SYSTEM_PROMPT,
            tools=TOOLS,
            messages=anthropic_messages,
        )

        if response.stop_reason != "tool_use":
            text_blocks = [
                b.text for b in response.content if b.type == "text"
            ]
            return "\n\n".join(text_blocks).strip() or "(sin respuesta)", operations

        anthropic_messages.append({"role": "assistant", "content": response.content})

        tool_results: list[dict[str, Any]] = []
        for block in response.content:
            if block.type != "tool_use":
                continue
            tool_name = block.name
            tool_args = block.input or {}
            try:
                output, summary = execute_tool(
                    db, name=tool_name, args=tool_args, current_user=current_user
                )
                success = not (isinstance(output, dict) and "error" in output)
            except Exception as e:
                logger.exception("Tool %s failed", tool_name)
                output = {"error": "internal_error", "message": str(e)}
                summary = f"Error ejecutando {tool_name}"
                success = False

            operations.append(
                ToolCallRecord(
                    tool=tool_name,
                    input=tool_args,
                    output_summary=summary,
                    success=success,
                )
            )
            tool_results.append(
                {
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": json.dumps(output, default=str),
                    "is_error": not success,
                }
            )

        anthropic_messages.append({"role": "user", "content": tool_results})

    return (
        "He alcanzado el número máximo de operaciones. ¿Puedes reformular?",
        operations,
    )