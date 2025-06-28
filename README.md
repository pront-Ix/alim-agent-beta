# Alim_app: AI-Powered Islamic Knowledge Assistant

![Project Background Image Placeholder](path/to/your/project_image.jpg)
*Replace `path/to/your/project_image.jpg` with the actual path or URL of your project's main image.*

## Project Description

Alim_app is an innovative AI-powered application designed to provide accessible and accurate Islamic knowledge. Built for the Build4Barakah AI Hackathon, this project aims to enhance how Muslims engage with faith and learning by leveraging artificial intelligence to deliver comprehensive and contextually relevant information. It serves as a smart, accessible, and future-proof learning tool, making complex religious information understandable and readily available.

## Features

*   **Intelligent AI Agent:** Powered by LangChain, the AI agent processes user queries and retrieves relevant information.
*   **Comprehensive Knowledge Base:** Utilizes a FAISS vector store populated with extensive Islamic knowledge.
*   **Interactive Chat Interface:** A user-friendly React frontend allows for seamless conversation with the AI.
*   **Contextual Responses:** Provides accurate and contextually appropriate answers to a wide range of Islamic questions.
*   **Conversation Memory:** Stores past conversations to maintain context across interactions (though this might need further implementation details if not fully persistent).

## Technologies Used

### Backend (Python/FastAPI)

*   **FastAPI:** A modern, fast (high-performance) web framework for building APIs with Python 3.7+.
*   **LangChain:** A framework for developing applications powered by language models.
*   **FAISS:** A library for efficient similarity search and clustering of dense vectors, used here for the vector store.
*   **OpenAI:** Used for language model capabilities (via `langchain-openai`).
*   **Python-dotenv:** For managing environment variables.
*   **Uvicorn:** An ASGI web server for running the FastAPI application.
*   **Other dependencies:** `numpy`, `tiktoken`, `requests`, etc. (as listed in `requirements.txt`).

### Frontend (React)

*   **React:** A JavaScript library for building user interfaces.
*   **Vite:** A fast build tool that provides a lightning-fast development experience.
*   **CSS:** For styling the application components.

## Setup and Installation

To set up and run the Alim_app locally, follow these steps:

### Prerequisites

*   Python 3.9+
*   Node.js and npm (or yarn)

### 1. Clone the Repository

```bash
git clone https://your-github-repo-link # Replace with your actual GitHub repo link
cd Alim_app
```

### 2. Backend Setup

Navigate to the `backend` directory:

```bash
cd backend
```

Create a virtual environment and activate it:

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

Install the required Python packages:

```bash
pip install -r requirements.txt
```

**Environment Variables:**
Create a `.env` file in the `backend` directory and add your OpenAI API key:

```
OPENAI_API_KEY="your_openai_api_key_here"
```

**Build Vector Store:**
Before running the application, you need to build the FAISS vector store from your `islamic_knowledge_base.txt`.

```bash
python build_vector_store.py
```

### 3. Frontend Setup

Open a new terminal and navigate to the `frontend` directory:

```bash
cd ../frontend
```

Install the Node.js dependencies:

```bash
npm install
# or yarn install
```

## How to Run

### 1. Start the Backend Server

In the `backend` directory (where your virtual environment is activated):

```bash
uvicorn app.main:app --reload
```
The backend server will typically run on `http://127.0.0.1:8000`.

### 2. Start the Frontend Development Server

In the `frontend` directory:

```bash
npm run dev
# or yarn dev
```
The frontend application will typically open in your browser at `http://localhost:5173` (or another port if 5173 is in use).

## Project Structure

```
Alim_app/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── chat.py           # Chat API endpoint
│   │   ├── core/
│   │   │   ├── alim_agent.py     # AI agent logic
│   │   │   └── islamic_knowledge_base.txt # Raw knowledge base
│   │   ├── models/
│   │   │   └── chat_models.py    # Pydantic models for chat
│   │   └── main.py               # FastAPI application entry point
│   ├── build_vector_store.py     # Script to build FAISS index
│   ├── conversation_memories/    # Stores chat history
│   ├── faiss_index/              # FAISS vector store files
│   └── requirements.txt          # Python dependencies
└── frontend/
    ├── public/
    ├── src/
    │   ├── api.js                # Frontend API calls to backend
    │   ├── App.jsx               # Main React component
    │   ├── components/           # Reusable React components (ChatInput, ChatWindow, etc.)
    │   └── main.jsx              # React application entry point
    ├── index.html                # Main HTML file
    ├── package.json              # Frontend dependencies and scripts
    └── vite.config.js            # Vite configuration
```

## Contributing

Contributions are welcome! Please feel free to fork the repository, create a new branch, and submit a pull request.

## License

[Specify your license here, e.g., MIT License]