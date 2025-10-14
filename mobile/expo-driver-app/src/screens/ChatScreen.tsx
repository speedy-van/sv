import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import apiService from '../services/api.service';
import pusherService from '../services/pusher.service';
import { getUser } from '../services/storage.service';

interface Message {
  id: string;
  content: string;
  sender: 'driver' | 'admin';
  timestamp: Date;
  senderName?: string;
  read?: boolean;
  delivered?: boolean;
}

interface ChatStatus {
  isActive: boolean;
  closedAt?: string;
  closedBy?: string;
}

interface AdminStatus {
  status: 'online' | 'offline' | 'typing';
  lastActive: string;
}

export default function ChatScreen() {
  const navigation = useNavigation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [chatStatus, setChatStatus] = useState<ChatStatus>({ isActive: true });
  const [supportIsTyping, setSupportIsTyping] = useState(false);
  const [adminStatus, setAdminStatus] = useState<AdminStatus>({ status: 'offline', lastActive: new Date().toISOString() });
  const flatListRef = useRef<FlatList>(null);
  const processedMessageIds = useRef<Set<string>>(new Set());
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    initializeChat();
    return () => {
      // Cleanup Pusher listeners
      if (driverId) {
        pusherService.removeEventListener('admin_message');
        pusherService.removeEventListener('chat_message');
      }
    };
  }, []);

  const initializeChat = async () => {
    try {
      let user = await getUser();
      if (user) {
        // ✅ CRITICAL: Must use Driver.id (not User.id) for Pusher channel
        let driverIdValue = user.driver?.id;
        
        // ✅ If driver ID not in cache, fetch from API
        if (!driverIdValue) {
          console.warn('⚠️  Driver ID not found in cached user. Fetching fresh profile from API...');
          try {
            let profileResponse: any | null = null;
            try {
              const apiModule = await import('../services/api.service');
              console.log('Dynamic import api.service result:', apiModule);
              const apiService = apiModule?.default ?? apiModule;
              if (!apiService || typeof apiService.get !== 'function') {
                console.error('api.service is not available or has no .get method', apiModule);
              } else {
                profileResponse = await apiService.get<any>('/api/driver/profile');
              }
            } catch (err) {
              console.error('Failed dynamic import of api.service:', err);
            }
            
            if (profileResponse?.data?.driver?.id) {
              console.log('✅ Profile fetched successfully with driver ID:', profileResponse.data.driver.id);
              driverIdValue = profileResponse.data.driver.id;
              
              // Update cached user
              const updatedUser = {
                ...user,
                driver: profileResponse.data.driver,
              };
              try {
                const storageModule = await import('../services/storage.service');
                console.log('Dynamic import storage.service result:', storageModule);
                // storage.service exports named functions (not default)
                if (typeof (storageModule as any).saveUser === 'function') {
                  await (storageModule as any).saveUser(updatedUser);
                } else {
                  console.warn('storage.service.saveUser not available', storageModule);
                }
              } catch (err) {
                console.error('Failed dynamic import of storage.service:', err);
              }
              user = updatedUser;
            } else {
              console.error('❌ API response does not include driver relation');
              return;
            }
          } catch (error) {
            console.error('❌ Failed to fetch profile:', error);
            return;
          }
        }
        
        if (!driverIdValue) {
          console.error('❌ Driver ID still not found after API fetch');
          return;
        }
        
        setDriverId(driverIdValue);

        // Initialize Pusher for chat
        await pusherService.initialize(driverIdValue);

        // Listen for admin messages with deduplication
        pusherService.addEventListener('admin_message', (data: any) => {
          console.log('📨 Admin message received:', data);
          
          // Deduplicate messages
          const messageId = data.messageId || data.id || `admin_${data.timestamp}`;
          if (processedMessageIds.current.has(messageId)) {
            console.log('⚠️ Duplicate admin message ignored:', messageId);
            return;
          }
          processedMessageIds.current.add(messageId);
          
          const adminMessage: Message = {
            id: messageId,
            content: data.message || data.content,
            sender: 'admin',
            timestamp: new Date(data.timestamp || Date.now()),
            senderName: 'Support',  // ✅ Always "Support" for privacy
            delivered: true,
            read: false,
          };
          setMessages(prev => [...prev, adminMessage]);
        });

        // Listen for chat closed event
        pusherService.addEventListener('chat_closed', (data: any) => {
          console.log('🔴 Chat closed event:', data);
          setChatStatus({
            isActive: false,
            closedAt: data.timestamp,
            closedBy: data.closedBy,
          });
          Alert.alert(
            'Conversation Closed',
            `${data.closedByName} has closed this conversation. ${data.reason || ''}`
          );
        });

        // Listen for chat reopened event
        pusherService.addEventListener('chat_reopened', (data: any) => {
          console.log('🟢 Chat reopened event:', data);
          setChatStatus({ isActive: true });
          Alert.alert(
            'Conversation Reopened',
            'Support has reopened this conversation. You can continue chatting.'
          );
        });

        // Listen for typing indicator
        pusherService.addEventListener('typing_indicator', (data: any) => {
          console.log('⌨️ Typing indicator:', data);
          if (data.userRole === 'admin') {
            setSupportIsTyping(data.isTyping);
            
            // Clear typing indicator after 3 seconds
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
            }
            if (data.isTyping) {
              typingTimeoutRef.current = setTimeout(() => {
                setSupportIsTyping(false);
              }, 3000);
            }
          }
        });

        // Listen for message read receipts
        pusherService.addEventListener('message_read', (data: any) => {
          console.log('✓✓ Message read:', data);
          setMessages(prev =>
            prev.map(msg =>
              msg.id === data.messageId ? { ...msg, read: true } : msg
            )
          );
        });

        // Listen for admin status updates
        pusherService.addEventListener('admin_status', (data: any) => {
          console.log('👤 Admin status:', data);
          setAdminStatus({
            status: data.status,
            lastActive: data.lastActive || new Date().toISOString()
          });
        });

        // Listen for chat messages (bidirectional)
        pusherService.addEventListener('chat_message', (data: any) => {
          console.log('💬 Chat message received:', data);
          if (data.sender !== 'driver') { // Don't show our own messages
            const chatMessage: Message = {
              id: `chat_${Date.now()}`,
              content: data.message || data.content,
              sender: data.sender === 'admin' ? 'admin' : 'driver',
              timestamp: new Date(),
              senderName: data.senderName || (data.sender === 'admin' ? 'Admin Support' : 'Driver'),
            };
            setMessages(prev => [...prev, chatMessage]);
          }
        });

        // Load chat history
        await loadChatHistory(driverIdValue);
      }
    } catch (error) {
      console.error('❌ Failed to initialize chat:', error);
      Alert.alert('Error', 'Failed to initialize chat');
    }
  };

  const loadChatHistory = async (driverId: string) => {
    try {
      setIsLoading(true);
      // Try to load chat history from API
      const response = await apiService.get<{ success: boolean; messages: any[] }>(`/api/driver/chat/history/${driverId}`);

      if (response.success && response.messages) {
        const formattedMessages: Message[] = response.messages.map((msg: any) => {
          const messageId = msg.id || `msg_${Date.now()}_${Math.random()}`;
          processedMessageIds.current.add(messageId);  // Track loaded messages
          
          return {
            id: messageId,
            content: msg.content || msg.message,
            sender: msg.sender === 'admin' ? 'admin' : 'driver',
            timestamp: new Date(msg.timestamp || msg.createdAt),
            senderName: msg.sender === 'admin' ? 'Support' : 'You',  // ✅ Use "Support" for admin
          };
        });
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('❌ Failed to load chat history:', error);
      // For now, we'll just start with empty chat
      // In production, you might want to show a message about chat history not available
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !driverId) return;

    // Prevent sending if chat is closed
    if (!chatStatus.isActive) {
      Alert.alert(
        'Chat Closed',
        'This conversation has been closed. Contact support to reopen it.'
      );
      return;
    }

    const messageContent = newMessage.trim();
    setNewMessage('');

    // Add message to local state immediately for better UX
    const tempMessage: Message = {
      id: `temp_${Date.now()}`,
      content: messageContent,
      sender: 'driver',
      timestamp: new Date(),
      senderName: 'You',
      delivered: false,
      read: false,
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      // Send message to backend
      const response = await apiService.post('/api/driver/chat/send', {
        driverId,
        message: messageContent,
        timestamp: new Date().toISOString(),
      }) as { success: boolean; message?: string; messageId?: string };

      if (response.success) {
        console.log('✅ Message sent successfully');
        
        // Update temp message with delivered status
        setMessages(prev => prev.map(msg => 
          msg.id === tempMessage.id 
            ? { ...msg, id: response.messageId || msg.id, delivered: true }
            : msg
        ));
      } else {
        // Remove temp message and show error
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
        Alert.alert('Error', 'Failed to send message. Please try again.');
        setNewMessage(messageContent); // Restore the message
      }
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      // Remove temp message and show error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      Alert.alert('Error', 'Failed to send message. Please check your connection.');
      setNewMessage(messageContent); // Restore the message
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isDriver = item.sender === 'driver';

    return (
      <View style={[styles.messageContainer, isDriver ? styles.driverMessage : styles.adminMessage]}>
        {!isDriver && (
          <View style={styles.senderInfo}>
            <Ionicons name="person-circle" size={20} color="#1E40AF" />
            <Text style={styles.senderName}>{item.senderName}</Text>
          </View>
        )}
        <View style={[
          styles.messageBubble, 
          isDriver ? styles.driverBubble : styles.adminBubble,
          item.senderName === 'System' && styles.systemBubble
        ]}>
          <Text style={[
            styles.messageText, 
            isDriver ? styles.driverText : styles.adminText,
            item.senderName === 'System' && styles.systemText
          ]}>
            {item.content}
          </Text>
          <View style={styles.messageFooter}>
            {item.senderName !== 'System' && (
              <Text style={[styles.timestamp, isDriver ? styles.driverTimestamp : styles.adminTimestamp]}>
                {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
            {isDriver && (
              <View style={styles.readReceipt}>
                {item.read ? (
                  <Ionicons name="checkmark-done" size={14} color="#3B82F6" />
                ) : item.delivered ? (
                  <Ionicons name="checkmark-done" size={14} color="rgba(255, 255, 255, 0.6)" />
                ) : (
                  <Ionicons name="checkmark" size={14} color="rgba(255, 255, 255, 0.6)" />
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark admin messages as read when they appear
  useEffect(() => {
    const unreadAdminMessages = messages.filter(
      msg => msg.sender === 'admin' && !msg.read && msg.senderName !== 'System'
    );

    if (unreadAdminMessages.length > 0 && driverId) {
      unreadAdminMessages.forEach(async (msg) => {
        try {
          await apiService.post('/api/driver/chat/mark-read', {
            messageId: msg.id,
            sessionId: 'current', // Will be determined by backend
          });
          
          // Update local message state
          setMessages(prev => prev.map(m => 
            m.id === msg.id ? { ...m, read: true } : m
          ));
        } catch (error) {
          console.error('Failed to mark message as read:', error);
        }
      });
    }
  }, [messages, driverId]);

  // Helper function to get time ago
  const getTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E40AF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Ionicons name="chatbubble-ellipses" size={24} color="#1E40AF" />
          <View>
            <Text style={styles.headerTitle}>Support</Text>
            {supportIsTyping ? (
              <Text style={styles.typingIndicator}>typing 💬</Text>
            ) : adminStatus.status === 'online' ? (
              <Text style={styles.onlineIndicator}>Online</Text>
            ) : (
              <Text style={styles.offlineIndicator}>
                {adminStatus.lastActive 
                  ? `Last active ${getTimeAgo(adminStatus.lastActive)}` 
                  : 'Offline'}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.statusIndicator}>
          <View style={[
            styles.statusDot,
            adminStatus.status === 'online' ? styles.statusActive : styles.statusClosed
          ]} />
        </View>
      </View>

      {/* Chat Closed Banner */}
      {!chatStatus.isActive && (
        <View style={styles.closedBanner}>
          <Ionicons name="lock-closed" size={16} color="#DC2626" />
          <Text style={styles.closedBannerText}>
            This conversation has been closed. Contact support to reopen.
          </Text>
        </View>
      )}

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={scrollToBottom}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-ellipses-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Start a conversation with admin support</Text>
          </View>
        }
      />

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type your message..."
          placeholderTextColor="#9CA3AF"
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!newMessage.trim()}
        >
          <Ionicons
            name="send"
            size={20}
            color={newMessage.trim() ? "#FFFFFF" : "#9CA3AF"}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E40AF',
  },
  placeholder: {
    width: 40,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  driverMessage: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  adminMessage: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    maxWidth: '100%',
  },
  driverBubble: {
    backgroundColor: '#1E40AF',
    borderBottomRightRadius: 4,
  },
  adminBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  driverText: {
    color: '#FFFFFF',
  },
  adminText: {
    color: '#111827',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  driverTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  adminTimestamp: {
    color: '#9CA3AF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E40AF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  systemBubble: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
    alignSelf: 'center',
    marginTop: 8,
  },
  systemText: {
    color: '#92400E',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  statusIndicator: {
    padding: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: '#10B981',
  },
  statusClosed: {
    backgroundColor: '#DC2626',
  },
  closedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FECACA',
  },
  closedBannerText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
    flex: 1,
  },
  typingIndicator: {
    fontSize: 12,
    color: '#10B981',
    fontStyle: 'italic',
  },
  onlineIndicator: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  offlineIndicator: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  readReceipt: {
    marginLeft: 6,
  },
});