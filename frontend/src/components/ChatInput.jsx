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
        
        // Check for supported MIME types
        const options = {
          mimeType: 'audio/webm;codecs=opus'
        };
        
        // Fallback to other formats if webm is not supported
        if (!MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          if (MediaRecorder.isTypeSupported('audio/mp4')) {
            options.mimeType = 'audio/mp4';
          } else if (MediaRecorder.isTypeSupported('audio/webm')) {
            options.mimeType = 'audio/webm';
          } else {
            options.mimeType = 'audio/wav';
          }
        }
        
        mediaRecorderRef.current = new MediaRecorder( stream, options );
        audioChunksRef.current = []; // Clear previous chunks

        mediaRecorderRef.current.ondataavailable = ( event ) =>
        {
          if (event.data.size > 0) {
            audioChunksRef.current.push( event.data );
          }
        };

        mediaRecorderRef.current.onstop = async () =>
        {
          const mimeType = mediaRecorderRef.current.mimeType || 'audio/webm';
          const audioBlob = new Blob( audioChunksRef.current, { type: mimeType } );
          
          // Clean up stream
          stream.getTracks().forEach( track => track.stop() );

          if ( audioBlob.size > 0 )
          {
            try
            {
              console.log(`Sending audio blob of size: ${audioBlob.size} bytes, type: ${mimeType}`);
              const data = await transcribeAudio( audioBlob );
              if (data && data.transcription) {
                onVoiceSubmit( data.transcription );
              } else {
                console.error("No transcription received");
                alert("No speech was detected. Please try again.");
              }
            } catch ( error )
            {
              console.error( "Error transcribing audio:", error );
              alert( `Sorry, there was an error processing the audio: ${error.message}` );
            }
          } else {
            console.warn("Audio blob is empty");
            alert("No audio was recorded. Please try again.");
          }
        };

        mediaRecorderRef.current.onerror = (event) => {
          console.error("MediaRecorder error:", event.error);
          alert("Recording error occurred. Please try again.");
          setIsRecording(false);
          setShowVoiceFeedback(false);
        };

        mediaRecorderRef.current.start(1000); // Record in 1-second chunks
        setIsRecording( true );
        setShowVoiceFeedback( true );
        
        console.log(`Started recording with MIME type: ${options.mimeType}`);
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
