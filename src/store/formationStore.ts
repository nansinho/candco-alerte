import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import {
  Formation,
  ScheduledSession,
  SessionRegistration,
  FormationWithSessions,
  FinancingMode,
  SessionSelectionType,
  NeedsAnalysis,
} from '../types/database';

interface FormationState {
  // Formations list
  formations: FormationWithSessions[];
  isLoadingFormations: boolean;

  // Selected formation
  selectedFormation: FormationWithSessions | null;

  // Session selection
  selectionType: SessionSelectionType | null;
  selectedSession: ScheduledSession | null;
  proposedStartDate: string | null;
  proposedEndDate: string | null;

  // Registration form data
  financingMode: FinancingMode | null;
  financingDetails: string;
  message: string;
  needsAnalysis: NeedsAnalysis;

  // Registration state
  isSubmitting: boolean;

  // Actions
  fetchFormations: () => Promise<void>;
  fetchFormationById: (id: string) => Promise<void>;
  setSelectedFormation: (formation: FormationWithSessions | null) => void;
  setSelectionType: (type: SessionSelectionType | null) => void;
  setSelectedSession: (session: ScheduledSession | null) => void;
  setProposedDates: (startDate: string | null, endDate: string | null) => void;
  setFinancingMode: (mode: FinancingMode | null) => void;
  setFinancingDetails: (details: string) => void;
  setMessage: (message: string) => void;
  updateNeedsAnalysis: (field: keyof NeedsAnalysis, value: string) => void;
  submitRegistration: (userId: string) => Promise<{ data: SessionRegistration | null; error: Error | null }>;
  resetRegistrationForm: () => void;
}

const initialNeedsAnalysis: NeedsAnalysis = {
  currentSkillLevel: 'debutant',
  previousExperience: '',
  learningObjectives: '',
  specificConstraints: '',
  expectedOutcomes: '',
};

export const useFormationStore = create<FormationState>((set, get) => ({
  // Initial state
  formations: [],
  isLoadingFormations: false,
  selectedFormation: null,
  selectionType: null,
  selectedSession: null,
  proposedStartDate: null,
  proposedEndDate: null,
  financingMode: null,
  financingDetails: '',
  message: '',
  needsAnalysis: { ...initialNeedsAnalysis },
  isSubmitting: false,

  // Actions
  fetchFormations: async () => {
    set({ isLoadingFormations: true });
    try {
      const { data: formations, error } = await supabase
        .from('formations')
        .select(`
          *,
          scheduled_sessions (*)
        `)
        .order('title');

      if (error) throw error;
      set({ formations: formations || [] });
    } catch (error) {
      console.error('Error fetching formations:', error);
    } finally {
      set({ isLoadingFormations: false });
    }
  },

  fetchFormationById: async (id: string) => {
    set({ isLoadingFormations: true });
    try {
      const { data: formation, error } = await supabase
        .from('formations')
        .select(`
          *,
          scheduled_sessions (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      set({ selectedFormation: formation });
    } catch (error) {
      console.error('Error fetching formation:', error);
    } finally {
      set({ isLoadingFormations: false });
    }
  },

  setSelectedFormation: (formation) => {
    set({ selectedFormation: formation });
  },

  setSelectionType: (type) => {
    set({ selectionType: type, selectedSession: null, proposedStartDate: null, proposedEndDate: null });
  },

  setSelectedSession: (session) => {
    set({ selectedSession: session, proposedStartDate: null, proposedEndDate: null });
  },

  setProposedDates: (startDate, endDate) => {
    set({ proposedStartDate: startDate, proposedEndDate: endDate, selectedSession: null });
  },

  setFinancingMode: (mode) => {
    set({ financingMode: mode });
  },

  setFinancingDetails: (details) => {
    set({ financingDetails: details });
  },

  setMessage: (message) => {
    set({ message });
  },

  updateNeedsAnalysis: (field, value) => {
    set((state) => ({
      needsAnalysis: {
        ...state.needsAnalysis,
        [field]: value,
      },
    }));
  },

  submitRegistration: async (userId: string) => {
    const state = get();
    set({ isSubmitting: true });

    try {
      if (!state.selectedFormation) {
        throw new Error('Aucune formation sélectionnée');
      }
      if (!state.selectionType) {
        throw new Error('Type de sélection non défini');
      }
      if (!state.financingMode) {
        throw new Error('Mode de financement non sélectionné');
      }

      // Validate needs analysis
      const { needsAnalysis } = state;
      if (!needsAnalysis.learningObjectives.trim()) {
        throw new Error('Veuillez renseigner vos objectifs d\'apprentissage');
      }

      const registrationData = {
        user_id: userId,
        formation_id: state.selectedFormation.id,
        scheduled_session_id: state.selectedSession?.id || null,
        selection_type: state.selectionType,
        proposed_start_date: state.proposedStartDate,
        proposed_end_date: state.proposedEndDate,
        financing_mode: state.financingMode,
        financing_details: state.financingDetails.trim() || null,
        message: state.message.trim() || null,
        needs_analysis: state.needsAnalysis,
        status: 'pending' as const,
      };

      const { data, error } = await supabase
        .from('session_registrations')
        .insert(registrationData)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error submitting registration:', error);
      return { data: null, error: error as Error };
    } finally {
      set({ isSubmitting: false });
    }
  },

  resetRegistrationForm: () => {
    set({
      selectionType: null,
      selectedSession: null,
      proposedStartDate: null,
      proposedEndDate: null,
      financingMode: null,
      financingDetails: '',
      message: '',
      needsAnalysis: { ...initialNeedsAnalysis },
    });
  },
}));
