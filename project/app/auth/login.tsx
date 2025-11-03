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
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Users } from 'lucide-react-native';
import { theme } from '@/constants/theme';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signIn, session, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (session && !loading) {
      if (profile) {
        console.log('Login: Session and profile detected, navigating to tabs');
        router.replace('/(tabs)');
      }
    }
  }, [session, profile, loading]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor preencha todos os campos');
      return;
    }

    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Erro', error.message || 'Erro ao fazer login');
      setSubmitting(false);
    }
  };

  return (
    <LinearGradient
      colors={['#F5EDE4', '#EAD9C8', '#FDFBF8']}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Image
              source={{ uri: 'https://images.pexels.com/photos/7551662/pexels-photo-7551662.jpeg?auto=compress&cs=tinysrgb&w=800' }}
              style={styles.headerImage}
              resizeMode="cover"
            />
            <View style={styles.iconContainer}>
              <Users size={48} color="#8B6F47" strokeWidth={2.5} />
            </View>
            <Text style={styles.title}>Gerações Unidas</Text>
          <Text style={styles.subtitle}>
            Conectando idosos e estudantes
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="seu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Text style={styles.label}>Palavra-passe</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoComplete="password"
          />

          <TouchableOpacity
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={submitting}
          >
            <Text style={styles.buttonText}>
              {submitting ? 'Entrando...' : 'Entrar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.push('/auth/register')}
          >
            <Text style={styles.linkText}>
              Não tem conta? Registe-se aqui
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  headerImage: {
    width: '100%',
    height: 200,
    borderRadius: 24,
    marginBottom: 24,
    opacity: 0.85,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: theme.borderRadius.round,
    backgroundColor: '#FDFBF8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    shadowColor: 'rgba(139, 111, 71, 0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#E8DCC8',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#5C4434',
    marginTop: theme.spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: '#7A6651',
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5C4434',
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: '#FDFBF8',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: 16,
    marginBottom: theme.spacing.lg,
    borderWidth: 1.5,
    borderColor: '#E8DCC8',
    color: '#5C4434',
    shadowColor: 'rgba(139, 111, 71, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    backgroundColor: '#A67C52',
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    alignItems: 'center',
    marginTop: theme.spacing.md,
    shadowColor: 'rgba(139, 111, 71, 0.3)',
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
    letterSpacing: 0.3,
  },
  linkButton: {
    marginTop: theme.spacing.xl,
    alignItems: 'center',
  },
  linkText: {
    color: '#7A6651',
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
