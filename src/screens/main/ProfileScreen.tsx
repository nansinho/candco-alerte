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
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, spacing, fontSize, borderRadius, roleLabels, shadows } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

export function ProfileScreen() {
  const { profile, userSites, signOut } = useAuthStore();

  const handleSignOut = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            signOut();
          },
        },
      ]
    );
  };

  const handleMenuPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const getInitials = () => {
    const first = profile?.first_name?.[0] || '';
    const last = profile?.last_name?.[0] || '';
    return (first + last).toUpperCase() || '?';
  };

  const getRoleColor = () => {
    switch (profile?.role) {
      case 'super_admin':
        return '#FF3B30';
      case 'admin':
        return '#8B5CF6';
      case 'site_manager':
        return '#3B82F6';
      case 'sst':
        return '#22C55E';
      default:
        return colors.textSecondary;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Avatar */}
        <View style={styles.header}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarGlow} />
            <LinearGradient
              colors={['#FF3B30', '#FF6B6B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{getInitials()}</Text>
            </LinearGradient>
          </View>
          <Text style={styles.name}>
            {profile?.first_name || ''} {profile?.last_name || ''}
          </Text>
          <Text style={styles.email}>{profile?.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: `${getRoleColor()}20` }]}>
            <View style={[styles.roleIndicator, { backgroundColor: getRoleColor() }]} />
            <Text style={[styles.roleText, { color: getRoleColor() }]}>
              {roleLabels[profile?.role || 'employee']}
            </Text>
          </View>
        </View>

        {/* Sites Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="business" size={18} color={colors.primary} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Mes sites</Text>
          </View>
          <View style={styles.card}>
            {userSites.length > 0 ? (
              userSites.map((site, index) => (
                <View
                  key={site.id}
                  style={[
                    styles.siteItem,
                    index < userSites.length - 1 && styles.siteItemBorder,
                  ]}
                >
                  <View style={styles.siteIconWrapper}>
                    <Ionicons name="location" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.siteInfo}>
                    <Text style={styles.siteName}>{site.name}</Text>
                    {site.address && (
                      <Text style={styles.siteAddress}>{site.address}</Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="alert-circle-outline" size={32} color={colors.textMuted} style={styles.emptyIcon} />
                <Text style={styles.noSites}>Aucun site assigné</Text>
                <Text style={styles.noSitesHint}>Contactez votre administrateur</Text>
              </View>
            )}
          </View>
        </View>

        {/* Contact Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="call" size={18} color={colors.success} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Contact</Text>
          </View>
          <View style={styles.card}>
            {profile?.phone ? (
              <View style={styles.contactRow}>
                <View style={styles.contactIconWrapper}>
                  <Ionicons name="phone-portrait" size={18} color={colors.success} />
                </View>
                <Text style={styles.contactText}>{profile.phone}</Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.noInfo}>Numéro non renseigné</Text>
              </View>
            )}
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="settings" size={18} color={colors.accent} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Paramètres</Text>
          </View>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleMenuPress}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconWrapper, { backgroundColor: `${colors.warning}15` }]}>
                <Ionicons name="notifications" size={18} color={colors.warning} />
              </View>
              <Text style={styles.menuItemText}>Notifications</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleMenuPress}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconWrapper, { backgroundColor: `${colors.info}15` }]}>
                <Ionicons name="help-circle" size={18} color={colors.info} />
              </View>
              <Text style={styles.menuItemText}>Aide</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemLast]}
              onPress={handleMenuPress}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconWrapper, { backgroundColor: `${colors.textSecondary}15` }]}>
                <Ionicons name="document-text" size={18} color={colors.textSecondary} />
              </View>
              <Text style={styles.menuItemText}>Conditions d'utilisation</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <View style={styles.signOutContent}>
            <Ionicons name="log-out-outline" size={22} color={colors.error} style={styles.signOutIcon} />
            <Text style={styles.signOutText}>Déconnexion</Text>
          </View>
        </TouchableOpacity>

        {/* Version */}
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
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatarGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 60,
    backgroundColor: colors.primaryGlow,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
      },
  avatarText: {
    fontSize: fontSize.xxl + 4,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  name: {
    fontSize: fontSize.xl + 2,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
    letterSpacing: -0.3,
  },
  email: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  roleIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  roleText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  section: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  sectionIcon: {
    marginRight: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  siteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  siteIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  siteItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  siteInfo: {
    flex: 1,
  },
  siteName: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '600',
  },
  siteAddress: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    marginBottom: spacing.xs,
  },
  noSites: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  noSitesHint: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  contactIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: `${colors.success}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  contactText: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '500',
  },
  noInfo: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  menuItemText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '500',
  },
  signOutButton: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    backgroundColor: `${colors.error}10`,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: `${colors.error}30`,
    overflow: 'hidden',
  },
  signOutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  signOutIcon: {
    marginRight: spacing.sm,
  },
  signOutText: {
    fontSize: fontSize.md,
    color: colors.error,
    fontWeight: '600',
  },
  version: {
    textAlign: 'center',
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
});
