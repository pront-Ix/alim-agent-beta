from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from typing import List, Optional
from app.models.chat_models import ChatRequest, ChatResponse, SessionInfo

import os
import json

from app.core.alim_agent import get_alim_response, MEMORY_DIR, get_session_history

router = APIRouter()

@router.post("/message")
async def chat_message(request: ChatRequest):
    try:
        return StreamingResponse(get_alim_response(request.message, request.session_id), media_type="text/event-stream")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sessions", response_model=List[SessionInfo])
async def list_sessions():
    sessions = []
    # Ensure MEMORY_DIR is defined and exists
    if not os.path.exists(MEMORY_DIR):
        return [] # Return an empty list if the memory directory doesn't exist

    for filename in os.listdir(MEMORY_DIR):
        if filename.endswith(".json"):
            session_id = filename[:-5]
            file_path = os.path.join(MEMORY_DIR, filename)

            last_message_preview = None
            timestamp = None

            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    messages_data = json.load(f)
                    if messages_data:
                        # Ensure the message is a dictionary with 'content'
                        last_message = messages_data[-1]
                        # Check if 'content' exists before accessing it
                        if 'content' in last_message:
                            preview_text = last_message.get('content', '')
                            last_message_preview = preview_text[:50] + '...' if len(preview_text) > 50 else preview_text

                    timestamp = os.path.getmtime(file_path)
                    import datetime
                    timestamp = datetime.datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M")

            except json.JSONDecodeError:
                print(f"Error: JSON file {filename} is corrupted or empty.")
            except Exception as e:
                print(f"Error reading session file {filename}: {e}")

            sessions.append(SessionInfo(
                session_id=session_id,
                last_message_preview=last_message_preview,
                timestamp=timestamp
            ))

    sessions.sort(key=lambda x: x.timestamp if x.timestamp else "", reverse=True)

    return sessions

@router.get("/sessions/{session_id}", response_model=List[dict]) # Changed here to List[dict] because ChatRequest is not what you are returning
async def get_session_messages(session_id: str):
    messages = get_session_history(session_id)
    serializable_messages = []
    for msg in messages:
        # Ensure msg.type and msg.content are strings
        serializable_messages.append({"message": str(msg.content), "sender": str(msg.type)})

    if not serializable_messages:
        raise HTTPException(status_code=404, detail="Session not found or empty.")

    return serializable_messages