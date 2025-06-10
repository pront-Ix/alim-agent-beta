from pydantic import BaseModel
from typing import List, Optional

class ChatRequest(BaseModel):
    message: str
    session_id: str

class ChatResponse(BaseModel):
    answer: str
    session_id: str

class SessionInfo(BaseModel):
    session_id: str
    last_message_preview: Optional[str] = None
    timestamp: Optional[str] = None