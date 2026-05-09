import os
import uuid
from pathlib import Path
from typing import Sequence

from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.attachment import Attachment
from app.models.user import User
from app.services.tickets import get_ticket


ALLOWED_MIME_PREFIXES = ("image/",)
ALLOWED_MIME_EXACT = {
    "application/pdf",
    "text/plain",
    "text/markdown",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip",
}


class AttachmentTooLarge(Exception):
    pass


class AttachmentTypeNotAllowed(Exception):
    pass


class AttachmentNotFound(Exception):
    pass


def _is_allowed_mime(mime: str) -> bool:
    return mime in ALLOWED_MIME_EXACT or any(
        mime.startswith(p) for p in ALLOWED_MIME_PREFIXES
    )


def _ticket_dir(ticket_id: int) -> Path:
    p = Path(settings.ATTACHMENTS_DIR) / str(ticket_id)
    p.mkdir(parents=True, exist_ok=True)
    return p


def list_attachments(db: Session, ticket_id: int) -> Sequence[Attachment]:
    get_ticket(db, ticket_id)
    stmt = (
        select(Attachment)
        .where(Attachment.ticket_id == ticket_id)
        .order_by(Attachment.created_at.desc())
    )
    return db.execute(stmt).scalars().all()


def get_attachment(db: Session, attachment_id: int) -> Attachment:
    att = db.get(Attachment, attachment_id)
    if not att:
        raise AttachmentNotFound()
    return att


async def create_attachment(
    db: Session, *, ticket_id: int, file: UploadFile, uploader: User
) -> Attachment:
    get_ticket(db, ticket_id)

    if not _is_allowed_mime(file.content_type or ""):
        raise AttachmentTypeNotAllowed(
            f"MIME type not allowed: {file.content_type}"
        )

    max_bytes = settings.MAX_ATTACHMENT_MB * 1024 * 1024

    safe_filename = f"{uuid.uuid4().hex}_{Path(file.filename or 'file').name}"
    target_dir = _ticket_dir(ticket_id)
    target_path = target_dir / safe_filename

    written = 0
    chunk_size = 1024 * 1024  # 1 MB
    try:
        with open(target_path, "wb") as out:
            while True:
                chunk = await file.read(chunk_size)
                if not chunk:
                    break
                written += len(chunk)
                if written > max_bytes:
                    out.close()
                    target_path.unlink(missing_ok=True)
                    raise AttachmentTooLarge(
                        f"File exceeds {settings.MAX_ATTACHMENT_MB} MB"
                    )
                out.write(chunk)
    finally:
        await file.close()

    att = Attachment(
        ticket_id=ticket_id,
        uploader_id=uploader.id,
        filename=file.filename or "file",
        mime_type=file.content_type or "application/octet-stream",
        size_bytes=written,
        storage_path=str(target_path),
    )
    db.add(att)
    db.commit()
    db.refresh(att)
    return att


def delete_attachment(db: Session, attachment_id: int) -> None:
    att = get_attachment(db, attachment_id)
    try:
        os.remove(att.storage_path)
    except FileNotFoundError:
        pass
    db.delete(att)
    db.commit()