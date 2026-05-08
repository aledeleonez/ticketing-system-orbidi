from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import TicketStatus, TicketPriority
from app.schemas.user import UserOut


class TicketCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str = ""
    priority: TicketPriority = TicketPriority.MEDIUM
    assignee_id: int | None = None

class TicketUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    status: TicketStatus | None = None
    priority: TicketPriority | None = None
    assignee_id: int | None = None

class TicketOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    status: TicketStatus
    priority: TicketPriority
    author: UserOut
    assignee: UserOut | None
    created_at: datetime
    updated_at: datetime

class TicketListOut(BaseModel):
    items: list[TicketOut]
    total: int
    page: int
    page_size: int
