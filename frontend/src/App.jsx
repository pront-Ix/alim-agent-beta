import { useState, useEffect } from "react";
import ChatWindow from "./components/ChatWindow.jsx";
import ChatInput from "./components/ChatInput.jsx";
import
  {
    sendMessageToAlim,
    listChatSessions,
    fetchSessionMessages,
    synthesizeSpeech,
  } from "./api";
import NewConversationIcon from "./components/icons/NewConversationIcon.jsx";
import MosqueIcon from "./components/icons/MosqueIcon.jsx";
import "./App.css";

function App ()
{
  const [ messages, setMessages ] = useState( [] );
  const [ isLoading, setIsLoading ] = useState( false );
  const [ isAlimSpeaking, setIsAlimSpeaking ] = useState( false );
  const [ currentSessionId, setCurrentSessionId ] = useState( null );
  const [ sessionList, setSessionList ] = useState( [] );
  const [ isSessionsLoading, setIsSessionsLoading ] = useState( true );
  const [ isSidebarOpen, setIsSidebarOpen ] = useState( false );

  // Fetch sessions on application load
  useEffect( () =>
  {
    // Function to generate a simple UUID v4
    const generateUUID = () =>
    {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace( /[xy]/g, ( c ) =>
      {
        var r = ( Math.random() * 16 ) | 0,
          v = c === "x" ? r : ( r & 0x3 ) | 0x8;
        return v.toString( 16 );
      } );
    };

    const loadInitialData = async () =>
    {
      setIsSessionsLoading( true );

      let storedSessionId = localStorage.getItem( "alim_session_id" );
      let newSession = false;

      if ( !storedSessionId )
      {
        storedSessionId = generateUUID();
        localStorage.setItem( "alim_session_id", storedSessionId );
        newSession = true;
      }
      setCurrentSessionId( storedSessionId );

      const sessions = await listChatSessions();
      setSessionList( sessions );

      const sessionExists = sessions.some(
        ( s ) => s.session_id === storedSessionId
      );

      if ( newSession || !sessionExists )
      {
        setMessages( [] );
      } else
      {
        await loadSessionMessages( storedSessionId );
      }

      setIsSessionsLoading( false );
    };

    loadInitialData();
  }, [] );

  // Function to load messages for a given session
  const loadSessionMessages = async ( sessionId ) =>
  {
    setIsLoading( true );
    try
    {
      const msgs = await fetchSessionMessages( sessionId );
      setMessages( msgs );
      setCurrentSessionId( sessionId );
      localStorage.setItem( "alim_session_id", sessionId );
    } catch ( error )
    {
      console.error( "Error loading session messages:", error );
      setMessages( [
        { text: "Could not load this conversation.", sender: "alim" },
      ] );
    } finally
    {
      setIsLoading( false );
    }
  };

  // --- KEY CHANGE IS IN THIS FUNCTION ---
  const handleSendMessage = async ( userMessage, isVoiceInput = false ) =>
  {
    if ( !currentSessionId )
    {
      console.error( "Session ID is not set. Cannot send message." );
      return;
    }

    const newUserMessage = { text: userMessage, sender: "user" };
    setMessages( ( prevMessages ) => [ ...prevMessages, newUserMessage ] );
    setIsLoading( true );

    try
    {
      const response = await sendMessageToAlim( userMessage, currentSessionId );
      const alimResponseText = response.answer;

      const alimResponseObject = { text: alimResponseText, sender: "alim" };
      setMessages( ( prevMessages ) => [ ...prevMessages, alimResponseObject ] );

      // --- CRITICAL CHANGE FOR TTS ---
      // We only read the main answer, not the sources or Arabic text.
      if ( isVoiceInput && alimResponseText )
      {
        setIsAlimSpeaking( true );
        try
        {
          // 1. Split the full response by our separator '---'
          const responseParts = alimResponseText.split( '\n---\n' );
          // 2. The text to read is only the first part (the narrative answer)
          const textToRead = responseParts[ 0 ].trim();

          // 3. Synthesize speech only for that part, if it exists
          if ( textToRead )
          {
            const audioUrl = await synthesizeSpeech( textToRead );
            const audio = new Audio( audioUrl );
            audio.onended = () => setIsAlimSpeaking( false );
            audio.onerror = () =>
            {
              console.error( "Error playing synthesized speech." );
              setIsAlimSpeaking( false );
            };
            audio.play();
          } else
          {
            // If there's no text to read, just stop the speaking indicator
            setIsAlimSpeaking( false );
          }
        } catch ( error )
        {
          console.error( "Error with speech synthesis:", error );
          setIsAlimSpeaking( false );
        }
      }

      const updatedSessions = await listChatSessions();
      setSessionList( updatedSessions );
    } catch ( error )
    {
      console.error( "Error sending message:", error );
      const errorMessage = {
        text: "Sorry, an error occurred. Please try again later.",
        sender: "alim",
      };
      setMessages( ( prevMessages ) => [ ...prevMessages, errorMessage ] );
    } finally
    {
      setIsLoading( false );
    }
  };

  const startNewChat = async () =>
  {
    const newSessionId = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace( /[xy]/g, c =>
    {
      var r = ( Math.random() * 16 ) | 0, v = c === 'x' ? r : ( r & 0x3 | 0x8 );
      return v.toString( 16 );
    } );
    setMessages( [] );
    setCurrentSessionId( newSessionId );
    localStorage.setItem( "alim_session_id", newSessionId );
    // You might want to add the new empty session to the list visually
    const updatedSessions = await listChatSessions();
    setSessionList( updatedSessions );
  };

  const toggleSidebar = () =>
  {
    setIsSidebarOpen( !isSidebarOpen );
  };

  const closeSidebar = () =>
  {
    setIsSidebarOpen( false );
  };

  const formatSessionTime = ( timestamp ) =>
  {
    if ( !timestamp ) return "New session";
    const date = new Date( timestamp );
    const now = new Date();
    const diffInHours = ( now - date ) / ( 1000 * 60 * 60 );
    if ( diffInHours < 24 )
    {
      return date.toLocaleTimeString( [], { hour: '2-digit', minute: '2-digit' } );
    } else if ( diffInHours < 168 )
    {
      return date.toLocaleDateString( [], { weekday: 'short', hour: '2-digit', minute: '2-digit' } );
    } else
    {
      return date.toLocaleDateString( [], { month: 'short', day: 'numeric' } );
    }
  };

  return (
    <div className={`App ${ isAlimSpeaking ? "alim-speaking" : "" }`}>
      <button className="mobile-menu-toggle" onClick={toggleSidebar}>
        ☰
      </button>

      <div className={`mobile-overlay ${ isSidebarOpen ? 'show' : '' }`} onClick={closeSidebar}></div>

      <div className={`sidebar ${ isSidebarOpen ? 'show' : '' }`}>
        <div className="sidebar-header">
          <h2>✨ Alim History</h2>
          <p className="subtitle">Your spiritual companion</p>
        </div>

        <button onClick={startNewChat} className="new-chat-btn">
          <NewConversationIcon />
          New Conversation
        </button>

        <div className="session-list">
          {isSessionsLoading ? (
            <div className="loading-shimmer" style={{ height: '60px', borderRadius: '16px', margin: '12px 0' }}></div>
          ) : sessionList.length > 0 ? (
            sessionList.map( ( session ) => (
              <div
                key={session.session_id}
                className={`session-item ${ session.session_id === currentSessionId ? "active" : ""
                  }`}
                onClick={() =>
                {
                  loadSessionMessages( session.session_id );
                  closeSidebar();
                }}
              >
                <div className="session-icon">
                  <MosqueIcon />
                </div>
                <div className="session-content">
                  <h4>{formatSessionTime( session.timestamp )}</h4>
                  <p>
                    {session.last_message_preview || "No messages yet..."}
                  </p>
                </div>
              </div>
            ) )
          ) : (
            <p className="no-sessions">No conversations found.</p>
          )}
        </div>

        <div className="sidebar-footer">
          <div className="spiritual-quote">
            "Verily, in the remembrance of Allah do hearts find rest"
            <br />
            <small style={{ opacity: 0.7, fontSize: '0.8rem' }}>— Quran 13:28</small>
          </div>
        </div>
      </div>

      <div className="main-content">
        <header className="chat-header">
          <div className="header-glow"></div>
          <h1>✨Alim</h1>
          <p>
            Your trusted Islamic knowledge companion in a space of divine serenity ✨
          </p>
        </header>
        <ChatWindow messages={messages} isLoading={isLoading} />
        <ChatInput
          onSendMessage={handleSendMessage}
          onVoiceSubmit={( transcription ) => handleSendMessage( transcription, true )}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

export default App;