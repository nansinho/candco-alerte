import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://holnwiarnwcnekhicyir.supabase.co';
const supabaseAnonKey = 'sb_publishable_DhsLxd8E_7yUs1nzAIT2MQ_uVn3ukhZ';

// Create Supabase client without strict typing to avoid type conflicts
// Types are enforced at the application level instead
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
