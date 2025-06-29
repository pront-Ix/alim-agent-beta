import { useState, useRef } from "react";
import { transcribeAudio } from "../api";
import "./ChatInput.css";

const ChatInput = ({ onSendMessage, isLoading, onVoiceSubmit }) => {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

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
        };
        mediaRecorderRef.current.start();
        setIsRecording(true);
      } catch (error) {
        console.error("Error accessing microphone:", error);
      }
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="chat-input-container">
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <div className="input-wrapper">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write your message with serenity... ✨ (Shift+Enter for a new line)"
            disabled={isLoading}
            rows={1}
            className="message-input"
          />
          <div className="input-glow"></div>
        </div>

        <button
          type="button"
          onClick={handleToggleRecording}
          className={`mic-button ${isRecording ? "recording" : ""}`}
        >
          <span className="mic-icon">{isRecording ? "🛑" : "🎤"}</span>
        </button>

        <button type="submit" disabled={isLoading || !message.trim()} className="send-button">
          <span className="button-content">
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Sending...
              </>
            ) : (
              <>
                <span className="send-icon"></span>
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
