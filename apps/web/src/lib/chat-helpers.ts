// Chat helper functions
export async function closeChat(chatId: string, reason?: string) {
  const response = await fetch(`/api/chat/${chatId}/close`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    throw new Error('Failed to close chat');
  }

  return response.json();
}

export async function reopenChat(chatId: string) {
  const response = await fetch(`/api/chat/${chatId}/reopen`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to reopen chat');
  }

  return response.json();
}

export async function sendTypingIndicator(chatId: string, isTyping: boolean) {
  try {
    await fetch(`/api/chat/${chatId}/typing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isTyping }),
    });
  } catch (error) {
    console.error('Failed to send typing indicator:', error);
  }
}

export async function markMessageAsRead(messageId: string) {
  try {
    await fetch(`/api/chat/messages/${messageId}/read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Failed to mark message as read:', error);
  }
}

export async function fetchActiveChats() {
  const response = await fetch('/api/chat/active');
  
  if (!response.ok) {
    throw new Error('Failed to fetch active chats');
  }

  return response.json();
}

export async function fetchArchivedChats() {
  const response = await fetch('/api/chat/archived');
  
  if (!response.ok) {
    throw new Error('Failed to fetch archived chats');
  }

  return response.json();
}

