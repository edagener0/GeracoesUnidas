import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Send } from 'lucide-react-native';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface Conversation {
  id: string;
  room: {
    title: string;
  };
  other_user: {
    full_name: string;
  };
}

export default function ConversationScreen() {
  const { id } = useLocalSearchParams();
  const { profile } = useAuth();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!id || !profile) return;

    console.log('[Realtime] Initializing conversation:', id);
    fetchConversation();
    fetchMessages();

    const channel = supabase
      .channel(`conversation:${id}`, {
        config: {
          broadcast: { self: false },
          presence: { key: profile.id },
        },
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${id}`,
        },
        (payload) => {
          console.log('[Realtime] New message received:', payload);
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            const exists = prev.some(m => m.id === newMsg.id);
            if (exists) {
              console.log('[Realtime] Message already exists, skipping');
              return prev;
            }
            console.log('[Realtime] Adding new message to list');
            return [...prev, newMsg];
          });
          setTimeout(() => scrollToBottom(), 100);

          if (newMsg.sender_id !== profile.id) {
            markMessagesAsRead();
          }
        }
      )
      .on('system', {}, (payload) => {
        console.log('[Realtime] System event:', payload);
      })
      .subscribe((status, err) => {
        console.log('[Realtime] Subscription status:', status);
        if (err) {
          console.error('[Realtime] Subscription error:', err);
          setRealtimeStatus('disconnected');
        } else if (status === 'SUBSCRIBED') {
          console.log('[Realtime] Successfully subscribed to channel');
          setRealtimeStatus('connected');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('[Realtime] Connection error:', status);
          setRealtimeStatus('disconnected');
        }
      });

    return () => {
      console.log('[Realtime] Cleaning up subscription');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      channel.unsubscribe();
    };
  }, [id, profile]);

  useEffect(() => {
    if (realtimeStatus === 'disconnected' && !reconnectTimeoutRef.current) {
      console.log('[Realtime] Connection lost, attempting to reconnect in 5 seconds...');
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('[Realtime] Attempting to reconnect...');
        setRealtimeStatus('connecting');
        fetchMessages();
        reconnectTimeoutRef.current = null;
      }, 5000);
    }
  }, [realtimeStatus]);

  const fetchConversation = async () => {
    try {
      const isElderly = profile?.user_type === 'elderly';
      const otherUserField = isElderly ? 'student_id' : 'elderly_id';

      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          room:rooms(title),
          other_user:profiles!conversations_${otherUserField}_fkey(full_name)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      setConversation(data);
    } catch (error) {
      console.error('Error fetching conversation:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      setTimeout(() => scrollToBottom(), 100);

      markMessagesAsRead();
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', id)
        .neq('sender_id', profile!.id)
        .eq('is_read', false);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      console.log('[Send] Sending message:', {
        conversation_id: id,
        sender_id: profile!.id,
        content_length: messageContent.length
      });

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: id as string,
          sender_id: profile!.id,
          content: messageContent,
          is_read: false,
        })
        .select()
        .single();

      if (error) {
        console.error('[Send] Error inserting message:', error);
        throw error;
      }

      console.log('[Send] Message inserted successfully:', data);

      const { error: updateError } = await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', id);

      if (updateError) {
        console.error('[Send] Error updating conversation:', updateError);
      } else {
        console.log('[Send] Conversation updated successfully');
      }

      scrollToBottom();
    } catch (error) {
      console.error('[Send] Failed to send message:', error);
      setNewMessage(messageContent);
      alert('Erro ao enviar mensagem. Por favor, tente novamente.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading || !conversation) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>A carregar...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.headerNameRow}>
            <Text style={styles.headerName}>{conversation.other_user.full_name}</Text>
            {realtimeStatus === 'connected' && (
              <View style={styles.onlineIndicator} />
            )}
          </View>
          <Text style={styles.headerRoom} numberOfLines={1}>
            {conversation.room.title}
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {realtimeStatus === 'disconnected' && (
        <View style={styles.connectionWarning}>
          <Text style={styles.connectionWarningText}>
            ⚠️ Conexão perdida. As mensagens podem não ser entregues em tempo real.
          </Text>
        </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => scrollToBottom()}
      >
        {messages.map((message) => {
          const isMyMessage = message.sender_id === profile?.id;
          return (
            <View
              key={message.id}
              style={[
                styles.messageBubble,
                isMyMessage ? styles.myMessage : styles.otherMessage,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  isMyMessage ? styles.myMessageText : styles.otherMessageText,
                ]}
              >
                {message.content}
              </Text>
              <Text
                style={[
                  styles.messageTime,
                  isMyMessage ? styles.myMessageTime : styles.otherMessageTime,
                ]}
              >
                {formatTime(message.created_at)}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Escreva uma mensagem..."
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!newMessage.trim() || sending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSendMessage}
          disabled={!newMessage.trim() || sending}
        >
          {sending ? (
            <Text style={styles.sendingText}>...</Text>
          ) : (
            <Send size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  headerInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  headerRoom: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  connectionWarning: {
    backgroundColor: '#FFF3CD',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE69C',
  },
  connectionWarningText: {
    fontSize: 13,
    color: '#856404',
    textAlign: 'center',
  },
  messagesContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  myMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#1a1a1a',
  },
  messageTime: {
    fontSize: 12,
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendingText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
