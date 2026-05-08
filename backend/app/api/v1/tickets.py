from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.enums import TicketStatus, TicketPriority
from app.schemas.ticket import (
    TicketCreate,
    TicketUpdate,
    TicketOut,
    TicketListOut,
)
from app.services import tickets as tickets_service

router = APIRouter(prefix="/tickets", tags=["tickets"])


@router.get("", response_model=TicketListOut)
def list_tickets(
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
    status_: TicketStatus | None = Query(default=None, alias="status"),
    priority: TicketPriority | None = None,
    assignee_id: int | None = None,
    author_id: int | None = None,
    q: str | None = Query(default=None, max_length=200),
    sort: str = Query(default="created_at"),
    order: str = Query(default="desc", pattern="^(asc|desc)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    items, total = tickets_service.list_tickets(
        db,
        status=status_,
        priority=priority,
        assignee_id=assignee_id,
        author_id=author_id,
        q=q,
        sort=sort,
        order=order,
        page=page,
        page_size=page_size,
    )
    return TicketListOut(
        items=[TicketOut.model_validate(t) for t in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=TicketOut, status_code=status.HTTP_201_CREATED)
def create_ticket(
    payload: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        ticket = tickets_service.create_ticket(db, payload=payload, author=current_user)
    except tickets_service.AssigneeNotFound as e:
        raise HTTPException(status_code=422, detail=str(e))
    return TicketOut.model_validate(ticket)


@router.get("/{ticket_id}", response_model=TicketOut)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    try:
        ticket = tickets_service.get_ticket(db, ticket_id)
    except tickets_service.TicketNotFound:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return TicketOut.model_validate(ticket)


@router.patch("/{ticket_id}", response_model=TicketOut)
def update_ticket(
    ticket_id: int,
    payload: TicketUpdate,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    try:
        ticket = tickets_service.update_ticket(
            db, ticket_id=ticket_id, payload=payload
        )
    except tickets_service.TicketNotFound:
        raise HTTPException(status_code=404, detail="Ticket not found")
    except tickets_service.AssigneeNotFound as e:
        raise HTTPException(status_code=422, detail=str(e))
    return TicketOut.model_validate(ticket)