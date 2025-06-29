from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import chat, voice 

app = FastAPI(
    title="Alim - Islamic AI Agent API",
    description="Backend for the Alim Islamic AI agent, based on FastAPI and LangChain.",
    version="1.0.0",
)

# CORS Configuration
origins = [
    "http://localhost:5173",  # This is THE CRUCIAL LINE for your Vite frontend
    "http://127.0.0.1:5173",  # Add this one too as a precaution
    # "http://localhost:3000", # You can remove this if you are no longer using create-react-app
    # "http://127.0.0.1:3000", # You can remove this if you are no longer using create-react-app
    # Add the URL of your React frontend once deployed on Vercel
    # "https://your-alim-frontend.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Chat"])
app.include_router(voice.router, prefix="/api/v1/voice", tags=["Voice"])

@app.get("/")
async def read_root():
    return {"message": "Welcome to the Alim API!"}

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "API is running"}