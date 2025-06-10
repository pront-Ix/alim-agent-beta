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
      throw new Error(errorData.detail || 'Erreur lors de la communication avec Alim.');
    }

    const data = await response.json();
    return data; // Contient { answer: "...", session_id: "..." }
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message à Alim:', error);
    throw error;
  }
};

export const listChatSessions = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/chat/sessions`);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des sessions.');
    }
    const data = await response.json();
    return data; // Retourne List[SessionInfo]
  } catch (error) {
    console.error('Erreur lors du listage des sessions:', error);
    return [];
  }
};

export const fetchSessionMessages = async (sessionId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/chat/sessions/${sessionId}`);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des messages de session.');
    }
    const data = await response.json();
    // Les messages sont dans le format { message: "...", sender: "..." }
    return data.map(msg => ({ text: msg.message, sender: msg.sender === 'human' ? 'user' : 'alim' }));
  } catch (error) {
    console.error(`Erreur lors de la récupération des messages pour la session ${sessionId}:`, error);
    return [];
  }
};