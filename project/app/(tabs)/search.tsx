import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '@/lib/supabase';
import { PORTUGUESE_CITIES } from '@/constants/universities';
import { Search as SearchIcon, MapPin, Euro } from 'lucide-react-native';
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
}

export default function Search() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    filterRooms();
  }, [searchQuery, selectedLocation, rooms]);

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select(`
          *,
          elderly_profile:profiles!rooms_elderly_id_fkey(full_name, age),
          room_photos(photo_url),
          reviews(rating)
        `)
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRooms(data || []);
      setFilteredRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRooms = () => {
    let filtered = rooms;

    if (selectedLocation) {
      filtered = filtered.filter(room => room.location === selectedLocation);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        room =>
          room.title.toLowerCase().includes(query) ||
          room.location.toLowerCase().includes(query) ||
          room.room_type.toLowerCase().includes(query)
      );
    }

    setFilteredRooms(filtered);
  };

  const calculateAverageRating = (reviews: Array<{ rating: number }>) => {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Procurar Quartos</Text>
      </View>

      <View style={styles.filtersContainer}>
        <View style={styles.searchContainer}>
          <SearchIcon size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar por título, localidade..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedLocation}
            onValueChange={setSelectedLocation}
            style={styles.picker}
          >
            <Picker.Item label="Todas as localidades" value="" />
            {PORTUGUESE_CITIES.map((city) => (
              <Picker.Item key={city} label={city} value={city} />
            ))}
          </Picker>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <Text style={styles.loadingText}>A carregar...</Text>
        ) : filteredRooms.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Nenhum quarto encontrado com esses critérios.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.resultsCount}>
              {filteredRooms.length} {filteredRooms.length === 1 ? 'quarto encontrado' : 'quartos encontrados'}
            </Text>
            {filteredRooms.map((room) => (
              <TouchableOpacity
                key={room.id}
                style={styles.roomCard}
                onPress={() => router.push(`/rooms/${room.id}`)}
              >
                {room.room_photos && room.room_photos[0] ? (
                  <Image
                    source={{ uri: room.room_photos[0].photo_url }}
                    style={styles.roomImage}
                  />
                ) : (
                  <View style={[styles.roomImage, styles.noImage]}>
                    <Text style={styles.noImageText}>Sem foto</Text>
                  </View>
                )}
                <View style={styles.roomInfo}>
                  <Text style={styles.roomTitle} numberOfLines={1}>
                    {room.title}
                  </Text>
                  <View style={styles.roomDetail}>
                    <MapPin size={16} color="#666" />
                    <Text style={styles.roomDetailText}>{room.location}</Text>
                  </View>
                  <View style={styles.roomFooter}>
                    <View style={styles.priceContainer}>
                      <Euro size={16} color="#007AFF" />
                      <Text style={styles.roomPrice}>
                        {room.monthly_price}/mês
                      </Text>
                    </View>
                    {room.reviews && room.reviews.length > 0 && (
                      <Text style={styles.rating}>
                        ⭐ {calculateAverageRating(room.reviews)}
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </>
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
  filtersContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  pickerContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  scrollContent: {
    padding: 20,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 40,
  },
  emptyState: {
    marginTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
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
  roomFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  rating: {
    fontSize: 14,
    color: '#666',
  },
});
