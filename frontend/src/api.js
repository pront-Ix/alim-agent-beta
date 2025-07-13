const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export const sendMessageToAlim = async (message, sessionId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: message, session_id: sessionId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error communicating with Alim.');
    }

    const data = await response.json();
    return data; // Contains { answer: "...", session_id: "..." }
  } catch (error) {
    console.error('Error sending message to Alim:', error);
    throw error;
  }
};

export const listChatSessions = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/chat/sessions`);
    if (!response.ok) {
      throw new Error('Error fetching sessions.');
    }
    const data = await response.json();
    return data; // Returns List[SessionInfo]
  } catch (error) {
    console.error('Error listing sessions:', error);
    return [];
  }
};

export const fetchSessionMessages = async (sessionId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/chat/sessions/${sessionId}`);
    if (!response.ok) {
      throw new Error('Error fetching session messages.');
    }
    const data = await response.json();
    // Messages are in the format { message: "...", sender: "..." }
    return data.map(msg => ({ text: msg.message, sender: msg.sender === 'human' ? 'user' : 'alim' }));
  } catch (error) {
    console.error(`Error retrieving messages for session ${sessionId}:`, error);
    return [];
  }
};
