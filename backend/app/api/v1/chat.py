from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse
from app.services import chat as chat_service

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
def chat(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        reply, operations = chat_service.chat(
            db, messages=payload.messages, current_user=current_user
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    return ChatResponse(reply=reply, operations=operations)