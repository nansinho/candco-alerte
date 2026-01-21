import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { useCheckInStore } from '../../store/checkInStore';
import { Site, CheckIn } from '../../types/database';

export function CheckInScreen() {
  const { user, userSites } = useAuthStore();
  const {
    currentCheckIn,
    checkInHistory,
    isLoading,
    fetchCurrentCheckIn,
    fetchCheckInHistory,
    checkIn,
    checkOut,
  } = useCheckInStore();

  const checkInEnabledSites = userSites.filter((site) => site.check_in_enabled);

  useEffect(() => {
    if (user) {
      fetchCurrentCheckIn(user.id);
      fetchCheckInHistory(user.id);
    }
  }, [user]);

  const handleCheckIn = async (site: Site) => {
    if (!user) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Check-in',
      `Confirmer votre arrivée sur le site "${site.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            const { error } = await checkIn(user.id, site.id);
            if (error) {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Erreur', error.message);
            } else {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Succès', `Vous êtes maintenant enregistré sur ${site.name}`);
            }
          },
        },
      ]
    );
  };

  const handleCheckOut = async () => {
    if (!user || !currentCheckIn) return;

    const site = userSites.find((s) => s.id === currentCheckIn.site_id);

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Check-out',
      `Confirmer votre départ du site "${site?.name || 'inconnu'}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            const { error } = await checkOut(user.id);
            if (error) {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Erreur', error.message);
            } else {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Succès', 'Check-out effectué avec succès');
            }
          },
        },
      ]
    );
  };

  const handleRefresh = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (user) {
      fetchCurrentCheckIn(user.id);
      fetchCheckInHistory(user.id);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  const calculateDuration = (checkInAt: string, checkOutAt: string | null) => {
    const start = new Date(checkInAt);
    const end = checkOutAt ? new Date(checkOutAt) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffMins = Math.floor((diffMs % 3600000) / 60000);

    if (diffHours > 0) {
      return `${diffHours}h ${diffMins}min`;
    }
    return `${diffMins} min`;
  };

  const currentSite = currentCheckIn
    ? userSites.find((s) => s.id === currentCheckIn.site_id)
    : null;

  const renderHistoryItem = ({ item }: { item: CheckIn }) => {
    const site = userSites.find((s) => s.id === item.site_id);
    const isActive = !item.checked_out_at;

    return (
      <View style={[styles.historyItem, isActive && styles.historyItemActive]}>
        <View style={[styles.historyIcon, isActive && styles.historyIconActive]}>
          <Ionicons
            name={isActive ? 'location' : 'time-outline'}
            size={18}
            color={isActive ? colors.success : colors.textSecondary}
          />
        </View>
        <View style={styles.historyInfo}>
          <Text style={styles.historySite}>{site?.name || 'Site inconnu'}</Text>
          <Text style={styles.historyTime}>
            {formatDate(item.checked_in_at)} • {formatTime(item.checked_in_at)}
            {item.checked_out_at && ` - ${formatTime(item.checked_out_at)}`}
          </Text>
        </View>
        <View style={styles.historyDuration}>
          <Text style={[styles.durationText, isActive && styles.durationTextActive]}>
            {calculateDuration(item.checked_in_at, item.checked_out_at)}
          </Text>
          {isActive && (
            <View style={styles.activeBadge}>
              <View style={styles.activeDot} />
              <Text style={styles.activeLabel}>Actif</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderSiteItem = ({ item }: { item: Site }) => {
    const isCurrentSite = currentCheckIn?.site_id === item.id;

    return (
      <TouchableOpacity
        style={[styles.siteCard, isCurrentSite && styles.siteCardActive]}
        onPress={() => !isCurrentSite && handleCheckIn(item)}
        disabled={isCurrentSite}
        activeOpacity={0.7}
      >
        <View style={[styles.siteIcon, isCurrentSite && styles.siteIconActive]}>
          <Ionicons
            name={isCurrentSite ? 'checkmark-circle' : 'business'}
            size={22}
            color={isCurrentSite ? '#FFFFFF' : colors.textSecondary}
          />
        </View>
        <View style={styles.siteInfo}>
          <Text style={styles.siteName}>{item.name}</Text>
          {item.address && (
            <Text style={styles.siteAddress} numberOfLines={1}>
              {item.address}
            </Text>
          )}
        </View>
        {isCurrentSite ? (
          <View style={styles.currentBadge}>
            <Text style={styles.currentBadgeText}>Présent</Text>
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        )}
      </TouchableOpacity>
    );
  };

  if (checkInEnabledSites.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Check-in</Text>
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrapper}>
            <View style={styles.emptyIconGlow} />
            <View style={styles.emptyIcon}>
              <Ionicons name="location-outline" size={48} color={colors.textMuted} />
            </View>
          </View>
          <Text style={styles.emptyTitle}>Aucun site disponible</Text>
          <Text style={styles.emptySubtitle}>
            Le check-in n'est pas activé sur vos sites assignés.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Check-in</Text>
        <Text style={styles.subtitle}>Enregistrez votre présence sur site</Text>
      </View>

      <FlatList
        data={[{ type: 'content' }]}
        renderItem={() => (
          <>
            {/* Current status */}
            {currentCheckIn && currentSite && (
              <View style={styles.currentStatusWrapper}>
                <LinearGradient
                  colors={[colors.success, '#16A34A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.currentStatusCard}
                >
                  <View style={styles.statusHeader}>
                    <View style={styles.statusPulse}>
                      <View style={styles.statusDot} />
                    </View>
                    <Text style={styles.statusLabel}>Actuellement sur site</Text>
                  </View>
                  <Text style={styles.currentSiteName}>{currentSite.name}</Text>
                  <Text style={styles.checkInTime}>
                    Depuis {formatTime(currentCheckIn.checked_in_at)} •{' '}
                    {calculateDuration(currentCheckIn.checked_in_at, null)}
                  </Text>
                  <TouchableOpacity
                    style={styles.checkOutButton}
                    onPress={handleCheckOut}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="exit-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.checkOutButtonText}>Check-out</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            )}

            {/* Site selection */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="business" size={18} color={colors.primary} />
                <Text style={styles.sectionTitle}>
                  {currentCheckIn ? 'Changer de site' : 'Sélectionner un site'}
                </Text>
              </View>
              {checkInEnabledSites.map((site) => (
                <View key={site.id}>
                  {renderSiteItem({ item: site })}
                </View>
              ))}
            </View>

            {/* History */}
            {checkInHistory.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="time" size={18} color={colors.accent} />
                  <Text style={styles.sectionTitle}>Historique récent</Text>
                </View>
                <View style={styles.historyCard}>
                  {checkInHistory.slice(0, 10).map((item, index) => (
                    <View
                      key={item.id}
                      style={index < checkInHistory.slice(0, 10).length - 1 && styles.historyItemBorder}
                    >
                      {renderHistoryItem({ item })}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
        keyExtractor={() => 'content'}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  contentContainer: {
    padding: spacing.md,
  },
  currentStatusWrapper: {
    marginBottom: spacing.lg,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  currentStatusCard: {
    padding: spacing.lg,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statusPulse: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  statusLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  currentSiteName: {
    color: '#FFFFFF',
    fontSize: fontSize.xl + 2,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
    letterSpacing: -0.3,
  },
  checkInTime: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
  },
  checkOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  checkOutButtonText: {
    color: '#FFFFFF',
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  siteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  siteCardActive: {
    borderColor: colors.success,
    backgroundColor: `${colors.success}10`,
  },
  siteIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  siteIconActive: {
    backgroundColor: colors.success,
  },
  siteInfo: {
    flex: 1,
  },
  siteName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  siteAddress: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  currentBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  currentBadgeText: {
    color: '#FFFFFF',
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  historyCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  historyItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyItemActive: {
    backgroundColor: `${colors.success}08`,
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  historyIconActive: {
    backgroundColor: `${colors.success}15`,
  },
  historyInfo: {
    flex: 1,
  },
  historySite: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.text,
  },
  historyTime: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  historyDuration: {
    alignItems: 'flex-end',
  },
  durationText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  durationTextActive: {
    color: colors.success,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  activeLabel: {
    fontSize: fontSize.xs,
    color: colors.success,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIconWrapper: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  emptyIconGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 60,
    backgroundColor: `${colors.textMuted}15`,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
