// Using built-in fetch (available in Node.js 18+)

async function testGuestChatFixed() {
  try {
    console.log('🧪 Testing Fixed Guest Chat Functionality...\n');

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
          name: 'Test Guest Fixed',
          email: 'test-fixed@example.com',
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

    // Test 2: Fetch messages from the session (with guest email)
    console.log('2. Fetching messages from session with guest email...');
    const messagesResponse = await fetch(
      `http://localhost:3000/api/chat/sessions/${guestChatData.sessionId}/messages?guestEmail=${encodeURIComponent('test-fixed@example.com')}`
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
    console.log(`   First message: ${messages[0]?.content}`);
    console.log(
      `   Message metadata: ${JSON.stringify(messages[0]?.metadata)}\n`
    );

    // Test 3: Send a message as guest
    console.log('3. Sending message as guest...');
    const sendMessageResponse = await fetch(
      `http://localhost:3000/api/chat/sessions/${guestChatData.sessionId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: 'This is a test message from the guest',
          type: 'text',
          guestEmail: 'test-fixed@example.com',
        }),
      }
    );

    if (!sendMessageResponse.ok) {
      const errorText = await sendMessageResponse.text();
      throw new Error(
        `Send message failed: ${sendMessageResponse.status} - ${errorText}`
      );
    }

    const sentMessage = await sendMessageResponse.json();
    console.log('✅ Message sent successfully');
    console.log(`   Message ID: ${sentMessage.id}`);
    console.log(`   Message content: ${sentMessage.content}`);
    console.log(
      `   Message metadata: ${JSON.stringify(sentMessage.metadata)}\n`
    );

    // Test 4: Fetch messages again to see the new message
    console.log('4. Fetching messages again to verify new message...');
    const messagesResponse2 = await fetch(
      `http://localhost:3000/api/chat/sessions/${guestChatData.sessionId}/messages?guestEmail=${encodeURIComponent('test-fixed@example.com')}`
    );

    if (!messagesResponse2.ok) {
      const errorText = await messagesResponse2.text();
      throw new Error(
        `Message fetch failed: ${messagesResponse2.status} - ${errorText}`
      );
    }

    const messages2 = await messagesResponse2.json();
    console.log('✅ Messages fetched successfully');
    console.log(`   Updated message count: ${messages2.length}`);
    console.log(
      `   Latest message: ${messages2[messages2.length - 1]?.content}\n`
    );

    console.log(
      '🎉 All tests passed! Guest chat functionality is working correctly with fixes.'
    );
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testGuestChatFixed();
