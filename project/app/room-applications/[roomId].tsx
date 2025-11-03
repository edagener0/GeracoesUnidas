import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, User, CheckCircle, XCircle } from 'lucide-react-native';
import { ApplicationStatus } from '@/types/database';

interface Application {
  id: string;
  status: ApplicationStatus;
  message: string;
  created_at: string;
  student: {
    id: string;
    full_name: string;
    age: number;
    bio: string;
    student_profile: {
      university: string;
      course: string;
      student_type: string;
    };
  };
}

export default function RoomApplications() {
  const { roomId } = useLocalSearchParams();
  const { profile } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [roomTitle, setRoomTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchApplications = async () => {
    try {
      console.log('Fetching applications for room:', roomId);

      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('title')
        .eq('id', roomId)
        .maybeSingle();

      if (roomError) {
        console.error('Error fetching room:', roomError);
        throw roomError;
      }
      if (roomData) {
        console.log('Room found:', roomData.title);
        setRoomTitle(roomData.title);
      }

      const { data: applicationsData, error: appsError } = await supabase
        .from('room_applications')
        .select('id, status, message, created_at, student_id')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false });

      if (appsError) {
        console.error('Error fetching applications:', appsError);
        throw appsError;
      }

      console.log(`Found ${applicationsData?.length || 0} applications:`, applicationsData);

      if (applicationsData && applicationsData.length > 0) {
        const studentIds = applicationsData.map((app) => app.student_id);

        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, age, bio')
          .in('id', studentIds);

        const { data: studentProfiles } = await supabase
          .from('student_profiles')
          .select('id, university, course, student_type')
          .in('id', studentIds);

        const enrichedApplications = applicationsData.map((app) => {
          const profile = profiles?.find((p) => p.id === app.student_id);
          const studentProfile = studentProfiles?.find(
            (sp) => sp.id === app.student_id
          );

          return {
            ...app,
            student: {
              id: app.student_id,
              full_name: profile?.full_name || '',
              age: profile?.age || 0,
              bio: profile?.bio || '',
              student_profile: studentProfile
                ? {
                    university: studentProfile.university,
                    course: studentProfile.course,
                    student_type: studentProfile.student_type,
                  }
                : null,
            },
          };
        });

        console.log('Applications enriched successfully:', enrichedApplications.length);
        setApplications(enrichedApplications);
      } else {
        console.log('No applications found for this room');
        setApplications([]);
      }
    } catch (error) {
      console.error('Error in fetchApplications:', error);
      Alert.alert('Erro', 'Erro ao carregar candidaturas. Por favor tente novamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [roomId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchApplications();
  };

  const handleAccept = async (applicationId: string, studentId: string) => {
    Alert.alert(
      'Aceitar candidatura',
      'Tem a certeza que deseja aceitar esta candidatura? O aluno será notificado para efetuar o pagamento.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aceitar',
          onPress: async () => {
            try {
              console.log('Starting accept process for application:', applicationId);

              const { error: updateError } = await supabase
                .from('room_applications')
                .update({ status: 'awaiting_payment' })
                .eq('id', applicationId);

              if (updateError) {
                console.error('Error updating application:', updateError);
                throw updateError;
              }

              console.log('Application updated successfully, creating conversation');

              const { error: convError } = await supabase
                .from('conversations')
                .insert({
                  room_id: roomId as string,
                  elderly_id: profile!.id,
                  student_id: studentId,
                });

              if (convError) {
                if (convError.code === '23505') {
                  console.log('Conversation already exists - this is ok');
                } else {
                  console.error('Error creating conversation:', convError);
                  throw convError;
                }
              }

              console.log('Conversation created successfully, rejecting other applications');

              const { error: rejectError } = await supabase
                .from('room_applications')
                .update({ status: 'rejected' })
                .eq('room_id', roomId as string)
                .eq('status', 'pending')
                .neq('id', applicationId);

              if (rejectError) {
                console.error('Error rejecting other applications (non-critical):', rejectError);
              } else {
                console.log('Other pending applications rejected successfully');
              }

              fetchApplications();
              Alert.alert(
                'Sucesso',
                'Candidatura aceite! O aluno foi notificado para efetuar o pagamento.'
              );
            } catch (error: any) {
              console.error('Error in handleAccept:', error);
              Alert.alert('Erro', error.message || 'Erro ao aceitar candidatura');
            }
          },
        },
      ]
    );
  };

  const handleReject = async (applicationId: string) => {
    Alert.alert(
      'Recusar candidatura',
      'Tem a certeza que deseja recusar esta candidatura?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Recusar',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Rejecting application:', applicationId);

              const { error } = await supabase
                .from('room_applications')
                .update({ status: 'rejected' })
                .eq('id', applicationId);

              if (error) {
                console.error('Error rejecting application:', error);
                throw error;
              }

              console.log('Application rejected successfully');
              fetchApplications();
              Alert.alert('Sucesso', 'Candidatura recusada');
            } catch (error: any) {
              console.error('Error in handleReject:', error);
              Alert.alert('Erro', error.message || 'Erro ao recusar candidatura');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {roomTitle || 'Candidaturas'}
        </Text>
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
              Ainda não há candidaturas para este quarto.
            </Text>
          </View>
        ) : (
          applications.map((app) => (
            <View key={app.id} style={styles.applicationCard}>
              <View style={styles.studentHeader}>
                <View style={styles.avatarContainer}>
                  <User size={32} color="#fff" />
                </View>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{app.student.full_name}</Text>
                  <Text style={styles.studentAge}>{app.student.age} anos</Text>
                </View>
              </View>

              {app.student.student_profile && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Informação Académica</Text>
                  <Text style={styles.infoText}>
                    {app.student.student_profile.university}
                  </Text>
                  <Text style={styles.infoText}>
                    Curso: {app.student.student_profile.course}
                  </Text>
                  <Text style={styles.infoText}>
                    Tipo:{' '}
                    {app.student.student_profile.student_type === 'national'
                      ? 'Nacional'
                      : app.student.student_profile.student_type === 'international'
                      ? 'Internacional'
                      : 'Erasmus'}
                  </Text>
                </View>
              )}

              {app.student.bio && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Biografia</Text>
                  <Text style={styles.bioText}>{app.student.bio}</Text>
                </View>
              )}

              {app.message && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Mensagem</Text>
                  <Text style={styles.messageText}>{app.message}</Text>
                </View>
              )}

              <View style={styles.footer}>
                <Text style={styles.dateText}>
                  {new Date(app.created_at).toLocaleDateString('pt-PT')}
                </Text>
                {app.status === 'pending' ? (
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => handleReject(app.id)}
                    >
                      <XCircle size={20} color="#fff" />
                      <Text style={styles.rejectButtonText}>Recusar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() => handleAccept(app.id, app.student.id)}
                    >
                      <CheckCircle size={20} color="#fff" />
                      <Text style={styles.acceptButtonText}>Aceitar</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.statusBadge,
                      app.status === 'accepted' || app.status === 'awaiting_payment'
                        ? styles.acceptedBadge
                        : styles.rejectedBadge,
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>
                      {app.status === 'accepted' || app.status === 'awaiting_payment'
                        ? 'Aceite'
                        : 'Recusada'}
                    </Text>
                  </View>
                )}
              </View>
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
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    marginHorizontal: 10,
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
    padding: 20,
    marginBottom: 16,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  studentAge: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 15,
    color: '#666',
    marginBottom: 4,
  },
  bioText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  messageText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  dateText: {
    fontSize: 14,
    color: '#999',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C759',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  acceptedBadge: {
    backgroundColor: '#34C759',
  },
  rejectedBadge: {
    backgroundColor: '#FF3B30',
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
