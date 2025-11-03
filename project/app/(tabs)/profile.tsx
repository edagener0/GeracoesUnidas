import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { User, MapPin, GraduationCap, LogOut, Edit } from 'lucide-react-native';
import { theme } from '@/constants/theme';

interface ExtendedProfile {
  full_name: string;
  age: number;
  bio: string;
  location: string;
  user_type: 'elderly' | 'student';
  elderly_profile?: {
    gender: string;
  };
  student_profile?: {
    university: string;
    course: string;
    student_type: string;
  };
}

export default function Profile() {
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const [extendedProfile, setExtendedProfile] = useState<ExtendedProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExtendedProfile();
  }, [profile]);

  const fetchExtendedProfile = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          elderly_profile:elderly_profiles(*),
          student_profile:student_profiles(*)
        `)
        .eq('id', profile.id)
        .maybeSingle();

      if (error) throw error;
      setExtendedProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Terminar sessão',
      'Tem a certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/auth/login');
            } catch (error: any) {
              Alert.alert('Erro', 'Erro ao terminar sessão');
            }
          },
        },
      ]
    );
  };

  if (loading || !extendedProfile) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>A carregar...</Text>
      </View>
    );
  }

  const isElderly = extendedProfile.user_type === 'elderly';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <User size={48} color="#fff" />
        </View>
        <Text style={styles.name}>{extendedProfile.full_name}</Text>
        <Text style={styles.userType}>
          {isElderly ? 'Idoso' : 'Estudante'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informações Pessoais</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Idade</Text>
          <Text style={styles.infoValue}>{extendedProfile.age} anos</Text>
        </View>

        <View style={styles.infoRow}>
          <MapPin size={20} color="#666" />
          <Text style={styles.infoValue}>{extendedProfile.location}</Text>
        </View>

        {isElderly && extendedProfile.elderly_profile && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Sexo</Text>
            <Text style={styles.infoValue}>
              {extendedProfile.elderly_profile.gender}
            </Text>
          </View>
        )}

        {!isElderly && extendedProfile.student_profile && (
          <>
            <View style={styles.infoRow}>
              <GraduationCap size={20} color="#666" />
              <Text style={styles.infoValue}>
                {extendedProfile.student_profile.university}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Curso</Text>
              <Text style={styles.infoValue}>
                {extendedProfile.student_profile.course}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tipo</Text>
              <Text style={styles.infoValue}>
                {extendedProfile.student_profile.student_type === 'national'
                  ? 'Nacional'
                  : extendedProfile.student_profile.student_type === 'international'
                  ? 'Internacional'
                  : 'Erasmus'}
              </Text>
            </View>
          </>
        )}

        {extendedProfile.bio && (
          <>
            <Text style={styles.bioLabel}>Biografia</Text>
            <Text style={styles.bioText}>{extendedProfile.bio}</Text>
          </>
        )}
      </View>

      {isElderly && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Os Meus Quartos</Text>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={styles.menuItemText}>Ver quartos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/rooms/create')}
          >
            <Text style={styles.menuItemText}>Adicionar quarto</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isElderly && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Minhas Atividades</Text>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/favorites')}
          >
            <Text style={styles.menuItemText}>Quartos favoritos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/applications')}
          >
            <Text style={styles.menuItemText}>Minhas candidaturas</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <LogOut size={20} color="#fff" />
          <Text style={styles.signOutText}>Terminar sessão</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 32,
    backgroundColor: theme.colors.navbar,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.navbarIconActive,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.navbarText,
    marginBottom: 4,
  },
  userType: {
    fontSize: 16,
    color: theme.colors.navbarIcon,
    opacity: 0.8,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    width: 80,
  },
  infoValue: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 8,
  },
  bioLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  bioText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  menuItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  menuItemText: {
    fontSize: 16,
    color: '#007AFF',
  },
  signOutButton: {
    flexDirection: 'row',
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
