import { useState, useRef, useEffect } from "react";
import { transcribeAudio } from "../api";
import MicrophoneIcon from "./icons/MicrophoneIcon";
import StopIcon from "./icons/StopIcon";
import SendIcon from "./icons/SendIcon";
import "./ChatInput.css";

const ChatInput = ({ onSendMessage, isLoading, onVoiceSubmit }) => {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showVoiceFeedback, setShowVoiceFeedback] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message]);

  // Handle typing indicator
  useEffect(() => {
    if (message.trim()) {
      setIsTyping(true);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 1000);
    } else {
      setIsTyping(false);
    }

    return () => clearTimeout(typingTimeoutRef.current);
  }, [message]);

  const handleToggleRecording = async () => {
    if (isRecording) {
      handleStopRecording();
    } else {
      await handleStartRecording();
    }
  };

  const handleStartRecording = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };
        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          audioChunksRef.current = [];
          try {
            const data = await transcribeAudio(audioBlob);
            onVoiceSubmit(data.transcription);
          } catch (error) {
            console.error("Error transcribing audio:", error);
          }
          // Stop all tracks to release microphone
          stream.getTracks().forEach(track => track.stop());
        };
        mediaRecorderRef.current.start();
        setIsRecording(true);
        setShowVoiceFeedback(true);
      } catch (error) {
        console.error("Error accessing microphone:", error);
        alert("Could not access microphone. Please check your permissions.");
      }
    } else {
      alert("Voice recording is not supported in your browser.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setShowVoiceFeedback(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage("");
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
  };

  return (
    <div className="chat-input-container">
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <div className={`input-wrapper ${isTyping ? 'typing' : ''}`}>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Share your thoughts with divine serenity... ✨ (Shift+Enter for new line)"
            disabled={isLoading}
            rows={1}
            className="message-input"
            maxLength={2000}
          />
          <div className="input-glow"></div>
          {showVoiceFeedback && (
            <div className={`voice-feedback ${showVoiceFeedback ? 'show' : ''}`}>
              🎤 Recording... Speak clearly
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleToggleRecording}
          className={`mic-button ${isRecording ? "recording" : ""}`}
          disabled={isLoading}
          title={isRecording ? "Stop recording" : "Start voice input"}
        >
          {isRecording ? <StopIcon /> : <MicrophoneIcon />}
        </button>

        <button 
          type="submit" 
          disabled={isLoading || !message.trim()} 
          className="send-button"
          title="Send message"
        >
          <span className="button-content">
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Sending...
              </>
            ) : (
              <>
                <SendIcon />
                Send
              </>
            )}
          </span>
          <div className="button-glow"></div>
        </button>
      </form>
    </div>
  );
};

export default ChatInput;