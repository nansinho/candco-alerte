import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius, roleLabels } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

export function ProfileScreen() {
  const { profile, userSites, signOut } = useAuthStore();

  const handleSignOut = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnexion', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const getInitials = () => {
    const first = profile?.first_name?.[0] || '';
    const last = profile?.last_name?.[0] || '';
    return (first + last).toUpperCase() || '?';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials()}</Text>
          </View>
          <Text style={styles.name}>
            {profile?.first_name || ''} {profile?.last_name || ''}
          </Text>
          <Text style={styles.email}>{profile?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {roleLabels[profile?.role || 'employee']}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mes sites</Text>
          {userSites.length > 0 ? (
            userSites.map((site) => (
              <View key={site.id} style={styles.siteItem}>
                <Ionicons name="business" size={20} color={colors.textSecondary} />
                <View style={styles.siteInfo}>
                  <Text style={styles.siteName}>{site.name}</Text>
                  {site.address && (
                    <Text style={styles.siteAddress}>{site.address}</Text>
                  )}
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noSites}>Aucun site assigné</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          {profile?.phone ? (
            <View style={styles.infoRow}>
              <Ionicons name="call" size={20} color={colors.textSecondary} />
              <Text style={styles.infoText}>{profile.phone}</Text>
            </View>
          ) : (
            <Text style={styles.noInfo}>Numéro de téléphone non renseigné</Text>
          )}
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
            <Text style={styles.menuItemText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="help-circle-outline" size={24} color={colors.text} />
            <Text style={styles.menuItemText}>Aide</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="document-text-outline" size={24} color={colors.text} />
            <Text style={styles.menuItemText}>Conditions d'utilisation</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={24} color={colors.error} />
          <Text style={styles.signOutText}>Déconnexion</Text>
        </TouchableOpacity>

        <Text style={styles.version}>CandCO Alerte v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.surface,
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  email: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  roleBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  roleText: {
    color: colors.surface,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  section: {
    backgroundColor: colors.surface,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  siteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  siteInfo: {
    flex: 1,
  },
  siteName: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '500',
  },
  siteAddress: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  noSites: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  noInfo: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  menuItemText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  signOutText: {
    fontSize: fontSize.md,
    color: colors.error,
    fontWeight: '600',
  },
  version: {
    textAlign: 'center',
    fontSize: fontSize.xs,
    color: colors.textLight,
    marginBottom: spacing.xl,
  },
});
