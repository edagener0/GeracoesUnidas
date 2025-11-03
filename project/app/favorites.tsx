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
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, MapPin, Euro, Heart } from 'lucide-react-native';

interface FavoriteRoom {
  id: string;
  room: {
    id: string;
    title: string;
    location: string;
    monthly_price: number;
    room_photos: Array<{ photo_url: string }>;
  };
}

export default function Favorites() {
  const { profile } = useAuth();
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id,
          room:rooms(
            id,
            title,
            location,
            monthly_price,
            room_photos(photo_url)
          )
        `)
        .eq('student_id', profile!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFavorites(data || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFavorites();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>Meus Favoritos</Text>
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
        ) : favorites.length === 0 ? (
          <View style={styles.emptyState}>
            <Heart size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              Ainda não tem quartos favoritos.
            </Text>
          </View>
        ) : (
          favorites.map((fav) => (
            <TouchableOpacity
              key={fav.id}
              style={styles.roomCard}
              onPress={() => router.push(`/rooms/${fav.room.id}`)}
            >
              {fav.room.room_photos && fav.room.room_photos[0] ? (
                <Image
                  source={{ uri: fav.room.room_photos[0].photo_url }}
                  style={styles.roomImage}
                />
              ) : (
                <View style={[styles.roomImage, styles.noImage]}>
                  <Text style={styles.noImageText}>Sem foto</Text>
                </View>
              )}
              <View style={styles.roomInfo}>
                <Text style={styles.roomTitle} numberOfLines={1}>
                  {fav.room.title}
                </Text>
                <View style={styles.roomDetail}>
                  <MapPin size={16} color="#666" />
                  <Text style={styles.roomDetailText}>{fav.room.location}</Text>
                </View>
                <View style={styles.priceContainer}>
                  <Euro size={16} color="#007AFF" />
                  <Text style={styles.roomPrice}>
                    {fav.room.monthly_price}/mês
                  </Text>
                </View>
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
    marginTop: 16,
    textAlign: 'center',
  },
  roomCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  roomImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  noImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#999',
  },
  roomInfo: {
    padding: 16,
  },
  roomTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  roomDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  roomDetailText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomPrice: {
    marginLeft: 4,
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
});
