# Alim: AI-Powered Islamic Knowledge Assistant

![Alim App Screenshot](images/Screenshot1.png)
![Alim App Screenshot](images/Screenshot2.png)
![Alim App Screenshot](images/Screenshot3.png)

## Project Description

Alim is an innovative AI-powered application designed to provide accessible and accurate Islamic knowledge. Built for the world wide muslims, this project aims to enhance how Muslims engage with faith and learning by leveraging artificial intelligence to deliver comprehensive and contextually relevant information. It serves as a smart, accessible, and future-proof learning tool, making complex religious information understandable and readily available.

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

To set up and run the Alim locally, follow these steps:

### Prerequisites

*   Python 3.9+
*   Node.js and npm (or yarn)

### 1. Clone the Repository

```bash
git clone https://github.com/pront-Ix/alim-agent-beta.git
cd alim-agent-beta
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
cd ./frontend
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

## Contribution Guide for Muslim Developers

As-salamu alaykum! Welcome to the Alim project. Your contributions are invaluable in helping us build a beneficial AI tool for the Ummah.

This guide is specifically tailored to help Muslim developers contribute effectively while upholding the Islamic principles that guide this project.

### Our Shared Vision
Our goal is to create an AI assistant that provides accurate, authentic, and accessible Islamic knowledge, serving as a reliable resource for Muslims worldwide. We strive for excellence in both technology and adherence to Islamic teachings.

### How to Contribute (with Barakah in mind)

1.  **Intention (Niyyah):** Before you begin, renew your intention to contribute for the sake of Allah (SWT) and to benefit the Muslim community. This will imbue your work with Barakah (blessings).

2.  **Explore and Understand:** Familiarize yourself with the existing codebase, project structure, and the current features of Alim. Understand how the AI agent processes information and generates responses.

3.  **Choose a Task:** Look for open issues, suggest new features, or identify areas for improvement. Contributions can range from bug fixes, UI/UX enhancements, backend optimizations, to expanding the knowledge base.

4.  **Knowledge Base Expansion (Crucial!):**
    *   **Authenticity is Key:** When adding or modifying Islamic knowledge, ensure your sources are authentic and reliable (e.g., Quran, authentic Hadith collections, works of reputable scholars).
    *   **Clarity and Accuracy:** Present information clearly, concisely, and accurately. Avoid personal opinions or interpretations unless explicitly stated as such and supported by scholarly consensus.
    *   **Multi-language Support:** If you are adding content in a language other than English, please ensure it is accurately translated and clearly marked.
    *   **PDFs Welcome:** You can add new PDF documents to the `backend/app/core/knowledge_base/` directory. Remember to rebuild the vector store after adding new files.

5.  **Code Contributions:**
    *   **Adhere to Conventions:** Follow the existing coding style, naming conventions, and architectural patterns. Consistency is vital for collaborative projects.
    *   **Testing:** If applicable, write unit tests for your new features or bug fixes to ensure stability and correctness.
    *   **Code Review (Shura):** Be open to feedback and constructive criticism during code reviews. This is a process of mutual learning and improvement.

6.  **Git Workflow:**
    *   **Fork the Repository:** Start by forking the `alim-agent-beta` repository to your GitHub account.
    *   **Create a New Branch:** Create a new branch for your feature or bug fix (e.g., `feature/add-prayer-times` or `fix/chat-display-bug`).
    *   **Commit Regularly:** Make small, atomic commits with clear and descriptive messages.
    *   **Pre-commit Hook:** The project uses a `pre-commit` hook to automatically rebuild the FAISS vector store when knowledge base files are changed. Ensure this hook is active in your local setup (`.git/hooks/pre-commit` should be executable).
    *   **Pull Request (PR):** Once your changes are ready, submit a Pull Request to the `main` branch of the original repository. Provide a clear description of your changes and why they are needed.

### Communication
We encourage open and respectful communication. If you have questions, suggestions, or need assistance, please open an issue on GitHub or reach out through the community channels (if any are established).

Jazakallahu Khairan for your dedication and effort! May Allah (SWT) accept your contributions and make this project a source of immense benefit for the Ummah.
