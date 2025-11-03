import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Star } from 'lucide-react-native';

export default function CreateReview() {
  const { roomId } = useLocalSearchParams();
  const { profile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [roomTitle, setRoomTitle] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hasRental, setHasRental] = useState(false);
  const [existingReview, setExistingReview] = useState<any>(null);

  useEffect(() => {
    checkRentalAndReview();
  }, [roomId]);

  const checkRentalAndReview = async () => {
    try {
      const { data: roomData } = await supabase
        .from('rooms')
        .select('title')
        .eq('id', roomId)
        .maybeSingle();

      if (roomData) setRoomTitle(roomData.title);

      const { data: rentalData } = await supabase
        .from('rentals')
        .select('id')
        .eq('room_id', roomId)
        .eq('student_id', profile!.id)
        .maybeSingle();

      setHasRental(!!rentalData);

      const { data: reviewData } = await supabase
        .from('reviews')
        .select('*')
        .eq('room_id', roomId)
        .eq('student_id', profile!.id)
        .maybeSingle();

      if (reviewData) {
        setExistingReview(reviewData);
        setRating(reviewData.rating);
        setComment(reviewData.comment || '');
      }
    } catch (error) {
      console.error('Error checking rental:', error);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Erro', 'Por favor selecione uma avaliação de 1 a 5 estrelas');
      return;
    }

    setLoading(true);
    try {
      if (existingReview) {
        const { error } = await supabase
          .from('reviews')
          .update({
            rating,
            comment,
          })
          .eq('id', existingReview.id);

        if (error) throw error;
        Alert.alert('Sucesso', 'Avaliação atualizada com sucesso!', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      } else {
        const { error } = await supabase.from('reviews').insert({
          room_id: roomId as string,
          student_id: profile!.id,
          rating,
          comment,
        });

        if (error) throw error;
        Alert.alert('Sucesso', 'Avaliação criada com sucesso!', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao guardar avaliação');
    } finally {
      setLoading(false);
    }
  };

  if (!hasRental && !existingReview) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Avaliar Quarto</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Apenas pode avaliar quartos onde já esteve ou está atualmente.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {existingReview ? 'Editar Avaliação' : 'Avaliar Quarto'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.roomTitle}>{roomTitle}</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Avaliação *</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}
              >
                <Star
                  size={40}
                  color={star <= rating ? '#FFB800' : '#ccc'}
                  fill={star <= rating ? '#FFB800' : 'transparent'}
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingText}>
            {rating === 0
              ? 'Selecione uma avaliação'
              : rating === 1
              ? 'Muito mau'
              : rating === 2
              ? 'Mau'
              : rating === 3
              ? 'Razoável'
              : rating === 4
              ? 'Bom'
              : 'Excelente'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Comentário (opcional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={comment}
            onChangeText={setComment}
            placeholder="Partilhe a sua experiência..."
            multiline
            numberOfLines={6}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading
              ? 'Guardando...'
              : existingReview
              ? 'Atualizar Avaliação'
              : 'Publicar Avaliação'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  scrollContent: {
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
  },
  roomTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 150,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
