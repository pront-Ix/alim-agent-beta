import { useState, useRef, useEffect } from "react";
import { transcribeAudio } from "../api";
import MicrophoneIcon from "./icons/MicrophoneIcon";
import StopIcon from "./icons/StopIcon";
import SendIcon from "./icons/SendIcon";
import PlusIcon from "./icons/PlusIcon"; // The new icon
import "./ChatInput.css";

const ChatInput = ( { onSendMessage, isLoading, onVoiceSubmit } ) =>
{
  const [ message, setMessage ] = useState( "" );
  const [ isRecording, setIsRecording ] = useState( false );
  const [ showVoiceFeedback, setShowVoiceFeedback ] = useState( false ); // We can repurpose this for a visual cue
  const textareaRef = useRef( null );
  const mediaRecorderRef = useRef( null );
  const audioChunksRef = useRef( [] );

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

  // --- AUDIO RECORDING LOGIC (Re-integrated) ---

  const handleToggleRecording = async () =>
  {
    if ( isRecording )
    {
      handleStopRecording();
    } else
    {
      await handleStartRecording();
    }
  };

  const handleStartRecording = async () =>
  {
    if ( navigator.mediaDevices && navigator.mediaDevices.getUserMedia )
    {
      try
      {
        const stream = await navigator.mediaDevices.getUserMedia( { audio: true } );
        mediaRecorderRef.current = new MediaRecorder( stream );
        audioChunksRef.current = []; // Clear previous chunks

        mediaRecorderRef.current.ondataavailable = ( event ) =>
        {
          audioChunksRef.current.push( event.data );
        };

        mediaRecorderRef.current.onstop = async () =>
        {
          const audioBlob = new Blob( audioChunksRef.current, { type: 'audio/webm' } );
          stream.getTracks().forEach( track => track.stop() ); // Release microphone

          if ( audioBlob.size > 0 )
          {
            try
            {
              const data = await transcribeAudio( audioBlob );
              onVoiceSubmit( data.transcription );
            } catch ( error )
            {
              console.error( "Error transcribing audio:", error );
              alert( "Sorry, there was an error processing the audio." );
            }
          }
        };

        mediaRecorderRef.current.start();
        setIsRecording( true );
        setShowVoiceFeedback( true ); // You can use this to show a visual indicator
      } catch ( error )
      {
        console.error( "Error accessing microphone:", error );
        alert( "Could not access microphone. Please check your permissions in the browser settings." );
      }
    } else
    {
      alert( "Voice recording is not supported in your browser." );
    }
  };

  const handleStopRecording = () =>
  {
    if ( mediaRecorderRef.current && isRecording )
    {
      mediaRecorderRef.current.stop();
      setIsRecording( false );
      setShowVoiceFeedback( false );
    }
  };

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
              type="button"
              onClick={handleToggleRecording}
              className={`icon-button mic-button ${ isRecording ? "recording" : "" }`}
              disabled={isLoading}
              title={isRecording ? "Stop recording" : "Start voice input"}
            >
              {isRecording ? <StopIcon /> : <MicrophoneIcon />}
            </button>
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