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
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { PORTUGUESE_CITIES } from '@/constants/universities';
import { X, Plus, Trash2 } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import type { RoomServices, CustomService } from '@/types/database';

const ROOM_TYPES = [
  'Quarto individual',
  'Quarto partilhado',
  'Quarto com casa de banho privada',
  'Suite',
];

const PAYMENT_METHODS = [
  'Transferência Bancária',
  'MB WAY',
  'Dinheiro',
  'Multibanco',
  'PayPal',
];

export default function CreateRoom() {
  const { profile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState<'basic' | 'payment'>('basic');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [roomType, setRoomType] = useState('Quarto individual');
  const [monthlyPrice, setMonthlyPrice] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>(['']);

  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [services, setServices] = useState<RoomServices>({
    room_cleaning: { enabled: false, price: 0 },
    lunch: { enabled: false, price: 0 },
    dinner: { enabled: false, price: 0 },
    custom_services: [],
  });
  const [totalPrice, setTotalPrice] = useState(0);
  const [newCustomServiceName, setNewCustomServiceName] = useState('');
  const [newCustomServicePrice, setNewCustomServicePrice] = useState('');

  const handleAddPhotoUrl = () => {
    setPhotoUrls([...photoUrls, '']);
  };

  const handleRemovePhotoUrl = (index: number) => {
    const newUrls = photoUrls.filter((_, i) => i !== index);
    setPhotoUrls(newUrls.length > 0 ? newUrls : ['']);
  };

  const handlePhotoUrlChange = (text: string, index: number) => {
    const newUrls = [...photoUrls];
    newUrls[index] = text;
    setPhotoUrls(newUrls);
  };

  useEffect(() => {
    calculateTotalPrice();
  }, [monthlyPrice, services]);

  const calculateTotalPrice = () => {
    const basePrice = parseFloat(monthlyPrice) || 0;
    let servicesTotal = 0;

    if (services.room_cleaning.enabled) {
      servicesTotal += services.room_cleaning.price;
    }
    if (services.lunch.enabled) {
      servicesTotal += services.lunch.price;
    }
    if (services.dinner.enabled) {
      servicesTotal += services.dinner.price;
    }
    services.custom_services.forEach(service => {
      servicesTotal += service.price;
    });

    setTotalPrice(basePrice + servicesTotal);
  };

  const togglePaymentMethod = (method: string) => {
    if (paymentMethods.includes(method)) {
      setPaymentMethods(paymentMethods.filter(m => m !== method));
    } else {
      setPaymentMethods([...paymentMethods, method]);
    }
  };

  const toggleService = (serviceName: 'room_cleaning' | 'lunch' | 'dinner') => {
    setServices(prev => ({
      ...prev,
      [serviceName]: {
        ...prev[serviceName],
        enabled: !prev[serviceName].enabled,
      },
    }));
  };

  const updateServicePrice = (
    serviceName: 'room_cleaning' | 'lunch' | 'dinner',
    price: string
  ) => {
    const numPrice = parseFloat(price) || 0;
    setServices(prev => ({
      ...prev,
      [serviceName]: {
        ...prev[serviceName],
        price: numPrice,
      },
    }));
  };

  const addCustomService = () => {
    if (!newCustomServiceName.trim()) {
      Alert.alert('Erro', 'Digite o nome do serviço');
      return;
    }
    const price = parseFloat(newCustomServicePrice) || 0;

    setServices(prev => ({
      ...prev,
      custom_services: [
        ...prev.custom_services,
        { name: newCustomServiceName, price },
      ],
    }));
    setNewCustomServiceName('');
    setNewCustomServicePrice('');
  };

  const removeCustomService = (index: number) => {
    setServices(prev => ({
      ...prev,
      custom_services: prev.custom_services.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!title || !description || !monthlyPrice || !location || !address) {
      Alert.alert('Erro', 'Por favor preencha todos os campos obrigatórios');
      return;
    }

    const price = parseFloat(monthlyPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Erro', 'Preço inválido');
      return;
    }

    setLoading(true);
    try {
      const { data: roomData, error: roomError} = await supabase
        .from('rooms')
        .insert({
          elderly_id: profile!.id,
          title,
          description,
          room_type: roomType,
          monthly_price: price,
          location,
          address,
          payment_methods: paymentMethods,
          services,
          total_monthly_price: totalPrice,
        })
        .select()
        .single();

      if (roomError) throw roomError;

      const validPhotoUrls = photoUrls.filter(url => url.trim() !== '');
      if (validPhotoUrls.length > 0) {
        const photoInserts = validPhotoUrls.map((url, index) => ({
          room_id: roomData.id,
          photo_url: url,
          display_order: index,
        }));

        const { error: photosError } = await supabase
          .from('room_photos')
          .insert(photoInserts);

        if (photosError) throw photosError;
      }

      Alert.alert('Sucesso', 'Quarto criado com sucesso!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao criar quarto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Criar Anúncio</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, currentTab === 'basic' && styles.tabActive]}
          onPress={() => setCurrentTab('basic')}
        >
          <Text style={[styles.tabText, currentTab === 'basic' && styles.tabTextActive]}>
            Informações Básicas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, currentTab === 'payment' && styles.tabActive]}
          onPress={() => setCurrentTab('payment')}
        >
          <Text style={[styles.tabText, currentTab === 'payment' && styles.tabTextActive]}>
            Pagamento e Serviços
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {currentTab === 'basic' ? (
          <View>
        <Text style={styles.label}>Título *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Ex: Quarto acolhedor perto da universidade"
        />

        <Text style={styles.label}>Descrição *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Descreva o quarto e as condições..."
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Tipo de Quarto *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={roomType}
            onValueChange={setRoomType}
            style={styles.picker}
          >
            {ROOM_TYPES.map((type) => (
              <Picker.Item key={type} label={type} value={type} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Preço Mensal (€) *</Text>
        <TextInput
          style={styles.input}
          value={monthlyPrice}
          onChangeText={setMonthlyPrice}
          placeholder="Ex: 250"
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Localidade *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={location}
            onValueChange={setLocation}
            style={styles.picker}
          >
            <Picker.Item label="Selecione a cidade" value="" />
            {PORTUGUESE_CITIES.map((city) => (
              <Picker.Item key={city} label={city} value={city} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Morada Completa *</Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          placeholder="Rua, número, código postal"
        />

        <Text style={styles.label}>URLs das Fotos</Text>
        <Text style={styles.helperText}>
          Use links diretos de imagens do Pexels ou outras fontes
        </Text>
        {photoUrls.map((url, index) => (
          <View key={index} style={styles.photoUrlRow}>
            <TextInput
              style={[styles.input, styles.photoInput]}
              value={url}
              onChangeText={(text) => handlePhotoUrlChange(text, index)}
              placeholder="https://images.pexels.com/..."
            />
            {photoUrls.length > 1 && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemovePhotoUrl(index)}
              >
                <X size={20} color="#FF3B30" />
              </TouchableOpacity>
            )}
          </View>
        ))}
        <TouchableOpacity
          style={styles.addPhotoButton}
          onPress={handleAddPhotoUrl}
        >
          <Text style={styles.addPhotoText}>+ Adicionar foto</Text>
        </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Text style={styles.sectionTitle}>Métodos de Pagamento</Text>
            <Text style={styles.helperText}>
              Selecione os métodos de pagamento aceitos
            </Text>
            {PAYMENT_METHODS.map((method) => (
              <TouchableOpacity
                key={method}
                style={styles.checkboxRow}
                onPress={() => togglePaymentMethod(method)}
              >
                <View style={[
                  styles.checkbox,
                  paymentMethods.includes(method) && styles.checkboxChecked
                ]}>
                  {paymentMethods.includes(method) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
                <Text style={styles.checkboxLabel}>{method}</Text>
              </TouchableOpacity>
            ))}

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
              Serviços Adicionais
            </Text>
            <Text style={styles.helperText}>
              Ative serviços extras e defina o preço mensal
            </Text>

            <View style={styles.serviceRow}>
              <View style={styles.serviceHeader}>
                <Switch
                  value={services.room_cleaning.enabled}
                  onValueChange={() => toggleService('room_cleaning')}
                  trackColor={{ false: theme.colors.textLight, true: theme.colors.primary }}
                  thumbColor="#fff"
                />
                <Text style={styles.serviceLabel}>Limpeza do quarto</Text>
              </View>
              {services.room_cleaning.enabled && (
                <TextInput
                  style={styles.serviceInput}
                  value={services.room_cleaning.price.toString()}
                  onChangeText={(text) => updateServicePrice('room_cleaning', text)}
                  placeholder="Preço (€)"
                  keyboardType="decimal-pad"
                />
              )}
            </View>

            <View style={styles.serviceRow}>
              <View style={styles.serviceHeader}>
                <Switch
                  value={services.lunch.enabled}
                  onValueChange={() => toggleService('lunch')}
                  trackColor={{ false: theme.colors.textLight, true: theme.colors.primary }}
                  thumbColor="#fff"
                />
                <Text style={styles.serviceLabel}>Almoços</Text>
              </View>
              {services.lunch.enabled && (
                <TextInput
                  style={styles.serviceInput}
                  value={services.lunch.price.toString()}
                  onChangeText={(text) => updateServicePrice('lunch', text)}
                  placeholder="Preço (€)"
                  keyboardType="decimal-pad"
                />
              )}
            </View>

            <View style={styles.serviceRow}>
              <View style={styles.serviceHeader}>
                <Switch
                  value={services.dinner.enabled}
                  onValueChange={() => toggleService('dinner')}
                  trackColor={{ false: theme.colors.textLight, true: theme.colors.primary }}
                  thumbColor="#fff"
                />
                <Text style={styles.serviceLabel}>Jantares</Text>
              </View>
              {services.dinner.enabled && (
                <TextInput
                  style={styles.serviceInput}
                  value={services.dinner.price.toString()}
                  onChangeText={(text) => updateServicePrice('dinner', text)}
                  placeholder="Preço (€)"
                  keyboardType="decimal-pad"
                />
              )}
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
              Serviços Personalizados
            </Text>
            {services.custom_services.map((service, index) => (
              <View key={index} style={styles.customServiceRow}>
                <View style={styles.customServiceInfo}>
                  <Text style={styles.customServiceName}>{service.name}</Text>
                  <Text style={styles.customServicePrice}>{service.price}€/mês</Text>
                </View>
                <TouchableOpacity onPress={() => removeCustomService(index)}>
                  <Trash2 size={20} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.addCustomServiceContainer}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={newCustomServiceName}
                onChangeText={setNewCustomServiceName}
                placeholder="Nome do serviço"
              />
              <TextInput
                style={[styles.input, { width: 100, marginLeft: 8 }]}
                value={newCustomServicePrice}
                onChangeText={setNewCustomServicePrice}
                placeholder="Preço (€)"
                keyboardType="decimal-pad"
              />
              <TouchableOpacity
                style={styles.addServiceButton}
                onPress={addCustomService}
              >
                <Plus size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.totalPriceContainer}>
              <Text style={styles.totalPriceLabel}>Preço Total Mensal:</Text>
              <Text style={styles.totalPriceValue}>{totalPrice.toFixed(2)}€</Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Criando...' : 'Criar Anúncio'}
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
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  photoUrlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  photoInput: {
    flex: 1,
    marginBottom: 0,
  },
  removeButton: {
    marginLeft: 8,
    padding: 8,
  },
  addPhotoButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  addPhotoText: {
    color: '#007AFF',
    fontSize: 16,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textLight,
  },
  tabTextActive: {
    color: theme.colors.primary,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textDark,
    marginBottom: theme.spacing.md,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.accentWarm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.textLight,
    marginRight: theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  serviceRow: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  serviceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  serviceInput: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    fontSize: 16,
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  customServiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.accentWarm,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  customServiceInfo: {
    flex: 1,
  },
  customServiceName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textDark,
  },
  customServicePrice: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginTop: 4,
  },
  addCustomServiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  addServiceButton: {
    backgroundColor: theme.colors.primary,
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.sm,
    shadowColor: theme.colors.shadowMedium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  totalPriceContainer: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  totalPriceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  totalPriceValue: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.primary,
  },
});
