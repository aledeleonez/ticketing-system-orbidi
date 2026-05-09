from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.attachment import AttachmentOut
from app.services import attachments as attachments_service
from app.services.tickets import TicketNotFound

router = APIRouter(tags=["attachments"])


@router.get(
    "/tickets/{ticket_id}/attachments",
    response_model=list[AttachmentOut],
)
def list_attachments(
    ticket_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    try:
        items = attachments_service.list_attachments(db, ticket_id)
    except TicketNotFound:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return [AttachmentOut.model_validate(a) for a in items]


@router.post(
    "/tickets/{ticket_id}/attachments",
    response_model=AttachmentOut,
    status_code=status.HTTP_201_CREATED,
)
async def upload_attachment(
    ticket_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        att = await attachments_service.create_attachment(
            db, ticket_id=ticket_id, file=file, uploader=current_user
        )
    except TicketNotFound:
        raise HTTPException(status_code=404, detail="Ticket not found")
    except attachments_service.AttachmentTooLarge as e:
        raise HTTPException(status_code=413, detail=str(e))
    except attachments_service.AttachmentTypeNotAllowed as e:
        raise HTTPException(status_code=415, detail=str(e))
    return AttachmentOut.model_validate(att)


@router.get("/attachments/{attachment_id}/download")
def download_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    try:
        att = attachments_service.get_attachment(db, attachment_id)
    except attachments_service.AttachmentNotFound:
        raise HTTPException(status_code=404, detail="Attachment not found")
    return FileResponse(
        path=att.storage_path,
        filename=att.filename,
        media_type=att.mime_type,
    )


@router.delete(
    "/attachments/{attachment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    try:
        attachments_service.delete_attachment(db, attachment_id)
    except attachments_service.AttachmentNotFound:
        raise HTTPException(status_code=404, detail="Attachment not found")
    return None