import 'react-native-url-polyfill/dist/setup';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = 'https://holnwiarnwcnekhicyir.supabase.co';
const supabaseAnonKey = 'sb_publishable_DhsLxd8E_7yUs1nzAIT2MQ_uVn3ukhZ';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
