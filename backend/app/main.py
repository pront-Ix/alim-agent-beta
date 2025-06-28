from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import chat 

app = FastAPI(
    title="Alim - Agent IA Islamique API",
    description="Backend pour l'agent IA islamique Alim, basé sur FastAPI et LangChain.",
    version="1.0.0",
)

# Configuration CORS
origins = [
    "http://localhost:5173",  # C'est LA LIGNE CRUCIALE pour ton frontend Vite
    "http://127.0.0.1:5173",  # Ajoute celle-ci aussi par précaution
    # "http://localhost:3000", # Tu peux retirer si tu n'utilises plus create-react-app
    # "http://127.0.0.1:3000", # Tu peux retirer si tu n'utilises plus create-react-app
    # Ajoutez ici l'URL de votre frontend React une fois déployé sur Vercel
    # "https://votre-frontend-alim.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclure les routers d'API
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Chat"])

@app.get("/")
async def read_root():
    return {"message": "Welcome to the Alim API!"}

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "API is running"}