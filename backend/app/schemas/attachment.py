from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AttachmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ticket_id: int
    filename: str
    mime_type: str
    size_bytes: int
    uploader_id: int
    created_at: datetime