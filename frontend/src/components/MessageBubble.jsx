import React from 'react';
import "./MessageBubble.css";

const parseAlimResponse = ( text )
{
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

  const renderSourceBlock = ( sourceText )
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

  const renderArabicBlock = ( arabicText )
  {
    if ( !arabicText ) return null;
    const arabicContent = arabicText.replace( '*Texte Original (النص الأصلي):*\n', '' );
    return (
      <div className="arabic-container">
        <div className="arabic-header">
          <h4 className="arabic-title">Texte Original (النص الأصéli)</h4>
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


const MessageBubble = ( { message, sender } )
{
  const isAlim = sender === 'alim';

  return (
    <div className={`message-row ${ sender }`}>
      {isAlim && (
        <img src="/alim-avatar.png" alt="Alim avatar" className="message-avatar" />
      )}
      <div className={`message-bubble ${ sender }`}>
        <div className="message-content">
          {isAlim ? parseAlimResponse( message ) : <p className="text-line">{message}</p>}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;