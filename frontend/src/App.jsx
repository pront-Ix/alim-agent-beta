import { useState, useEffect } from "react";
import ChatWindow from "./components/ChatWindow.jsx";
import ChatInput from "./components/ChatInput.jsx";
import {
  sendMessageToAlim,
  listChatSessions,
  fetchSessionMessages,
  synthesizeSpeech,
} from "./api";
import NewConversationIcon from "./components/icons/NewConversationIcon.jsx";
import MosqueIcon from "./components/icons/MosqueIcon.jsx";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAlimSpeaking, setIsAlimSpeaking] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [sessionList, setSessionList] = useState([]);
  const [isSessionsLoading, setIsSessionsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Fetch sessions on application load
  useEffect(() => {
    // Function to generate a simple UUID v4
    const generateUUID = () => {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        var r = (Math.random() * 16) | 0,
          v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    };

    const loadInitialData = async () => {
      setIsSessionsLoading(true);
      
      // Try to load the session_id from localStorage
      let storedSessionId = localStorage.getItem("alim_session_id");
      let newSession = false;

      if (!storedSessionId) {
        storedSessionId = generateUUID();
        localStorage.setItem("alim_session_id", storedSessionId);
        newSession = true;
      }
      setCurrentSessionId(storedSessionId);
      console.log(
        "Initial Session ID:",
        storedSessionId,
        "New session:",
        newSession
      );

      // Load the list of available sessions
      const sessions = await listChatSessions();
      setSessionList(sessions);

      // If it's a new session, or if the stored session is not in the list,
      // start with an empty chat. Otherwise, load the session messages.
      const sessionExists = sessions.some(
        (s) => s.session_id === storedSessionId
      );

      if (newSession || !sessionExists) {
        setMessages([]); // Start a new empty conversation
        console.log("Starting a new conversation.");
      } else {
        // Load messages from the existing session
        await loadSessionMessages(storedSessionId);
      }
      
      setIsSessionsLoading(false);
    };

    loadInitialData();
  }, []); // Execute only once when the component mounts

  // Function to load messages for a given session
  const loadSessionMessages = async (sessionId) => {
    setIsLoading(true);
    try {
      const msgs = await fetchSessionMessages(sessionId);
      setMessages(msgs);
      setCurrentSessionId(sessionId); // Update the active session
      localStorage.setItem("alim_session_id", sessionId); // Save to localStorage
      console.log(`Loaded messages for session: ${sessionId}`);
    } catch (error) {
      console.error("Error loading session messages:", error);
      setMessages([
        { text: "Could not load this conversation.", sender: "alim" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (userMessage, isVoiceInput = false) => {
    if (!currentSessionId) {
      console.error("Session ID is not set. Cannot send message.");
      return;
    }

    const newUserMessage = { text: userMessage, sender: "user" };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setIsLoading(true);

    try {
      const response = await sendMessageToAlim(userMessage, currentSessionId);
      const alimResponse = { text: response.answer, sender: "alim" };
      setMessages((prevMessages) => [...prevMessages, alimResponse]);

      if (isVoiceInput) {
        setIsAlimSpeaking(true);
        try {
          const audioUrl = await synthesizeSpeech(response.answer);
          const audio = new Audio(audioUrl);
          audio.onended = () => setIsAlimSpeaking(false);
          audio.onerror = () => setIsAlimSpeaking(false);
          audio.play();
        } catch (error) {
          console.error("Error with speech synthesis:", error);
          setIsAlimSpeaking(false);
        }
      }

      // After sending a message, refresh the session list
      const updatedSessions = await listChatSessions();
      setSessionList(updatedSessions);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        text: "Sorry, an error occurred. Please try again later.",
        sender: "alim",
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = async () => {
    const newSessionId = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      (c) => {
        var r = (Math.random() * 16) | 0,
          v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
    setMessages([]); // Clear messages for the new session
    setCurrentSessionId(newSessionId);
    localStorage.setItem("alim_session_id", newSessionId); // Update localStorage
    const updatedSessions = await listChatSessions(); // Refresh the list to include the potential new empty session
    setSessionList(updatedSessions);
    console.log("Started new chat with ID:", newSessionId);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const formatSessionTime = (timestamp) => {
    if (!timestamp) return "New session";
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className={`App ${isAlimSpeaking ? "alim-speaking" : ""}`}>
      <button className="mobile-menu-toggle" onClick={toggleSidebar}>
        ☰
      </button>
      
      <div className={`mobile-overlay ${isSidebarOpen ? 'show' : ''}`} onClick={closeSidebar}></div>
      
      <div className={`sidebar ${isSidebarOpen ? 'show' : ''}`}>
        <div className="sidebar-header">
          <h2>✨ Alim History</h2>
          <p className="subtitle">Your spiritual companion</p>
        </div>

        <button onClick={startNewChat} className="new-chat-btn">
          <NewConversationIcon />
          New Conversation
        </button>

        <div className="session-list">
          {isSessionsLoading ? (
            <div className="loading-shimmer" style={{ height: '60px', borderRadius: '16px', margin: '12px 0' }}></div>
          ) : sessionList.length > 0 ? (
            sessionList.map((session) => (
              <div
                key={session.session_id}
                className={`session-item ${
                  session.session_id === currentSessionId ? "active" : ""
                }`}
                onClick={() => {
                  loadSessionMessages(session.session_id);
                  closeSidebar();
                }}
              >
                <div className="session-icon">
                  <MosqueIcon />
                </div>
                <div className="session-content">
                  <h4>{formatSessionTime(session.timestamp)}</h4>
                  <p>
                    {session.last_message_preview || "No messages yet..."}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="no-sessions">No conversations found.</p>
          )}
        </div>

        <div className="sidebar-footer">
          <div className="spiritual-quote">
            "Verily, in the remembrance of Allah do hearts find rest"
            <br />
            <small style={{ opacity: 0.7, fontSize: '0.8rem' }}>— Quran 13:28</small>
          </div>
        </div>
      </div>

      <div className="main-content">
        <header className="chat-header">
          <div className="header-glow"></div>
          <h1>✨ Alim Chat Paradise</h1>
          <p>
            Your trusted Islamic knowledge companion in a space of divine serenity
          </p>
        </header>
        <ChatWindow messages={messages} isLoading={isLoading} />
        <ChatInput
          onSendMessage={handleSendMessage}
          onVoiceSubmit={(transcription) => handleSendMessage(transcription, true)}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

export default App;