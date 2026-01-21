import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, spacing, fontSize, borderRadius, shadows, roleLabels } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { Profile, Site, UserRole } from '../../types/database';

interface UserWithSites extends Profile {
  sites: Site[];
}

const ROLES: { value: UserRole; label: string; color: string }[] = [
  { value: 'super_admin', label: 'Super Admin', color: '#FF3B30' },
  { value: 'admin', label: 'Administrateur', color: '#8B5CF6' },
  { value: 'site_manager', label: 'Responsable Site', color: '#3B82F6' },
  { value: 'sst', label: 'SST', color: '#22C55E' },
  { value: 'employee', label: 'Employé', color: '#71717A' },
];

export function AdminScreen() {
  const { profile } = useAuthStore();
  const [users, setUsers] = useState<UserWithSites[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithSites | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showSiteModal, setShowSiteModal] = useState(false);

  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    await Promise.all([fetchUsers(), fetchSites()]);
    setIsLoading(false);
  };

  const fetchUsers = async () => {
    const { data: usersData, error: usersError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }

    // Fetch user sites for each user
    const usersWithSites = await Promise.all(
      (usersData || []).map(async (user) => {
        const { data: sitesData } = await supabase
          .from('user_sites')
          .select('site:sites(*)')
          .eq('user_id', user.id);

        const userSites = sitesData
          ?.map((item: any) => item.site)
          .filter((site: Site | null): site is Site => site !== null) || [];

        return { ...user, sites: userSites };
      })
    );

    setUsers(usersWithSites);
  };

  const fetchSites = async () => {
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching sites:', error);
      return;
    }

    setSites(data || []);
  };

  const handleChangeRole = async (newRole: UserRole) => {
    if (!selectedUser) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', selectedUser.id);

    if (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', 'Impossible de modifier le rôle');
      return;
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowRoleModal(false);
    fetchUsers();
  };

  const handleToggleSite = async (site: Site) => {
    if (!selectedUser) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const isAssigned = selectedUser.sites.some((s) => s.id === site.id);

    if (isAssigned) {
      // Remove site
      const { error } = await supabase
        .from('user_sites')
        .delete()
        .eq('user_id', selectedUser.id)
        .eq('site_id', site.id);

      if (error) {
        Alert.alert('Erreur', 'Impossible de retirer le site');
        return;
      }
    } else {
      // Add site
      const { error } = await supabase
        .from('user_sites')
        .insert({ user_id: selectedUser.id, site_id: site.id });

      if (error) {
        Alert.alert('Erreur', 'Impossible d\'ajouter le site');
        return;
      }
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    fetchUsers();

    // Update selected user's sites locally
    setSelectedUser((prev) => {
      if (!prev) return null;
      if (isAssigned) {
        return { ...prev, sites: prev.sites.filter((s) => s.id !== site.id) };
      } else {
        return { ...prev, sites: [...prev.sites, site] };
      }
    });
  };

  const getRoleConfig = (role: UserRole) => {
    return ROLES.find((r) => r.value === role) || ROLES[4];
  };

  const renderUser = ({ item }: { item: UserWithSites }) => {
    const roleConfig = getRoleConfig(item.role);
    const isCurrentUser = item.id === profile?.id;

    return (
      <TouchableOpacity
        style={styles.userCard}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setSelectedUser(item);
        }}
        activeOpacity={0.7}
        disabled={!isAdmin}
      >
        <View style={styles.userHeader}>
          <LinearGradient
            colors={[roleConfig.color, `${roleConfig.color}CC`]}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>
              {(item.first_name?.[0] || item.email?.[0] || '?').toUpperCase()}
            </Text>
          </LinearGradient>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {item.first_name || item.last_name
                ? `${item.first_name || ''} ${item.last_name || ''}`
                : 'Utilisateur'}
              {isCurrentUser && <Text style={styles.youBadge}> (vous)</Text>}
            </Text>
            <Text style={styles.userEmail}>{item.email}</Text>
          </View>
          <View style={[styles.roleBadge, { backgroundColor: `${roleConfig.color}20` }]}>
            <View style={[styles.roleIndicator, { backgroundColor: roleConfig.color }]} />
            <Text style={[styles.roleText, { color: roleConfig.color }]}>
              {roleConfig.label}
            </Text>
          </View>
        </View>

        <View style={styles.userSites}>
          <Ionicons name="business-outline" size={14} color={colors.textMuted} />
          <Text style={styles.sitesText}>
            {item.sites.length > 0
              ? item.sites.map((s) => s.name).join(', ')
              : 'Aucun site assigné'}
          </Text>
        </View>

        {isAdmin && (
          <View style={styles.userActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedUser(item);
                setShowRoleModal(true);
              }}
            >
              <Ionicons name="shield-outline" size={16} color={colors.accent} />
              <Text style={styles.actionText}>Rôle</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedUser(item);
                setShowSiteModal(true);
              }}
            >
              <Ionicons name="location-outline" size={16} color={colors.info} />
              <Text style={styles.actionText}>Sites</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Administration</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="lock-closed" size={64} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Accès restreint</Text>
          <Text style={styles.emptySubtitle}>
            Seuls les administrateurs peuvent accéder à cette section.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Administration</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{users.length}</Text>
        </View>
      </View>

      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchData}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Aucun utilisateur</Text>
          </View>
        }
      />

      {/* Role Modal */}
      <Modal
        visible={showRoleModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRoleModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRoleModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Changer le rôle</Text>
            <Text style={styles.modalSubtitle}>
              {selectedUser?.first_name || selectedUser?.email}
            </Text>

            {ROLES.map((role) => (
              <TouchableOpacity
                key={role.value}
                style={[
                  styles.roleOption,
                  selectedUser?.role === role.value && styles.roleOptionSelected,
                ]}
                onPress={() => handleChangeRole(role.value)}
              >
                <View style={[styles.roleOptionIndicator, { backgroundColor: role.color }]} />
                <Text style={styles.roleOptionText}>{role.label}</Text>
                {selectedUser?.role === role.value && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowRoleModal(false)}
            >
              <Text style={styles.modalCloseText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Site Assignment Modal */}
      <Modal
        visible={showSiteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSiteModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSiteModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assigner aux sites</Text>
            <Text style={styles.modalSubtitle}>
              {selectedUser?.first_name || selectedUser?.email}
            </Text>

            {sites.map((site) => {
              const isAssigned = selectedUser?.sites.some((s) => s.id === site.id);
              return (
                <TouchableOpacity
                  key={site.id}
                  style={[styles.siteOption, isAssigned && styles.siteOptionSelected]}
                  onPress={() => handleToggleSite(site)}
                >
                  <Ionicons
                    name={isAssigned ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={isAssigned ? colors.success : colors.textMuted}
                  />
                  <View style={styles.siteOptionInfo}>
                    <Text style={styles.siteOptionName}>{site.name}</Text>
                    {site.address && (
                      <Text style={styles.siteOptionAddress}>{site.address}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}

            {sites.length === 0 && (
              <Text style={styles.noSitesText}>Aucun site disponible</Text>
            )}

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowSiteModal(false)}
            >
              <Text style={styles.modalCloseText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
    letterSpacing: -0.5,
  },
  countBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    minWidth: 32,
    alignItems: 'center',
  },
  countText: {
    color: '#FFFFFF',
    fontSize: fontSize.sm,
    fontWeight: 'bold',
  },
  listContent: {
    padding: spacing.md,
  },
  userCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: fontSize.lg,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  youBadge: {
    color: colors.textMuted,
    fontWeight: '400',
  },
  userEmail: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  roleIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
  roleText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  userSites: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sitesIcon: {
    marginRight: spacing.xs,
  },
  sitesText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  userActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
  },
  actionButtonLast: {
    marginRight: 0,
  },
  actionIcon: {
    marginRight: spacing.xs,
  },
  actionText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surfaceElevated,
  },
  roleOptionSelected: {
    backgroundColor: `${colors.primary}15`,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  roleOptionIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  roleOptionText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '500',
  },
  siteOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surfaceElevated,
  },
  siteOptionSelected: {
    backgroundColor: `${colors.success}15`,
  },
  siteCheckbox: {
    marginRight: spacing.sm,
  },
  siteOptionInfo: {
    flex: 1,
  },
  siteOptionName: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '500',
  },
  siteOptionAddress: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  noSitesText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
    padding: spacing.lg,
  },
  modalCloseButton: {
    alignItems: 'center',
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  modalCloseText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});
