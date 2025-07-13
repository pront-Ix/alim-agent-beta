from fastapi import APIRouter, File, UploadFile, HTTPException, Query
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI  # CHANGED: We import the Async client
import os
import io

router = APIRouter()

# CHANGED: We instantiate the AsyncOpenAI client.
# This should be done once per module.
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    try:
        audio_bytes = await file.read()

        # The OpenAI library needs a file-like object with a name.
        # We wrap the bytes in io.BytesIO and give it the original filename.
        audio_file_tuple = (file.filename, io.BytesIO(audio_bytes))

        # CHANGED: We now 'await' the asynchronous call to the API.
        transcription = await client.audio.transcriptions.create(
            model="whisper-1", file=audio_file_tuple
        )
        return {"transcription": transcription.text}
    except Exception as e:
        print(f"Error during transcription: {e}")
        raise HTTPException(status_code=500, detail=f"Audio transcription failed: {e}")


@router.post("/synthesize")
async def synthesize_speech(text: str = Query(...)):
    try:
        # CHANGED: We now 'await' the asynchronous call.
        response = await client.audio.speech.create(
            model="tts-1",
            voice="onyx",  # Good for English/French
            input=text,
        )
        return StreamingResponse(response.iter_bytes(), media_type="audio/mpeg")
    except Exception as e:
        print(f"Error during synthesis: {e}")
        raise HTTPException(status_code=500, detail=f"Speech synthesis failed: {e}")


@router.post("/synthesize_arabic")
async def synthesize_arabic_speech(text: str = Query(...)):
    try:
        # CHANGED: We now 'await' the asynchronous call.
        response = await client.audio.speech.create(
            model="tts-1-hd",
            voice="onyx",  # Good for Arabic
            input=text,
        )
        return StreamingResponse(response.iter_bytes(), media_type="audio/mpeg")
    except Exception as e:
        print(f"Error during Arabic synthesis: {e}")
        raise HTTPException(
            status_code=500, detail=f"Arabic speech synthesis failed: {e}"
        )
