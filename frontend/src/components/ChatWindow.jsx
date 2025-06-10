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

  return (
    <div className="chat-window">
      <div className="messages-container">
        {messages.map((msg, index) => (
          <MessageBubble key={index} message={msg.text} sender={msg.sender} />
        ))}
        {isLoading && (
          <LoadingStatus /> 
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

export default ChatWindow
