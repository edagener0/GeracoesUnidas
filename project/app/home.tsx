import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Heart, Home, Users, MessageCircle, Shield } from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={['#FF9A8B', '#FF6A88', '#FF99AC']}
      style={styles.gradient}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Heart size={60} color="#fff" fill="#fff" />
          </View>
          <Text style={styles.title}>Gerações Unidas</Text>
          <Text style={styles.tagline}>
            Conectando idosos e estudantes através da partilha de espaços
          </Text>
        </View>

        <View style={styles.featuresContainer}>
          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <Home size={32} color="#fff" />
            </View>
            <Text style={styles.featureTitle}>Quartos Acessíveis</Text>
            <Text style={styles.featureText}>
              Estudantes encontram alojamento económico e de qualidade
            </Text>
          </View>

          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <Users size={32} color="#fff" />
            </View>
            <Text style={styles.featureTitle}>Companhia</Text>
            <Text style={styles.featureText}>
              Idosos recebem companhia e apoio no dia a dia
            </Text>
          </View>

          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <MessageCircle size={32} color="#fff" />
            </View>
            <Text style={styles.featureTitle}>Partilha de Experiências</Text>
            <Text style={styles.featureText}>
              Troca de conhecimentos entre gerações
            </Text>
          </View>

          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <Shield size={32} color="#fff" />
            </View>
            <Text style={styles.featureTitle}>Segurança</Text>
            <Text style={styles.featureText}>
              Plataforma verificada e segura para ambas as partes
            </Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>500+</Text>
            <Text style={styles.statLabel}>Quartos</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>1000+</Text>
            <Text style={styles.statLabel}>Utilizadores</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>95%</Text>
            <Text style={styles.statLabel}>Satisfação</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/auth/register')}
          >
            <Text style={styles.primaryButtonText}>Criar Conta</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.secondaryButtonText}>Já tenho conta</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Uma iniciativa para unir gerações e criar comunidade
        </Text>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.95,
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  featuresContainer: {
    marginBottom: 40,
  },
  feature: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  featureIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureText: {
    fontSize: 15,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 24,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  buttonContainer: {
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#FF6A88',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 20,
  },
});
