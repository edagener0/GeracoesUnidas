import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { theme } from '@/constants/theme';
import { ArrowLeft, CheckCircle, CreditCard } from 'lucide-react-native';

interface Application {
  id: string;
  status: string;
  room: {
    id: string;
    title: string;
    monthly_price: number;
    total_monthly_price: number;
    payment_methods: string[];
    location: string;
    elderly_id: string;
    elderly: {
      full_name: string;
    };
  };
}

export default function FinalizeApplication() {
  const { id } = useLocalSearchParams();
  const { profile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [application, setApplication] = useState<Application | null>(null);

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const fetchApplication = async () => {
    try {
      const { data, error } = await supabase
        .from('room_applications')
        .select(`
          id,
          status,
          room:rooms(
            id,
            title,
            monthly_price,
            total_monthly_price,
            payment_methods,
            location,
            elderly_id,
            elderly:profiles!rooms_elderly_id_fkey(full_name)
          )
        `)
        .eq('id', id)
        .eq('student_id', profile!.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        Alert.alert('Erro', 'Candidatura não encontrada');
        router.back();
        return;
      }

      if (data.status !== 'awaiting_payment') {
        Alert.alert(
          'Aviso',
          'Esta candidatura não está aguardando pagamento',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return;
      }

      setApplication(data as any);
    } catch (error: any) {
      console.error('Error fetching application:', error);
      Alert.alert('Erro', 'Erro ao carregar candidatura');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    Alert.alert(
      'Confirmar Pagamento',
      `Confirma que efetuou o pagamento de ${application?.room.total_monthly_price || application?.room.monthly_price}€?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: processPayment,
        },
      ]
    );
  };

  const processPayment = async () => {
    setProcessing(true);
    try {
      const monthlyAmount = application!.room.total_monthly_price || application!.room.monthly_price;

      const { data: rentalData, error: rentalError } = await supabase
        .from('rentals')
        .insert({
          room_id: application!.room.id,
          student_id: profile!.id,
          elderly_id: application!.room.elderly_id,
          monthly_amount: monthlyAmount,
          start_date: new Date().toISOString(),
          status: 'active',
        })
        .select()
        .single();

      if (rentalError) throw rentalError;

      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + 1);

      const platformFee = monthlyAmount * 0.1;
      const elderlyAmount = monthlyAmount - platformFee;

      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          rental_id: rentalData.id,
          amount: monthlyAmount,
          platform_fee: platformFee,
          elderly_amount: elderlyAmount,
          payment_date: new Date().toISOString(),
          due_date: dueDate.toISOString(),
          status: 'completed',
        });

      if (paymentError) throw paymentError;

      const { error: roomError } = await supabase
        .from('rooms')
        .update({ is_available: false })
        .eq('id', application!.room.id);

      if (roomError) throw roomError;

      Alert.alert(
        'Sucesso!',
        'Pagamento confirmado! O seu arrendamento foi iniciado.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error processing payment:', error);
      Alert.alert('Erro', error.message || 'Erro ao processar pagamento');
    } finally {
      setProcessing(false);
    }
  };

  if (loading || !application) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>A carregar...</Text>
      </View>
    );
  }

  const price = application.room.total_monthly_price || application.room.monthly_price;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Finalizar Candidatura</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.successCard}>
          <CheckCircle size={64} color={theme.colors.success} />
          <Text style={styles.successTitle}>Candidatura Aceite!</Text>
          <Text style={styles.successText}>
            Parabéns! O host {application.room.elderly.full_name} aceitou a sua candidatura.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Detalhes do Quarto</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Quarto:</Text>
            <Text style={styles.detailValue}>{application.room.title}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Localização:</Text>
            <Text style={styles.detailValue}>{application.room.location}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Host:</Text>
            <Text style={styles.detailValue}>{application.room.elderly.full_name}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pagamento</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Valor Mensal:</Text>
            <Text style={styles.priceValue}>{price.toFixed(2)}€</Text>
          </View>
          <Text style={styles.priceNote}>
            Este valor inclui o quarto e todos os serviços selecionados.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Métodos de Pagamento Aceites</Text>
          {application.room.payment_methods.length > 0 ? (
            application.room.payment_methods.map((method, index) => (
              <View key={index} style={styles.paymentMethodRow}>
                <CreditCard size={20} color={theme.colors.primary} />
                <Text style={styles.paymentMethodText}>{method}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noMethodsText}>
              Nenhum método especificado. Contacte o host.
            </Text>
          )}
        </View>

        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>Próximos Passos:</Text>
          <Text style={styles.instructionText}>
            1. Efetue o pagamento de {price.toFixed(2)}€ usando um dos métodos aceites
          </Text>
          <Text style={styles.instructionText}>
            2. Após realizar o pagamento, clique no botão abaixo para confirmar
          </Text>
          <Text style={styles.instructionText}>
            3. O arrendamento será iniciado automaticamente
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, processing && styles.buttonDisabled]}
          onPress={handleConfirmPayment}
          disabled={processing}
        >
          <Text style={styles.buttonText}>
            {processing ? 'Processando...' : 'Confirmar Pagamento Efetuado'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.helperText}>
          Importante: Apenas confirme após efetuar o pagamento ao host.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 60,
    paddingBottom: theme.spacing.lg,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textDark,
  },
  loadingText: {
    textAlign: 'center',
    color: theme.colors.textLight,
    fontSize: 16,
    marginTop: 100,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  successCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    borderWidth: 2,
    borderColor: theme.colors.success,
    shadowColor: theme.colors.shadowMedium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.success,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  successText: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textDark,
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.accentWarm,
  },
  detailLabel: {
    fontSize: 15,
    color: theme.colors.textLight,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 15,
    color: theme.colors.textDark,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  priceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  priceValue: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  priceNote: {
    fontSize: 14,
    color: theme.colors.textLight,
    fontStyle: 'italic',
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.accentWarm,
  },
  paymentMethodText: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  noMethodsText: {
    fontSize: 15,
    color: theme.colors.textLight,
    fontStyle: 'italic',
  },
  instructionsCard: {
    backgroundColor: theme.colors.accentWarm,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textDark,
    marginBottom: theme.spacing.md,
  },
  instructionText: {
    fontSize: 15,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    fontWeight: '500',
    lineHeight: 22,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.shadowMedium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  helperText: {
    fontSize: 14,
    color: theme.colors.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
