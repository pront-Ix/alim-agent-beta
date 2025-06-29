from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import StreamingResponse
import openai
import os
import io

router = APIRouter()

# Configure OpenAI API key
openai.api_key = os.getenv("OPENAI_API_KEY")

@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    try:
        audio_bytes = await file.read()
        audio_file = io.BytesIO(audio_bytes)
        audio_file.name = file.filename  # Whisper needs a file name
        transcription = openai.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file
        )
        return {"transcription": transcription.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/synthesize")
async def synthesize_speech(text: str):
    try:
        response = openai.audio.speech.create(
            model="tts-1",
            voice="onyx",
            input=text,
        )
        return StreamingResponse(response.iter_bytes(), media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
