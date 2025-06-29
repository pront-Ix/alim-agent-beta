import { useState, useEffect } from "react";
import ChatWindow from "./components/ChatWindow.jsx";
import ChatInput from "./components/ChatInput.jsx";
import {
  sendMessageToAlim,
  listChatSessions,
  fetchSessionMessages,
  synthesizeSpeech,
} from "./api";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAlimSpeaking, setIsAlimSpeaking] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [sessionList, setSessionList] = useState([]);

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
        const audioUrl = await synthesizeSpeech(response.answer);
        const audio = new Audio(audioUrl);
        audio.onended = () => setIsAlimSpeaking(false);
        audio.play();
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

  return (
    <div className={`App ${isAlimSpeaking ? "alim-speaking" : ""}`}>
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>✨ Alim History</h2>
          <p className="subtitle">Your spiritual guide</p>
        </div>

        <button onClick={startNewChat} className="new-chat-btn">
          <span className="btn-icon">🌟</span>+ New Conversation
        </button>

        <div className="session-list">
          {sessionList.length > 0 ? (
            sessionList.map((session) => (
              <div
                key={session.session_id}
                className={`session-item ${
                  session.session_id === currentSessionId ? "active" : ""
                }`}
                onClick={() => loadSessionMessages(session.session_id)}
              >
                <div className="session-icon">🕌</div>
                <div className="session-content">
                  <h4>{session.timestamp || "New session"}</h4>
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
          </div>
        </div>
      </div>

      <div className="main-content">
        <header className="chat-header">
          <div className="header-glow"></div>
          <h1>🌙 Alim Chat Paradise</h1>
          <p>
            Chat with Alim, your personal Islamic assistant in a space of
            serenity
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
