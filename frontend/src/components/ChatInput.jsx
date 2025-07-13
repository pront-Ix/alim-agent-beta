import { useState, useRef, useEffect } from "react";
import SendIcon from "./icons/SendIcon";
import PlusIcon from "./icons/PlusIcon"; // The new icon
import "./ChatInput.css";

const ChatInput = ( { onSendMessage, isLoading } ) =>
{
  const [ message, setMessage ] = useState( "" );
  const textareaRef = useRef( null );

  // Auto-resize textarea
  useEffect( () =>
  {
    if ( textareaRef.current )
    {
      textareaRef.current.style.height = 'auto';
      const maxHeight = 180; // Set a max-height
      const newHeight = Math.min( textareaRef.current.scrollHeight, maxHeight );
      textareaRef.current.style.height = newHeight + 'px';
    }
  }, [ message ] );

  // --- FORM SUBMISSION LOGIC ---

  const handleSubmit = ( e ) =>
  {
    e.preventDefault();
    if ( message.trim() && !isLoading )
    {
      onSendMessage( message );
      setMessage( "" );
    }
  };

  const handleKeyDown = ( e ) =>
  {
    if ( e.key === "Enter" && !e.shiftKey )
    {
      e.preventDefault();
      handleSubmit( e );
    }
  };

  return (
    <div className="chat-input-container">
      <form onSubmit={handleSubmit} className="chat-input-form">

        <div className="textarea-wrapper">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={( e ) => setMessage( e.target.value )}
            onKeyDown={handleKeyDown}
            placeholder="Ask Alim..."
            disabled={isLoading}
            rows={1}
            className="message-input"
          />
        </div>

        <div className="action-bar">
          <div className="action-bar-left">
            <button type="button" className="icon-button attachment-button" title="Add attachment (coming soon)">
              <PlusIcon />
            </button>
          </div>

          <div className="action-bar-right">
            <button
              type="submit"
              disabled={isLoading || !message.trim()}
              className="icon-button send-button"
              title="Send message"
            >
              {isLoading ? <span className="loading-spinner"></span> : <SendIcon />}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;