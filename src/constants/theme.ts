import { AlertType } from '../types/database';

export const colors = {
  primary: '#DC2626', // Red for emergency theme
  primaryDark: '#B91C1C',
  secondary: '#1F2937',
  background: '#F9FAFB',
  surface: '#FFFFFF',
  text: '#111827',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};

export const alertTypeConfig: Record<AlertType, {
  label: string;
  color: string;
  icon: string;
  sound: string;
}> = {
  fire: {
    label: 'Incendie',
    color: '#EF4444',
    icon: 'flame',
    sound: 'alert-fire',
  },
  accident: {
    label: 'Accident',
    color: '#F59E0B',
    icon: 'warning',
    sound: 'alert-accident',
  },
  medical: {
    label: 'Médical',
    color: '#3B82F6',
    icon: 'medkit',
    sound: 'alert-medical',
  },
  other: {
    label: 'Autre',
    color: '#6B7280',
    icon: 'alert-circle',
    sound: 'alert-other',
  },
};

export const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrateur',
  site_manager: 'Responsable Site',
  sst: 'SST',
  employee: 'Employé',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};
