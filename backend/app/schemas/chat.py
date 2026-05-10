from typing import Any, Literal
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1)


class ToolCallRecord(BaseModel):
    tool: str
    input: dict[str, Any]
    output_summary: str  # resumen humano para mostrar en UI
    success: bool


class ChatResponse(BaseModel):
    reply: str
    operations: list[ToolCallRecord]