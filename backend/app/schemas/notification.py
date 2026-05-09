from datetime import datetime
from pydantic import BaseModel, ConfigDict

from app.models.enums import NotificationType


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: NotificationType
    ticket_id: int | None
    payload: dict
    read_at: datetime | None
    created_at: datetime


class NotificationsCount(BaseModel):
    unread: int