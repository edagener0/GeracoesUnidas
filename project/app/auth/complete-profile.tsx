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
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { PORTUGUESE_UNIVERSITIES, PORTUGUESE_CITIES } from '@/constants/universities';
import { StudentType, UserType } from '@/types/database';

export default function CompleteProfile() {
  const { user, refreshProfile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState<UserType | null>(null);

  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');

  const [gender, setGender] = useState('');

  const [university, setUniversity] = useState('');
  const [course, setCourse] = useState('');
  const [studentType, setStudentType] = useState<StudentType>('national');

  useEffect(() => {
    const checkProfile = async () => {
      if (!user) {
        router.replace('/auth/login');
        return;
      }

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (existingProfile) {
        console.log('Profile already exists, redirecting to tabs');
        router.replace('/(tabs)');
        return;
      }

      const savedUserType = user.user_metadata?.user_type as UserType;
      if (savedUserType) {
        setUserType(savedUserType);
      } else {
        setUserType('student');
      }
    };

    checkProfile();
  }, [user]);

  const handleSubmit = async () => {
    if (!userType) {
      Alert.alert('Erro', 'Tipo de utilizador não definido');
      return;
    }

    if (!fullName || !age || !location) {
      Alert.alert('Erro', 'Por favor preencha todos os campos obrigatórios');
      return;
    }

    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 120) {
      Alert.alert('Erro', 'Idade inválida');
      return;
    }

    if (userType === 'elderly' && !gender) {
      Alert.alert('Erro', 'Por favor selecione o sexo');
      return;
    }

    if (userType === 'student' && (!university || !course)) {
      Alert.alert('Erro', 'Por favor preencha universidade e curso');
      return;
    }

    setLoading(true);
    try {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: user!.id,
        user_type: userType,
        full_name: fullName,
        age: ageNum,
        bio,
        location,
      });

      if (profileError) throw profileError;

      if (userType === 'elderly') {
        const { error: elderlyError } = await supabase
          .from('elderly_profiles')
          .insert({
            id: user!.id,
            gender,
          });

        if (elderlyError) throw elderlyError;
      } else {
        const { error: studentError } = await supabase
          .from('student_profiles')
          .insert({
            id: user!.id,
            university,
            course,
            student_type: studentType,
          });

        if (studentError) throw studentError;
      }

      await refreshProfile();

      await new Promise(resolve => setTimeout(resolve, 300));

      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Error creating profile:', error);
      Alert.alert('Erro', error.message || 'Erro ao criar perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Complete o seu Perfil</Text>
          <Text style={styles.subtitle}>
            Preencha as informações abaixo
          </Text>
        </View>

        {userType && (
          <View style={styles.userTypeBadge}>
            <Text style={styles.userTypeBadgeText}>
              {userType === 'elderly' ? 'Perfil de Idoso' : 'Perfil de Estudante'}
            </Text>
          </View>
        )}

        <View style={styles.form}>
          <Text style={styles.label}>Nome Completo *</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Seu nome completo"
          />

          <Text style={styles.label}>Idade *</Text>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
            placeholder="Ex: 25"
            keyboardType="number-pad"
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

          {userType === 'elderly' && (
            <>
              <Text style={styles.label}>Sexo *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={gender}
                  onValueChange={setGender}
                  style={styles.picker}
                >
                  <Picker.Item label="Selecione" value="" />
                  <Picker.Item label="Masculino" value="Masculino" />
                  <Picker.Item label="Feminino" value="Feminino" />
                </Picker>
              </View>
            </>
          )}

          {userType === 'student' && (
            <>
              <Text style={styles.label}>Universidade *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={university}
                  onValueChange={setUniversity}
                  style={styles.picker}
                >
                  <Picker.Item label="Selecione a universidade" value="" />
                  {PORTUGUESE_UNIVERSITIES.map((uni) => (
                    <Picker.Item key={uni} label={uni} value={uni} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.label}>Curso *</Text>
              <TextInput
                style={styles.input}
                value={course}
                onChangeText={setCourse}
                placeholder="Ex: Engenharia Informática"
              />

              <Text style={styles.label}>Tipo de Estudante *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={studentType}
                  onValueChange={(value) => setStudentType(value as StudentType)}
                  style={styles.picker}
                >
                  <Picker.Item label="Nacional" value="national" />
                  <Picker.Item label="Internacional" value="international" />
                  <Picker.Item label="Erasmus" value="erasmus" />
                </Picker>
              </View>
            </>
          )}

          <Text style={styles.label}>Biografia</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bio}
            onChangeText={setBio}
            placeholder="Fale um pouco sobre você..."
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Guardando...' : 'Guardar Perfil'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  userTypeBadge: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  userTypeBadgeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
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
    height: 100,
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
