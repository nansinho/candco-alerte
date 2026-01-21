import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { CheckIn, Site } from '../types/database';

interface CheckInState {
  currentCheckIn: CheckIn | null;
  checkInHistory: CheckIn[];
  isLoading: boolean;

  // Actions
  fetchCurrentCheckIn: (userId: string) => Promise<void>;
  fetchCheckInHistory: (userId: string) => Promise<void>;
  checkIn: (userId: string, siteId: string) => Promise<{ error: Error | null }>;
  checkOut: (userId: string) => Promise<{ error: Error | null }>;
}

export const useCheckInStore = create<CheckInState>((set, get) => ({
  currentCheckIn: null,
  checkInHistory: [],
  isLoading: false,

  fetchCurrentCheckIn: async (userId: string) => {
    const { data, error } = await supabase
      .from('check_ins')
      .select('*')
      .eq('user_id', userId)
      .is('checked_out_at', null)
      .order('checked_in_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching current check-in:', error);
      return;
    }

    set({ currentCheckIn: data });
  },

  fetchCheckInHistory: async (userId: string) => {
    set({ isLoading: true });

    const { data, error } = await supabase
      .from('check_ins')
      .select('*')
      .eq('user_id', userId)
      .order('checked_in_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching check-in history:', error);
      set({ isLoading: false });
      return;
    }

    set({ checkInHistory: data, isLoading: false });
  },

  checkIn: async (userId: string, siteId: string) => {
    // First check out from any existing check-in
    const currentCheckIn = get().currentCheckIn;
    if (currentCheckIn) {
      await get().checkOut(userId);
    }

    const { data, error } = await supabase
      .from('check_ins')
      .insert({
        user_id: userId,
        site_id: siteId,
        checked_in_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return { error: new Error(error.message) };
    }

    set({ currentCheckIn: data });
    return { error: null };
  },

  checkOut: async (userId: string) => {
    const currentCheckIn = get().currentCheckIn;
    if (!currentCheckIn) {
      return { error: new Error('Pas de check-in actif') };
    }

    const { error } = await supabase
      .from('check_ins')
      .update({
        checked_out_at: new Date().toISOString(),
      })
      .eq('id', currentCheckIn.id);

    if (error) {
      return { error: new Error(error.message) };
    }

    set({ currentCheckIn: null });
    await get().fetchCheckInHistory(userId);
    return { error: null };
  },
}));
