import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const { session, profile, loading } = useAuth();
  const router = useRouter();
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    if (!loading && !hasNavigated) {
      setHasNavigated(true);

      console.log('Index navigation:', {
        hasSession: !!session,
        hasProfile: !!profile,
        profileType: profile?.user_type
      });

      if (!session) {
        router.replace('/home');
      } else if (!profile) {
        router.replace('/auth/complete-profile');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [session, profile, loading, hasNavigated]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FF6A88" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF9A8B',
  },
});
