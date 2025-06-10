import { useState, useEffect } from "react"
import ChatWindow from "./components/ChatWindow.jsx"
import ChatInput from "./components/ChatInput.jsx"
import { sendMessageToAlim, listChatSessions, fetchSessionMessages } from "./api"
import "./App.css"

function App() {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState(null)
  const [sessionList, setSessionList] = useState([])

  // Récupérer les sessions au chargement de l'application
  useEffect(() => {
    // Fonction pour générer un UUID v4 simple
    const generateUUID = () => {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        var r = (Math.random() * 16) | 0,
          v = c === "x" ? r : (r & 0x3) | 0x8
        return v.toString(16)
      })
    }

    const loadInitialData = async () => {
      // Tenter de charger le session_id depuis le localStorage
      let storedSessionId = localStorage.getItem("alim_session_id")
      let newSession = false

      if (!storedSessionId) {
        storedSessionId = generateUUID()
        localStorage.setItem("alim_session_id", storedSessionId)
        newSession = true
      }
      setCurrentSessionId(storedSessionId)
      console.log("Initial Session ID:", storedSessionId, "New session:", newSession)

      // Charger la liste des sessions disponibles
      const sessions = await listChatSessions()
      setSessionList(sessions)

      // Si c'est une nouvelle session, ou si la session stockée n'est pas dans la liste,
      // démarrer avec un chat vide. Sinon, charger les messages de la session.
      const sessionExists = sessions.some((s) => s.session_id === storedSessionId)

      if (newSession || !sessionExists) {
        setMessages([]) // Démarrer une nouvelle conversation vide
        console.log("Starting a new conversation.")
      } else {
        // Charger les messages de la session existante
        await loadSessionMessages(storedSessionId)
      }
    }

    loadInitialData()
  }, []) // Exécuter une seule fois au montage du composant

  // Fonction pour charger les messages d'une session donnée
  const loadSessionMessages = async (sessionId) => {
    setIsLoading(true)
    try {
      const msgs = await fetchSessionMessages(sessionId)
      setMessages(msgs)
      setCurrentSessionId(sessionId) // Mettre à jour la session active
      localStorage.setItem("alim_session_id", sessionId) // Sauvegarder dans localStorage
      console.log(`Loaded messages for session: ${sessionId}`)
    } catch (error) {
      console.error("Erreur lors du chargement des messages de session:", error)
      setMessages([{ text: "Impossible de charger cette conversation.", sender: "alim" }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async (userMessage) => {
    if (!currentSessionId) {
      console.error("Session ID is not set. Cannot send message.")
      return
    }

    const newUserMessage = { text: userMessage, sender: "user" }
    setMessages((prevMessages) => [...prevMessages, newUserMessage])
    setIsLoading(true)

    try {
      const response = await sendMessageToAlim(userMessage, currentSessionId)
      const alimResponse = { text: response.answer, sender: "alim" }
      setMessages((prevMessages) => [...prevMessages, alimResponse])

      // Après l'envoi d'un message, rafraîchir la liste des sessions
      const updatedSessions = await listChatSessions()
      setSessionList(updatedSessions)
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error)
      const errorMessage = { text: "Désolé, une erreur est survenue. Veuillez réessayer plus tard.", sender: "alim" }
      setMessages((prevMessages) => [...prevMessages, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const startNewChat = async () => {
    const newSessionId = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      var r = (Math.random() * 16) | 0,
        v = c === "x" ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
    setMessages([]) // Vider les messages pour la nouvelle session
    setCurrentSessionId(newSessionId)
    localStorage.setItem("alim_session_id", newSessionId) // Mettre à jour localStorage
    const updatedSessions = await listChatSessions() // Rafraîchir la liste pour inclure la potentielle nouvelle session vide
    setSessionList(updatedSessions)
    console.log("Started new chat with ID:", newSessionId)
  }

  return (
    <div className="App">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>✨ Historique Alim</h2>
          <p className="subtitle">Votre guide spirituel</p>
        </div>

        <button onClick={startNewChat} className="new-chat-btn">
          <span className="btn-icon">🌟</span>+ Nouvelle Conversation
        </button>

        <div className="session-list">
          {sessionList.length > 0 ? (
            sessionList.map((session) => (
              <div
                key={session.session_id}
                className={`session-item ${session.session_id === currentSessionId ? "active" : ""}`}
                onClick={() => loadSessionMessages(session.session_id)}
              >
                <div className="session-icon">🕌</div>
                <div className="session-content">
                  <h4>{session.timestamp || "Nouvelle session"}</h4>
                  <p>{session.last_message_preview || "Aucun message encore..."}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="no-sessions">Aucune conversation trouvée.</p>
          )}
        </div>

        <div className="sidebar-footer">
          <div className="spiritual-quote">"Et c'est dans le rappel d'Allah que les cœurs trouvent leur sérénité"</div>
        </div>
      </div>

      <div className="main-content">
        <header className="chat-header">
          <div className="header-glow"></div>
          <h1>🌙 Alim Chat Paradise</h1>
          <p>Discutez avec Alim, votre assistant islamique personnel dans un espace de sérénité</p>
        </header>
        <ChatWindow messages={messages} isLoading={isLoading} />
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  )
}

export default App