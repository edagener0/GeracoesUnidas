import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Plus, MapPin, Euro, Users, Clock } from 'lucide-react-native';
import { theme } from '@/constants/theme';

interface Room {
  id: string;
  title: string;
  location: string;
  monthly_price: number;
  room_type: string;
  elderly_profile: {
    full_name: string;
    age: number;
  };
  room_photos: Array<{ photo_url: string }>;
  reviews: Array<{ rating: number }>;
  applications_count?: number;
}

interface PendingApplication {
  id: string;
  status: string;
  created_at: string;
  room: {
    id: string;
    title: string;
    location: string;
    monthly_price: number;
  };
}

export default function Home() {
  const { profile } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [pendingApplications, setPendingApplications] = useState<PendingApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isElderly = profile?.user_type === 'elderly';

  const fetchPendingApplications = async () => {
    if (!profile || isElderly) return;

    try {
      const { data, error } = await supabase
        .from('room_applications')
        .select(`
          id,
          status,
          created_at,
          room:rooms(id, title, location, monthly_price)
        `)
        .eq('student_id', profile.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setPendingApplications(data || []);
    } catch (error) {
      console.error('Error fetching pending applications:', error);
    }
  };

  const fetchRooms = async () => {
    try {
      if (isElderly) {
        const { data, error } = await supabase
          .from('rooms')
          .select(`
            *,
            room_photos(photo_url),
            reviews(rating)
          `)
          .eq('elderly_id', profile?.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setRooms(data || []);
      } else {
        const { data, error } = await supabase
          .from('rooms')
          .select(`
            *,
            elderly_profile:profiles!rooms_elderly_id_fkey(full_name, age),
            room_photos(photo_url),
            reviews(rating)
          `)
          .eq('is_available', true)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setRooms(data || []);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchPendingApplications();
  }, [profile]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRooms();
    fetchPendingApplications();
  };

  const calculateAverageRating = (reviews: Array<{ rating: number }>) => {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, {profile?.full_name}!</Text>
            <Text style={styles.subtitle}>
              {isElderly ? 'Os seus quartos' : 'Quartos disponíveis'}
            </Text>
          </View>
          {isElderly && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/rooms/create')}
            >
              <Plus size={24} color={theme.colors.navbarIcon} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {!isElderly && (
          <View style={styles.pendingSection}>
            <Text style={styles.pendingSectionTitle}>Candidaturas Pendentes</Text>
            {pendingApplications.length === 0 ? (
              <View style={styles.noPendingCard}>
                <Clock size={32} color={theme.colors.navbarIcon} />
                <Text style={styles.noPendingText}>Não há candidaturas pendentes</Text>
              </View>
            ) : (
              pendingApplications.map((application) => (
                <TouchableOpacity
                  key={application.id}
                  style={styles.pendingCard}
                  onPress={() => router.push(`/rooms/${application.room.id}`)}
                >
                  <View style={styles.pendingCardHeader}>
                    <Clock size={20} color={theme.colors.navbarIconActive} />
                    <Text style={styles.pendingStatus}>Pendente</Text>
                  </View>
                  <Text style={styles.pendingRoomTitle} numberOfLines={1}>
                    {application.room.title}
                  </Text>
                  <View style={styles.pendingCardInfo}>
                    <View style={styles.pendingInfoRow}>
                      <MapPin size={16} color="#666" />
                      <Text style={styles.pendingInfoText}>
                        {application.room.location}
                      </Text>
                    </View>
                    <View style={styles.pendingInfoRow}>
                      <Euro size={16} color="#666" />
                      <Text style={styles.pendingInfoText}>
                        {application.room.monthly_price}€/mês
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {!isElderly && rooms.length > 0 && (
          <View style={styles.sectionDivider}>
            <Text style={styles.sectionTitle}>Quartos Disponíveis</Text>
          </View>
        )}

        {loading ? (
          <Text style={styles.loadingText}>A carregar...</Text>
        ) : rooms.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {isElderly
                ? 'Ainda não tem quartos. Clique em + para adicionar.'
                : 'Sem quartos disponíveis no momento.'}
            </Text>
          </View>
        ) : (
          rooms.map((room) => (
            <TouchableOpacity
              key={room.id}
              style={styles.roomCard}
              onPress={() => router.push(`/rooms/${room.id}`)}
            >
              <View style={styles.roomCardHeader}>
                {room.room_photos && room.room_photos[0] ? (
                  <Image
                    source={{ uri: room.room_photos[0].photo_url }}
                    style={styles.roomCardImage}
                  />
                ) : (
                  <View style={[styles.roomCardImage, styles.noImage]}>
                    <Text style={styles.noImageText}>Sem foto</Text>
                  </View>
                )}
                {room.reviews && room.reviews.length > 0 && (
                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingBadgeText}>
                      ⭐ {calculateAverageRating(room.reviews)}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.roomTitle} numberOfLines={1}>
                {room.title}
              </Text>
              <View style={styles.roomCardInfo}>
                <View style={styles.roomInfoRow}>
                  <MapPin size={16} color="#666" />
                  <Text style={styles.roomInfoText}>{room.location}</Text>
                </View>
                <View style={styles.roomInfoRow}>
                  <Euro size={16} color="#666" />
                  <Text style={styles.roomInfoText}>
                    {room.monthly_price}€/mês
                  </Text>
                </View>
                {!isElderly && room.elderly_profile && (
                  <View style={styles.roomInfoRow}>
                    <Users size={16} color="#666" />
                    <Text style={styles.roomInfoText}>
                      {room.elderly_profile.full_name}, {room.elderly_profile.age} anos
                    </Text>
                  </View>
                )}
              </View>
              {isElderly && (
                <TouchableOpacity
                  style={styles.applicationsButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    router.push(`/room-applications/${room.id}`);
                  }}
                >
                  <Users size={16} color={theme.colors.navbarIconActive} />
                  <Text style={styles.applicationsButtonText}>
                    Ver candidaturas
                  </Text>
                </TouchableOpacity>
              )}
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
    backgroundColor: theme.colors.background,
  },
  headerContainer: {
    backgroundColor: theme.colors.navbar,
    paddingBottom: 24,
    borderBottomLeftRadius: theme.borderRadius.lg,
    borderBottomRightRadius: theme.borderRadius.lg,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 60,
    paddingBottom: theme.spacing.lg,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.navbarText,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: theme.colors.navbarText,
    marginTop: 6,
    opacity: 0.85,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: theme.colors.card,
    width: 52,
    height: 52,
    borderRadius: theme.borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.shadowMedium,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  pendingSection: {
    marginBottom: theme.spacing.xl,
  },
  pendingSectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textDark,
    marginBottom: theme.spacing.md,
    letterSpacing: -0.3,
  },
  noPendingCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: theme.colors.accentWarm,
  },
  noPendingText: {
    fontSize: 16,
    color: theme.colors.textLight,
    marginTop: theme.spacing.md,
    textAlign: 'center',
    fontWeight: '500',
  },
  pendingCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.shadowMedium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
    borderLeftWidth: 5,
    borderLeftColor: theme.colors.warning,
  },
  pendingCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  pendingStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.warning,
  },
  pendingRoomTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: theme.colors.textDark,
    marginBottom: theme.spacing.sm,
    letterSpacing: -0.2,
  },
  pendingCardInfo: {
    gap: 6,
  },
  pendingInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pendingInfoText: {
    fontSize: 14,
    color: theme.colors.textLight,
    fontWeight: '500',
  },
  sectionDivider: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textDark,
    letterSpacing: -0.3,
  },
  loadingText: {
    textAlign: 'center',
    color: theme.colors.textLight,
    fontSize: 16,
    marginTop: 40,
    fontWeight: '500',
  },
  emptyState: {
    marginTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textLight,
    textAlign: 'center',
    fontWeight: '500',
  },
  roomCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.shadowMedium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  roomCardHeader: {
    position: 'relative',
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  roomCardImage: {
    width: '100%',
    height: 200,
    backgroundColor: theme.colors.accentWarm,
  },
  ratingBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.md,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  ratingBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  noImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: theme.colors.textLight,
    fontSize: 15,
    fontWeight: '500',
  },
  roomTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textDark,
    marginBottom: theme.spacing.sm,
    letterSpacing: -0.3,
  },
  roomCardInfo: {
    gap: 6,
  },
  roomInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roomInfoText: {
    fontSize: 14,
    color: theme.colors.textLight,
    fontWeight: '500',
  },
  applicationsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    gap: 8,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  applicationsButtonText: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
});
