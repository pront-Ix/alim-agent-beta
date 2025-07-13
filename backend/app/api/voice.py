import tempfile
from fastapi import APIRouter, File, UploadFile, HTTPException, Query
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI
import os
import io

router = APIRouter()

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="No file was uploaded.")

    try:
        # Use a temporary file to store the uploaded audio
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        # Open the temporary file in binary read mode and send to OpenAI
        with open(tmp_path, "rb") as audio_file:
            transcription = await client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
            )

        return {"transcription": transcription.text}
    except Exception as e:
        print(f"Error during transcription: {e}")
        raise HTTPException(status_code=500, detail=f"Audio transcription failed: {e}")
    finally:
        # Clean up the temporary file
        if 'tmp_path' in locals() and os.path.exists(tmp_path):
            os.remove(tmp_path)


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
