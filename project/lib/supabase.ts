import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl = 'https://lwzpjbihfquchflqjewv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3enBqYmloZnF1Y2hmbHFqZXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMzkyNDUsImV4cCI6MjA3NzYxNTI0NX0.HnmcVbEb_ATjjpwz8FXzcviLL7xJ6ZEqCCK5QYtLpuM';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
