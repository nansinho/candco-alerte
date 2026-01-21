import { AlertType } from '../types/database';

// Dark theme inspired by Cursor - modern, sleek, professional
export const colors = {
  // Primary - Emergency Red with glow effect
  primary: '#FF3B30',
  primaryDark: '#D32F2F',
  primaryGlow: 'rgba(255, 59, 48, 0.3)',

  // Dark backgrounds
  background: '#0A0A0B',
  backgroundSecondary: '#111113',
  surface: '#1A1A1D',
  surfaceElevated: '#242428',

  // Text
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textTertiary: '#71717A',
  textMuted: '#52525B',
  textLight: '#6B7280',

  // Legacy compatibility
  secondary: '#8B5CF6',

  // Borders & Dividers
  border: '#27272A',
  borderLight: '#3F3F46',
  divider: '#18181B',

  // Accent colors
  accent: '#8B5CF6', // Purple accent
  accentGlow: 'rgba(139, 92, 246, 0.3)',

  // Status colors
  success: '#22C55E',
  successGlow: 'rgba(34, 197, 94, 0.3)',
  warning: '#F59E0B',
  warningGlow: 'rgba(245, 158, 11, 0.3)',
  error: '#EF4444',
  errorGlow: 'rgba(239, 68, 68, 0.3)',
  info: '#3B82F6',
  infoGlow: 'rgba(59, 130, 246, 0.3)',

  // Special
  gradient: ['#FF3B30', '#FF6B6B'],
  cardGlow: 'rgba(255, 255, 255, 0.05)',
};

export const alertTypeConfig: Record<AlertType, {
  label: string;
  color: string;
  colorGlow: string;
  icon: string;
  sound: string;
}> = {
  fire: {
    label: 'Incendie',
    color: '#FF6B35',
    colorGlow: 'rgba(255, 107, 53, 0.4)',
    icon: 'flame',
    sound: 'alert-fire',
  },
  accident: {
    label: 'Accident',
    color: '#FBBF24',
    colorGlow: 'rgba(251, 191, 36, 0.4)',
    icon: 'warning',
    sound: 'alert-accident',
  },
  medical: {
    label: 'Médical',
    color: '#60A5FA',
    colorGlow: 'rgba(96, 165, 250, 0.4)',
    icon: 'medkit',
    sound: 'alert-medical',
  },
  other: {
    label: 'Autre',
    color: '#A78BFA',
    colorGlow: 'rgba(167, 139, 250, 0.4)',
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
  xxxl: 64,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  hero: 48,
};

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  xxl: 28,
  full: 9999,
};

// Shadows for elevated elements (iOS only - Android uses elevation)
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
};
