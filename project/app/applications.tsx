import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Clock, CheckCircle, XCircle, CreditCard } from 'lucide-react-native';
import { ApplicationStatus } from '@/types/database';
import { theme } from '@/constants/theme';

interface Application {
  id: string;
  status: ApplicationStatus;
  message: string;
  created_at: string;
  room: {
    id: string;
    title: string;
    location: string;
    elderly: {
      full_name: string;
    };
  };
}

export default function Applications() {
  const { profile } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchApplications = async () => {
    try {
      console.log('Fetching student applications for user:', profile?.id);

      const { data, error } = await supabase
        .from('room_applications')
        .select(`
          id,
          status,
          message,
          created_at,
          room:rooms(
            id,
            title,
            location,
            elderly:profiles!rooms_elderly_id_fkey(full_name)
          )
        `)
        .eq('student_id', profile!.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching student applications:', error);
        throw error;
      }

      console.log(`Found ${data?.length || 0} applications for student:`, data);
      setApplications(data || []);
    } catch (error) {
      console.error('Error in fetchApplications:', error);
      Alert.alert('Erro', 'Erro ao carregar suas candidaturas. Por favor tente novamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchApplications();
  };

  const getStatusIcon = (status: ApplicationStatus) => {
    switch (status) {
      case 'pending':
        return <Clock size={20} color={theme.colors.warning} />;
      case 'accepted':
        return <CheckCircle size={20} color={theme.colors.success} />;
      case 'awaiting_payment':
        return <CreditCard size={20} color={theme.colors.primary} />;
      case 'rejected':
        return <XCircle size={20} color={theme.colors.error} />;
    }
  };

  const getStatusText = (status: ApplicationStatus) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'accepted':
        return 'Aceite';
      case 'awaiting_payment':
        return 'Aguardando Pagamento';
      case 'rejected':
        return 'Recusada';
    }
  };

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case 'pending':
        return theme.colors.warning;
      case 'accepted':
        return theme.colors.success;
      case 'awaiting_payment':
        return theme.colors.primary;
      case 'rejected':
        return theme.colors.error;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>Minhas Candidaturas</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <Text style={styles.loadingText}>A carregar...</Text>
        ) : applications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Ainda não se candidatou a nenhum quarto.
            </Text>
          </View>
        ) : (
          applications.map((app) => (
            <View key={app.id} style={styles.applicationCard}>
              <TouchableOpacity
                onPress={() => router.push(`/rooms/${app.room.id}`)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.statusBadge}>
                    {getStatusIcon(app.status)}
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(app.status) },
                      ]}
                    >
                      {getStatusText(app.status)}
                    </Text>
                  </View>
                  <Text style={styles.dateText}>
                    {new Date(app.created_at).toLocaleDateString('pt-PT')}
                  </Text>
                </View>
                <Text style={styles.roomTitle} numberOfLines={1}>
                  {app.room.title}
                </Text>
                <Text style={styles.roomLocation}>{app.room.location}</Text>
                <Text style={styles.elderlyName}>
                  Anfitrião: {app.room.elderly.full_name}
                </Text>
                {app.message && (
                  <Text style={styles.message} numberOfLines={2}>
                    Mensagem: {app.message}
                  </Text>
                )}
              </TouchableOpacity>

              {app.status === 'awaiting_payment' && (
                <TouchableOpacity
                  style={styles.finalizeButton}
                  onPress={() => router.push(`/applications/finalize/${app.id}`)}
                >
                  <CreditCard size={20} color="#fff" />
                  <Text style={styles.finalizeButtonText}>
                    Finalizar Pagamento
                  </Text>
                </TouchableOpacity>
              )}
            </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
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
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  applicationCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 14,
    color: '#999',
  },
  roomTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  roomLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  elderlyName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  finalizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
    shadowColor: theme.colors.shadowMedium,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  finalizeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
