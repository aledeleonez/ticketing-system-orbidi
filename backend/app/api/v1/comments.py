from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.comment import CommentCreate, CommentOut
from app.services import comments as comments_service
from app.services.tickets import TicketNotFound

router = APIRouter(prefix="/tickets/{ticket_id}/comments", tags=["comments"])


@router.get("", response_model=list[CommentOut])
def list_comments(
    ticket_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    try:
        comments = comments_service.list_comments(db, ticket_id)
    except TicketNotFound:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return [CommentOut.model_validate(c) for c in comments]


@router.post("", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
def create_comment(
    ticket_id: int,
    payload: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        comment = comments_service.create_comment(
            db, ticket_id=ticket_id, body=payload.body, author=current_user
        )
    except TicketNotFound:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return CommentOut.model_validate(comment)