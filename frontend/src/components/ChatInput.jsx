import { useState } from "react"
import "./ChatInput.css"

const ChatInput = ({ onSendMessage, isLoading }) => {
  const [message, setMessage] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    if (message.trim() && !isLoading) {
      onSendMessage(message)
      setMessage("") // Vide le champ après l'envoi
    }
  }

  const handleKeyDown = (e) => {
    // Envoie le message avec Enter uniquement
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="chat-input-container">
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <div className="input-wrapper">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écrivez votre message avec sérénité... ✨ (Shift+Enter pour nouvelle ligne)"
            disabled={isLoading}
            rows={1}
            className="message-input"
          />
          <div className="input-glow"></div>
        </div>

        <button type="submit" disabled={isLoading || !message.trim()} className="send-button">
          <span className="button-content">
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Envoi...
              </>
            ) : (
              <>
                <span className="send-icon"></span>
                Envoyer
              </>
            )}
          </span>
          <div className="button-glow"></div>
        </button>
      </form>
    </div>
  )
}

export default ChatInput
