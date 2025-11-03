import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft,
  MapPin,
  Euro,
  Heart,
  Star,
  Send,
  Edit,
  Users,
} from 'lucide-react-native';

interface RoomDetails {
  id: string;
  title: string;
  description: string;
  room_type: string;
  monthly_price: number;
  location: string;
  address: string;
  is_available: boolean;
  elderly_profile: {
    full_name: string;
    age: number;
    gender: string;
    bio: string;
  };
  room_photos: Array<{ id: string; photo_url: string; display_order: number }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string;
    student: {
      full_name: string;
    };
    created_at: string;
  }>;
}

export default function RoomDetails() {
  const { id } = useLocalSearchParams();
  const { profile } = useAuth();
  const router = useRouter();
  const [room, setRoom] = useState<RoomDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState('');

  const isStudent = profile?.user_type === 'student';
  const isOwner = room?.elderly_id === profile?.id;

  useEffect(() => {
    fetchRoomDetails();
    if (isStudent) {
      checkFavoriteStatus();
      checkApplicationStatus();
    }
  }, [id]);

  const fetchRoomDetails = async () => {
    try {
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (roomError) throw roomError;
      if (!roomData) {
        setRoom(null);
        return;
      }

      const { data: elderlyProfile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, age, bio')
        .eq('id', roomData.elderly_id)
        .maybeSingle();

      if (profileError) throw profileError;

      const { data: elderlyDetails, error: detailsError } = await supabase
        .from('elderly_profiles')
        .select('gender')
        .eq('id', roomData.elderly_id)
        .maybeSingle();

      if (detailsError) throw detailsError;

      const { data: photos } = await supabase
        .from('room_photos')
        .select('id, photo_url, display_order')
        .eq('room_id', id)
        .order('display_order', { ascending: true });

      const { data: reviews } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          student:profiles!reviews_student_id_fkey(full_name)
        `)
        .eq('room_id', id);

      const combinedData = {
        ...roomData,
        elderly_profile: {
          full_name: elderlyProfile?.full_name || '',
          age: elderlyProfile?.age || 0,
          gender: elderlyDetails?.gender || '',
          bio: elderlyProfile?.bio || '',
        },
        room_photos: photos || [],
        reviews: reviews || [],
      };

      setRoom(combinedData);
    } catch (error) {
      console.error('Error fetching room:', error);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes do quarto');
    } finally {
      setLoading(false);
    }
  };

  const checkFavoriteStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('student_id', profile!.id)
        .eq('room_id', id)
        .maybeSingle();

      if (!error && data) {
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error checking favorite:', error);
    }
  };

  const checkApplicationStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('room_applications')
        .select('id')
        .eq('student_id', profile!.id)
        .eq('room_id', id)
        .maybeSingle();

      if (!error && data) {
        setHasApplied(true);
      }
    } catch (error) {
      console.error('Error checking application:', error);
    }
  };

  const toggleFavorite = async () => {
    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('student_id', profile!.id)
          .eq('room_id', id);

        if (error) throw error;
        setIsFavorite(false);
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({
            student_id: profile!.id,
            room_id: id as string,
          });

        if (error) throw error;
        setIsFavorite(true);
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao atualizar favorito');
    }
  };

  const handleApply = async () => {
    try {
      const { error } = await supabase
        .from('room_applications')
        .insert({
          student_id: profile!.id,
          room_id: id as string,
          message: applicationMessage,
        });

      if (error) throw error;

      setHasApplied(true);
      setShowApplyModal(false);
      setApplicationMessage('');
      Alert.alert('Sucesso', 'Candidatura enviada com sucesso!');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao enviar candidatura');
    }
  };

  const calculateAverageRating = () => {
    if (!room || !room.reviews || room.reviews.length === 0) return 0;
    const sum = room.reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / room.reviews.length).toFixed(1);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>A carregar...</Text>
      </View>
    );
  }

  if (!room) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Quarto não encontrado</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        {room.room_photos.length > 0 ? (
          <ScrollView horizontal pagingEnabled style={styles.photosContainer}>
            {room.room_photos.map((photo) => (
              <Image
                key={photo.id}
                source={{ uri: photo.photo_url }}
                style={styles.photo}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={[styles.photo, styles.noPhoto]}>
            <Text style={styles.noPhotoText}>Sem fotos</Text>
          </View>
        )}

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>

        {isStudent && (
          <TouchableOpacity style={styles.favoriteButton} onPress={toggleFavorite}>
            <Heart
              size={24}
              color={isFavorite ? '#FF3B30' : '#fff'}
              fill={isFavorite ? '#FF3B30' : 'transparent'}
            />
          </TouchableOpacity>
        )}

        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>{room.title}</Text>
              <View style={styles.locationRow}>
                <MapPin size={18} color="#666" />
                <Text style={styles.location}>{room.location}</Text>
              </View>
            </View>
            <View style={styles.priceContainer}>
              <Euro size={20} color="#007AFF" />
              <Text style={styles.price}>{room.monthly_price}</Text>
              <Text style={styles.pricePeriod}>/mês</Text>
            </View>
          </View>

          {room.reviews.length > 0 && (
            <View style={styles.ratingContainer}>
              <Star size={20} color="#FFB800" fill="#FFB800" />
              <Text style={styles.ratingText}>
                {calculateAverageRating()} ({room.reviews.length}{' '}
                {room.reviews.length === 1 ? 'avaliação' : 'avaliações'})
              </Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sobre o quarto</Text>
            <Text style={styles.infoText}>Tipo: {room.room_type}</Text>
            <Text style={styles.description}>{room.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sobre o anfitrião</Text>
            <Text style={styles.hostName}>
              {room.elderly_profile.full_name}, {room.elderly_profile.age} anos
            </Text>
            {room.elderly_profile.bio && (
              <Text style={styles.hostBio}>{room.elderly_profile.bio}</Text>
            )}
          </View>

          {room.reviews.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Avaliações</Text>
              {room.reviews.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewAuthor}>
                      {review.student.full_name}
                    </Text>
                    <View style={styles.reviewRating}>
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} size={14} color="#FFB800" fill="#FFB800" />
                      ))}
                    </View>
                  </View>
                  {review.comment && (
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {isOwner ? (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.ownerButton}
            onPress={() => router.push(`/room-applications/${id}`)}
          >
            <Users size={20} color="#fff" />
            <Text style={styles.ownerButtonText}>Ver Candidaturas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.ownerButtonSecondary}
            onPress={() => router.push(`/rooms/create?edit=${id}`)}
          >
            <Edit size={20} color="#007AFF" />
            <Text style={styles.ownerButtonSecondaryText}>Editar</Text>
          </TouchableOpacity>
        </View>
      ) : isStudent && room.is_available ? (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.applyButton, hasApplied && styles.applyButtonDisabled]}
            onPress={() => setShowApplyModal(true)}
            disabled={hasApplied}
          >
            <Text style={styles.applyButtonText}>
              {hasApplied ? 'Candidatura enviada' : 'Candidatar-me'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <Modal
        visible={showApplyModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowApplyModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Candidatar-me ao quarto</Text>
            <Text style={styles.modalLabel}>
              Mensagem para o anfitrião (opcional)
            </Text>
            <TextInput
              style={styles.modalInput}
              value={applicationMessage}
              onChangeText={setApplicationMessage}
              placeholder="Escreva uma mensagem..."
              multiline
              numberOfLines={4}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowApplyModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleApply}
              >
                <Send size={18} color="#fff" />
                <Text style={styles.modalConfirmText}>Enviar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  errorText: {
    textAlign: 'center',
    color: '#FF3B30',
    fontSize: 16,
    marginTop: 100,
  },
  photosContainer: {
    height: 300,
  },
  photo: {
    width: 400,
    height: 300,
  },
  noPhoto: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPhotoText: {
    color: '#999',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    marginLeft: 6,
    fontSize: 16,
    color: '#666',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginLeft: 4,
  },
  pricePeriod: {
    fontSize: 16,
    color: '#666',
    marginLeft: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  ratingText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  hostName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  hostBio: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  reviewCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewAuthor: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewComment: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
    flexDirection: 'row',
    gap: 12,
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  applyButtonDisabled: {
    backgroundColor: '#ccc',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  ownerButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  ownerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  ownerButtonSecondary: {
    flex: 1,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  ownerButtonSecondaryText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    height: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  modalConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
