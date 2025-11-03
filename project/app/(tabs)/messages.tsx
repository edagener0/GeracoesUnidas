import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { MessageCircle } from 'lucide-react-native';
import { theme } from '@/constants/theme';

interface Conversation {
  id: string;
  room_id: string;
  elderly_id: string;
  student_id: string;
  updated_at: string;
  room: {
    title: string;
  };
  other_user: {
    full_name: string;
  };
  last_message?: {
    content: string;
    created_at: string;
    is_read: boolean;
  };
}

export default function Messages() {
  const { profile } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = async () => {
    if (!profile) return;

    try {
      const isElderly = profile.user_type === 'elderly';
      const userIdField = isElderly ? 'elderly_id' : 'student_id';
      const otherUserField = isElderly ? 'student_id' : 'elderly_id';

      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          room:rooms(title),
          other_user:profiles!conversations_${otherUserField}_fkey(full_name)
        `)
        .eq(userIdField, profile.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const conversationsWithMessages = await Promise.all(
        (data || []).map(async (conv) => {
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content, created_at, is_read')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...conv,
            last_message: lastMessage,
          };
        })
      );

      setConversations(conversationsWithMessages);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [profile]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('pt-PT');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mensagens</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <Text style={styles.loadingText}>A carregar...</Text>
        ) : conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <MessageCircle size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              Ainda não tem conversas.
            </Text>
            <Text style={styles.emptySubtext}>
              As conversas aparecem quando um idoso aceita uma candidatura.
            </Text>
          </View>
        ) : (
          conversations.map((conv) => (
            <TouchableOpacity
              key={conv.id}
              style={styles.conversationCard}
              onPress={() => router.push(`/conversations/${conv.id}`)}
            >
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {conv.other_user.full_name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.conversationInfo}>
                <View style={styles.conversationHeader}>
                  <Text style={styles.conversationName} numberOfLines={1}>
                    {conv.other_user.full_name}
                  </Text>
                  {conv.last_message && (
                    <Text style={styles.conversationTime}>
                      {formatDate(conv.last_message.created_at)}
                    </Text>
                  )}
                </View>
                <Text style={styles.conversationRoom} numberOfLines={1}>
                  {conv.room.title}
                </Text>
                {conv.last_message && (
                  <Text
                    style={[
                      styles.conversationLastMessage,
                      !conv.last_message.is_read && styles.unreadMessage,
                    ]}
                    numberOfLines={1}
                  >
                    {conv.last_message.content}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: theme.colors.navbar,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.navbarText,
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 40,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  conversationCard: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  conversationTime: {
    fontSize: 14,
    color: '#999',
    marginLeft: 8,
  },
  conversationRoom: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  conversationLastMessage: {
    fontSize: 15,
    color: '#999',
  },
  unreadMessage: {
    fontWeight: '600',
    color: '#1a1a1a',
  },
});
