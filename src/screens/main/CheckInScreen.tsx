import React, { useEffect, useState } from 'react';
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
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';
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

  const [selectedSite, setSelectedSite] = useState<Site | null>(null);

  // Filter sites with check-in enabled
  const checkInEnabledSites = userSites.filter((site) => site.check_in_enabled);

  useEffect(() => {
    if (user) {
      fetchCurrentCheckIn(user.id);
      fetchCheckInHistory(user.id);
    }
  }, [user]);

  const handleCheckIn = async (site: Site) => {
    if (!user) return;

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
              Alert.alert('Erreur', error.message);
            } else {
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
              Alert.alert('Erreur', error.message);
            } else {
              Alert.alert('Succès', 'Check-out effectué avec succès');
            }
          },
        },
      ]
    );
  };

  const handleRefresh = () => {
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
        <View style={styles.historyIcon}>
          <Ionicons
            name={isActive ? 'location' : 'time-outline'}
            size={20}
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
          {isActive && <Text style={styles.activeLabel}>Actif</Text>}
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
      >
        <View style={[styles.siteIcon, isCurrentSite && styles.siteIconActive]}>
          <Ionicons
            name={isCurrentSite ? 'checkmark-circle' : 'business'}
            size={24}
            color={isCurrentSite ? colors.surface : colors.textSecondary}
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
          <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
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
          <Ionicons name="location-outline" size={64} color={colors.textLight} />
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
              <View style={styles.currentStatusCard}>
                <View style={styles.statusHeader}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusLabel}>Actuellement sur site</Text>
                </View>
                <Text style={styles.currentSiteName}>{currentSite.name}</Text>
                <Text style={styles.checkInTime}>
                  Depuis {formatTime(currentCheckIn.checked_in_at)} •{' '}
                  {calculateDuration(currentCheckIn.checked_in_at, null)}
                </Text>
                <TouchableOpacity style={styles.checkOutButton} onPress={handleCheckOut}>
                  <Ionicons name="exit-outline" size={20} color={colors.surface} />
                  <Text style={styles.checkOutButtonText}>Check-out</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Site selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {currentCheckIn ? 'Changer de site' : 'Sélectionner un site'}
              </Text>
              {checkInEnabledSites.map((site) => (
                <View key={site.id}>
                  {renderSiteItem({ item: site })}
                </View>
              ))}
            </View>

            {/* History */}
            {checkInHistory.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Historique récent</Text>
                {checkInHistory.slice(0, 10).map((item) => (
                  <View key={item.id}>
                    {renderHistoryItem({ item })}
                  </View>
                ))}
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
          />
        }
        contentContainerStyle={styles.contentContainer}
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
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  contentContainer: {
    padding: spacing.md,
  },
  currentStatusCard: {
    backgroundColor: colors.success,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
  },
  statusLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: fontSize.sm,
  },
  currentSiteName: {
    color: colors.surface,
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
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
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  checkOutButtonText: {
    color: colors.surface,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  siteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
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
    borderRadius: 22,
    backgroundColor: colors.background,
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
    marginTop: spacing.xs,
  },
  currentBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  currentBadgeText: {
    color: colors.surface,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  historyItemActive: {
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
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
    marginTop: spacing.xs,
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
  activeLabel: {
    fontSize: fontSize.xs,
    color: colors.success,
    marginTop: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
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
  },
});
