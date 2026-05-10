from typing import Any
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.enums import TicketStatus, TicketPriority
from app.schemas.ticket import TicketCreate, TicketUpdate
from app.services import tickets as tickets_service
from app.services import comments as comments_service


TOOLS: list[dict[str, Any]] = [
    {
        "name": "list_tickets",
        "description": (
            "Lista tickets aplicando filtros opcionales. Útil para responder a "
            "consultas como 'mis tickets abiertos de prioridad alta' o "
            "'tickets asignados a Juan'. Devuelve título, id, estado, "
            "prioridad y nombres de autor y asignado."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "status": {
                    "type": "string",
                    "enum": ["open", "in_progress", "in_review", "closed"],
                    "description": "Filtra por estado.",
                },
                "priority": {
                    "type": "string",
                    "enum": ["low", "medium", "high", "urgent"],
                    "description": "Filtra por prioridad.",
                },
                "assignee_id": {
                    "type": "integer",
                    "description": (
                        "ID del usuario asignado. Usa `assigned_to_me=true` "
                        "en su lugar si te refieres al usuario actual."
                    ),
                },
                "author_id": {
                    "type": "integer",
                    "description": "ID del autor del ticket.",
                },
                "assigned_to_me": {
                    "type": "boolean",
                    "description": (
                        "Si es true, filtra por tickets asignados al usuario "
                        "actual. Tiene preferencia sobre assignee_id."
                    ),
                },
                "authored_by_me": {
                    "type": "boolean",
                    "description": "Si es true, filtra por tickets creados por el usuario actual.",
                },
                "q": {
                    "type": "string",
                    "description": "Búsqueda libre en título o descripción.",
                },
            },
        },
    },
    {
        "name": "get_ticket",
        "description": "Obtiene el detalle de un ticket por ID, incluyendo descripción.",
        "input_schema": {
            "type": "object",
            "properties": {
                "ticket_id": {"type": "integer"},
            },
            "required": ["ticket_id"],
        },
    },
    {
        "name": "create_ticket",
        "description": (
            "Crea un nuevo ticket. El autor será el usuario actual. "
            "Útil para 'crea un ticket sobre X'."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "description": {"type": "string"},
                "priority": {
                    "type": "string",
                    "enum": ["low", "medium", "high", "urgent"],
                    "description": "Por defecto medium.",
                },
                "assignee_id": {
                    "type": "integer",
                    "description": "ID del usuario al que asignarlo (opcional).",
                },
            },
            "required": ["title"],
        },
    },
    {
        "name": "update_ticket_status",
        "description": (
            "Cambia el estado de un ticket. Usar para 'cierra el ticket #42', "
            "'pasa el ticket 17 a en revisión', etc."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "ticket_id": {"type": "integer"},
                "status": {
                    "type": "string",
                    "enum": ["open", "in_progress", "in_review", "closed"],
                },
            },
            "required": ["ticket_id", "status"],
        },
    },
    {
        "name": "reassign_ticket",
        "description": (
            "Reasigna un ticket a otro usuario. Pasa null en assignee_id para "
            "dejar el ticket sin asignar."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "ticket_id": {"type": "integer"},
                "assignee_id": {
                    "type": ["integer", "null"],
                    "description": "ID del nuevo asignado, o null para desasignar.",
                },
            },
            "required": ["ticket_id", "assignee_id"],
        },
    },
    {
        "name": "add_comment",
        "description": "Añade un comentario a un ticket.",
        "input_schema": {
            "type": "object",
            "properties": {
                "ticket_id": {"type": "integer"},
                "body": {"type": "string"},
            },
            "required": ["ticket_id", "body"],
        },
    },
    {
        "name": "find_user",
        "description": (
            "Busca un usuario por nombre o email. Útil cuando el usuario dice "
            "'asígnaselo a María' y necesitas saber el ID."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "q": {"type": "string"},
            },
            "required": ["q"],
        },
    },
]


