const fetch = require('node-fetch');

async function testGuestChat() {
  try {
    console.log('🧪 Testing Guest Chat Functionality...\n');

    // Test 1: Create a guest chat session
    console.log('1. Creating guest chat session...');
    const guestChatResponse = await fetch(
      'http://localhost:3000/api/chat/guest',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Guest',
          email: 'test@example.com',
          message: 'Hello! I need help with my booking.',
        }),
      }
    );

    if (!guestChatResponse.ok) {
      const errorText = await guestChatResponse.text();
      throw new Error(
        `Guest chat creation failed: ${guestChatResponse.status} - ${errorText}`
      );
    }

    const guestChatData = await guestChatResponse.json();
    console.log('✅ Guest chat session created successfully');
    console.log(`   Session ID: ${guestChatData.sessionId}\n`);

    // Test 2: Fetch messages from the session
    console.log('2. Fetching messages from session...');
    const messagesResponse = await fetch(
      `http://localhost:3000/api/chat/sessions/${guestChatData.sessionId}/messages`
    );

    if (!messagesResponse.ok) {
      const errorText = await messagesResponse.text();
      throw new Error(
        `Message fetch failed: ${messagesResponse.status} - ${errorText}`
      );
    }

    const messages = await messagesResponse.json();
    console.log('✅ Messages fetched successfully');
    console.log(`   Message count: ${messages.length}`);
    console.log(`   First message: ${messages[0]?.content}\n`);

    // Test 3: Fetch chat sessions
    console.log('3. Fetching chat sessions...');
    const sessionsResponse = await fetch(
      'http://localhost:3000/api/chat/sessions'
    );

    if (!sessionsResponse.ok) {
      const errorText = await sessionsResponse.text();
      throw new Error(
        `Sessions fetch failed: ${sessionsResponse.status} - ${errorText}`
      );
    }

    const sessions = await sessionsResponse.json();
    console.log('✅ Chat sessions fetched successfully');
    console.log(`   Total sessions: ${sessions.length}`);

    const guestSession = sessions.find(s => s.id === guestChatData.sessionId);
    if (guestSession) {
      console.log(`   Guest session found: ${guestSession.title}`);
      console.log(`   Participants: ${guestSession.participants.length}`);
    }

    console.log(
      '\n🎉 All tests passed! Guest chat functionality is working correctly.'
    );
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testGuestChat();
