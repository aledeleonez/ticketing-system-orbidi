from fastapi import APIRouter
from app.api.v1 import auth, tickets, users, comments, attachments, notifications, chat

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(tickets.router)
api_router.include_router(users.router)
api_router.include_router(comments.router)
api_router.include_router(attachments.router)
api_router.include_router(notifications.router)
api_router.include_router(chat.router)