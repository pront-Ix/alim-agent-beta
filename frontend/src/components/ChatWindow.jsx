import { useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";
import LoadingStatus from "./LoadingStatus.jsx";
import "./ChatWindow.css";

const ChatWindow = ({ messages, isLoading }) => {
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      const isScrolledToBottom = chatContainer.scrollHeight - chatContainer.clientHeight <= chatContainer.scrollTop + 1;
      if (isScrolledToBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages]);

  const EmptyState = () => (
    <div className="empty-chat-state">
      <div className="icon">✨</div>
      <h3>Welcome to Alim</h3>
      <p>
        Ask me anything about Islam, and I'll provide you with authentic and trusted knowledge 
        from the Quran and Sunnah. Let's begin this blessed journey together.
      </p>
    </div>
  );

  return (
    <div className="chat-window" ref={chatContainerRef}>
      <div className="messages-container">
        {messages.length === 0 && !isLoading ? (
          <EmptyState />
        ) : (
          messages.map((msg, index) => (
            <MessageBubble key={index} message={msg.text} sender={msg.sender} />
          ))
        )}
        {isLoading && <LoadingStatus text="Alim is preparing your answer..." />}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatWindow;
