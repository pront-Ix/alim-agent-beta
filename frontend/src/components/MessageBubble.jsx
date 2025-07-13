import React, { useState, useRef, useEffect } from 'react';
import "./MessageBubble.css";
import PlayIcon from './icons/PlayIcon.jsx';
import StopIcon from './icons/StopIcon.jsx'; // We'll reuse the stop icon
import { synthesizeArabicSpeech } from '../api';

const parseAlimResponse = ( text, onPlayArabic, isAudioLoading, isPlaying ) =>
{
  // ... (La fonction parseAlimResponse reste identique à la version précédente, mais on lui passe isPlaying)
  if ( !text ) return null;
  const parts = text.split( '\n---\n' );
  const mainAnswer = parts[ 0 ];
  const sourceBlock = parts.find( p => p.startsWith( '*Sources:*' ) );
  const arabicBlock = parts.find( p => p.startsWith( '*Texte Original' ) );

  const renderMainAnswer = ( answerText ) => (
    answerText.split( '\n' ).map( ( line, index ) => (
      <p key={index} className="text-line">
        {line.split( /\*\*(.*?)\*\*/g ).map( ( part, i ) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part )}
      </p>
    ) )
  );

  const renderSourceBlock = ( sourceText ) =>
  {
    if ( !sourceText ) return null;
    const lines = sourceText.replace( '*Sources:*\n', '' ).split( '\n' ).filter( line => line.trim() !== '' );
    return (
      <div className="source-container">
        <h4 className="source-title">Sources</h4>
        <ul className="source-list">
          {lines.map( ( line, index ) => (
            <li key={index} className="source-item">{line.replace( /^- /, '' )}</li>
          ) )}
        </ul>
      </div>
    );
  };

  const renderArabicBlock = ( arabicText ) =>
  {
    if ( !arabicText ) return null;
    const arabicContent = arabicText.replace( '*Texte Original (النص الأصلي):*\n', '' );
    return (
      <div className="arabic-container">
        <div className="arabic-header">
          <h4 className="arabic-title">Texte Original (النص الأصلي)</h4>
          <button onClick={() => onPlayArabic( arabicContent )} className="play-arabic-button" title="Écouter/Arrêter" disabled={isAudioLoading}>
            {isAudioLoading ? <span className="mini-spinner"></span> : ( isPlaying ? <StopIcon /> : <PlayIcon /> )}
          </button>
        </div>
        <p className="arabic-text">{arabicContent}</p>
      </div>
    );
  };

  return (
    <>
      {renderMainAnswer( mainAnswer )}
      {renderSourceBlock( sourceBlock )}
      {renderArabicBlock( arabicBlock )}
    </>
  );
};


const MessageBubble = ( { message, sender } ) =>
{
  const [ isAudioLoading, setIsAudioLoading ] = useState( false );
  const [ isPlaying, setIsPlaying ] = useState( false );

  // Use a ref to hold the audio object so we can access it to stop it
  const audioRef = useRef( null );

  // Stop audio when the component is unmounted (e.g., new chat)
  useEffect( () =>
  {
    return () =>
    {
      if ( audioRef.current )
      {
        audioRef.current.pause();
      }
    };
  }, [] );

  const handlePlayArabic = async ( arabicText ) =>
  {
    if ( isAudioLoading ) return;

    // If audio is currently playing, stop it.
    if ( isPlaying && audioRef.current )
    {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying( false );
      return;
    }

    setIsAudioLoading( true );
    try
    {
      const audioUrl = await synthesizeArabicSpeech( arabicText );
      const audio = new Audio( audioUrl );
      audioRef.current = audio; // Store the audio object

      audio.play();
      setIsPlaying( true );

      audio.onended = () =>
      {
        setIsPlaying( false );
        audioRef.current = null;
      };
      audio.onerror = () =>
      {
        console.error( "Error playing the audio file." );
        setIsPlaying( false );
        audioRef.current = null;
      };
    } catch ( error )
    {
      console.error( "Error synthesizing Arabic speech:", error );
    } finally
    {
      setIsAudioLoading( false );
    }
  };

  const isAlim = sender === 'alim';

  return (
    <div className={`message-row ${ sender }`}>
      {isAlim && (
        <img src="/alim-avatar.png" alt="Alim avatar" className="message-avatar" />
      )}
      <div className={`message-bubble ${ sender }`}>
        <div className="message-content">
          {isAlim ? parseAlimResponse( message, handlePlayArabic, isAudioLoading, isPlaying ) : <p className="text-line">{message}</p>}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;