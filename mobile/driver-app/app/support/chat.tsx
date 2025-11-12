import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { pusherService } from '../../services/pusher';
import { colors, typography, spacing, borderRadius, shadows } from '../../utils/theme';

interface Message {
  id: string;
  content: string;
  sender: 'driver' | 'admin';
  senderName: string;
  timestamp: string;
  createdAt: string;
}

export default function ChatScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (user?.driver?.id) {
      loadMessages();
      setupPusher();
    }
  }, [user?.driver?.id]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(`/api/driver/chat/history/${user?.driver?.id}`);
      
      if (response.success && response.data) {
        setMessages((response.data as any).messages || []);
        setTimeout(() => scrollToBottom(), 100);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupPusher = () => {
    if (!user?.driver?.id) return;

    try {
      // Listen for admin messages
      pusherService.bind('admin_message', (data: any) => {
        console.log('📨 Received admin message:', data);
        
        const newMessage: Message = {
          id: data.messageId || data.id,
          content: data.message || data.content,
          sender: 'admin',
          senderName: data.senderName || 'Support',
          timestamp: data.timestamp,
          createdAt: data.timestamp,
        };
        
        setMessages(prev => {
          // Prevent duplicates
          if (prev.some(m => m.id === newMessage.id)) {
            return prev;
          }
          return [...prev, newMessage];
        });
        
        setTimeout(() => scrollToBottom(), 100);
      });
    } catch (error) {
      console.log('⚠️ Pusher setup skipped - not critical for chat functionality');
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !user?.driver?.id) return;

    const messageText = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const response = await apiService.post('/api/driver/chat/send', {
        driverId: user.driver.id,
        message: messageText,
        timestamp: new Date().toISOString(),
      });

      if (response.success) {
        // Add message to local state
        const newMessage: Message = {
          id: (response.data as any)?.messageId || Date.now().toString(),
          content: messageText,
          sender: 'driver',
          senderName: user.name || 'You',
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };
        
        setMessages(prev => [...prev, newMessage]);
        setTimeout(() => scrollToBottom(), 100);
      } else {
        Alert.alert('Error', 'Failed to send message');
        setInputText(messageText); // Restore message
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message');
      setInputText(messageText); // Restore message
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <View style={styles.backButtonCircle}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.onlineIndicator}>
            <View style={styles.onlineDot} />
            <Text style={styles.headerTitle}>Support Chat</Text>
          </View>
          <Text style={styles.headerSubtitle}>We typically reply within minutes</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Messages */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={scrollToBottom}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyContainer} key="empty-state">
              <Ionicons name="chatbubbles-outline" size={64} color={colors.text.disabled} />
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>
                Start a conversation with our support team
              </Text>
            </View>
          ) : (
            <>
              {messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageBubble,
                    message.sender === 'driver' ? styles.myMessage : styles.theirMessage,
                  ]}
                >
                  {message.sender === 'admin' && (
                    <Text style={styles.senderName}>{message.senderName}</Text>
                  )}
                  <Text
                    style={[
                      styles.messageText,
                      message.sender === 'driver' && styles.myMessageText,
                    ]}
                  >
                    {message.content}
                  </Text>
                  <Text
                    style={[
                      styles.messageTime,
                      message.sender === 'driver' && styles.myMessageTime,
                    ]}
                  >
                    {formatTime(message.timestamp)}
                  </Text>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          placeholderTextColor={colors.text.disabled}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
          editable={!sending}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={colors.text.inverse} />
          ) : (
            <Ionicons name="send" size={20} color={colors.text.inverse} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Matches splash screen
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xxl + spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyText: {
    ...typography.h4,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.text.disabled,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: 18,
    marginBottom: spacing.sm,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(30, 64, 175, 0.1)',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  senderName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  messageText: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 21,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 10,
    color: '#999',
    marginTop: 6,
    textAlign: 'right',
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    paddingBottom: spacing.md + (Platform.OS === 'ios' ? 20 : 0),
    backgroundColor: 'rgba(30, 64, 175, 0.1)',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    borderRadius: 20,
    padding: spacing.md,
    paddingHorizontal: spacing.md + 4,
    fontSize: 15,
    color: '#000000',
    maxHeight: 100,
    minHeight: 40,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonDisabled: {
    opacity: 0.4,
    backgroundColor: '#C7C7CC',
  },
});

