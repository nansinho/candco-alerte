import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile, Site } from '../types/database';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  userSites: Site[];
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  fetchUserSites: () => Promise<void>;
  updatePushToken: (token: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  userSites: [],
  isLoading: true,
  isInitialized: false,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      set({
        session,
        user: session?.user ?? null,
        isInitialized: true,
      });

      if (session?.user) {
        await get().fetchProfile();
        await get().fetchUserSites();
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      set({ isLoading: false });
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      set({ session, user: session?.user ?? null });

      if (session?.user) {
        await get().fetchProfile();
        await get().fetchUserSites();
      } else {
        set({ profile: null, userSites: [] });
      }
    });
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true });

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    set({ isLoading: false });

    return { error: error ? new Error(error.message) : null };
  },

  signOut: async () => {
    set({ isLoading: true });
    await supabase.auth.signOut();
    set({
      session: null,
      user: null,
      profile: null,
      userSites: [],
      isLoading: false,
    });
  },

  fetchProfile: async () => {
    const user = get().user;
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }

    set({ profile: data });
  },

  fetchUserSites: async () => {
    const user = get().user;
    if (!user) return;

    const { data, error } = await supabase
      .from('user_sites')
      .select('site:sites(*)')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching user sites:', error);
      return;
    }

    const sites = data
      .map((item: any) => item.site)
      .filter((site: Site | null): site is Site => site !== null);

    set({ userSites: sites });
  },

  updatePushToken: async (token: string) => {
    const user = get().user;
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ push_token: token })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating push token:', error);
    }
  },
}));