def execute_tool(
    db: Session, *, name: str, args: dict[str, Any], current_user: User
) -> tuple[Any, str]:
    if name == "list_tickets":
        kwargs: dict[str, Any] = {}
        if "status" in args:
            kwargs["status"] = TicketStatus(args["status"])
        if "priority" in args:
            kwargs["priority"] = TicketPriority(args["priority"])
        if args.get("assigned_to_me"):
            kwargs["assignee_id"] = current_user.id
        elif "assignee_id" in args:
            kwargs["assignee_id"] = args["assignee_id"]
        if args.get("authored_by_me"):
            kwargs["author_id"] = current_user.id
        elif "author_id" in args:
            kwargs["author_id"] = args["author_id"]
        if "q" in args:
            kwargs["q"] = args["q"]

        items, total = tickets_service.list_tickets(db, **kwargs, page_size=50)
        result = {
            "total": total,
            "tickets": [
                {
                    "id": t.id,
                    "title": t.title,
                    "status": t.status.value,
                    "priority": t.priority.value,
                    "author": t.author.name,
                    "assignee": t.assignee.name if t.assignee else None,
                }
                for t in items
            ],
        }
        return result, f"Listó tickets ({total} resultados)"

    if name == "get_ticket":
        try:
            t = tickets_service.get_ticket(db, args["ticket_id"])
        except tickets_service.TicketNotFound:
            return {"error": "ticket_not_found"}, f"No encontró ticket #{args['ticket_id']}"
        return (
            {
                "id": t.id,
                "title": t.title,
                "description": t.description,
                "status": t.status.value,
                "priority": t.priority.value,
                "author": t.author.name,
                "assignee": t.assignee.name if t.assignee else None,
            },
            f"Consultó ticket #{t.id}",
        )

    if name == "create_ticket":
        payload = TicketCreate(
            title=args["title"],
            description=args.get("description", ""),
            priority=TicketPriority(args.get("priority", "medium")),
            assignee_id=args.get("assignee_id"),
        )
        try:
            t = tickets_service.create_ticket(db, payload=payload, author=current_user)
        except tickets_service.AssigneeNotFound:
            return {"error": "assignee_not_found"}, "No encontró el usuario asignado"
        return (
            {"id": t.id, "title": t.title, "status": t.status.value},
            f"Creó ticket #{t.id}: {t.title}",
        )

    if name == "update_ticket_status":
        payload = TicketUpdate(status=TicketStatus(args["status"]))
        try:
            t = tickets_service.update_ticket(
                db, ticket_id=args["ticket_id"], payload=payload, actor=current_user
            )
        except tickets_service.TicketNotFound:
            return {"error": "ticket_not_found"}, f"No encontró ticket #{args['ticket_id']}"
        return (
            {"id": t.id, "status": t.status.value},
            f"Cambió #{t.id} a estado «{t.status.value}»",
        )

    if name == "reassign_ticket":
        payload = TicketUpdate(assignee_id=args.get("assignee_id"))
        try:
            t = tickets_service.update_ticket(
                db, ticket_id=args["ticket_id"], payload=payload, actor=current_user
            )
        except tickets_service.TicketNotFound:
            return {"error": "ticket_not_found"}, f"No encontró ticket #{args['ticket_id']}"
        except tickets_service.AssigneeNotFound:
            return {"error": "assignee_not_found"}, "Usuario asignado no existe"
        return (
            {"id": t.id, "assignee": t.assignee.name if t.assignee else None},
            (
                f"Reasignó #{t.id} a {t.assignee.name}"
                if t.assignee
                else f"Desasignó #{t.id}"
            ),
        )

    if name == "add_comment":
        try:
            c = comments_service.create_comment(
                db,
                ticket_id=args["ticket_id"],
                body=args["body"],
                author=current_user,
            )
        except tickets_service.TicketNotFound:
            return {"error": "ticket_not_found"}, f"No encontró ticket #{args['ticket_id']}"
        return (
            {"id": c.id, "ticket_id": c.ticket_id},
            f"Comentó en #{c.ticket_id}",
        )

    if name == "find_user":
        from sqlalchemy import select, func, or_
        q = f"%{args['q'].lower()}%"
        stmt = select(User).where(
            or_(func.lower(User.name).like(q), func.lower(User.email).like(q))
        ).limit(10)
        users = db.execute(stmt).scalars().all()
        result = [
            {"id": u.id, "name": u.name, "email": u.email} for u in users
        ]
        return result, f"Buscó usuarios: «{args['q']}» ({len(result)} encontrados)"

    return {"error": "unknown_tool"}, f"Tool desconocida: {name}"