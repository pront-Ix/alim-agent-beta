import { useRef, useEffect, useState } from "react";
import MessageBubble from "./MessageBubble";
import LoadingStatus from "./LoadingStatus.jsx";
import "./ChatWindow.css";

const ChatWindow = ({ messages, isLoading }) => {
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [isUserScrolled, setIsUserScrolled] = useState(false);

  const handleScroll = () => {
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const atBottom = scrollHeight - scrollTop <= clientHeight + 50; // 50px tolerance
    setIsUserScrolled(!atBottom);
  };

  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    chatContainer.addEventListener('scroll', handleScroll);
    return () => {
      chatContainer.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    if (!isUserScrolled) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, isUserScrolled]);

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
