import { useRef, useEffect } from "react"
import MessageBubble from "./MessageBubble"
import LoadingStatus from "./LoadingStatus.jsx"
import "./ChatWindow.css"

const ChatWindow = ({ messages, isLoading }) => {
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const EmptyState = () => (
    <div className="empty-chat-state">
      <div className="icon">✨</div>
      <h3>Welcome to Alim Paradise</h3>
      <p>
        Ask me anything about Islam, and I'll provide you with authentic knowledge 
        from the Quran and Sunnah. Let's begin this blessed journey together.
      </p>
    </div>
  )

  return (
    <div className="chat-window">
      <div className="messages-container">
        {messages.length === 0 && !isLoading ? (
          <EmptyState />
        ) : (
          messages.map((msg, index) => (
            <MessageBubble key={index} message={msg.text} sender={msg.sender} />
          ))
        )}
        {isLoading && (
          <LoadingStatus text="Alim is reflecting" /> 
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

export default ChatWindow