import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, fontSize, borderRadius, alertTypeConfig, shadows } from '../../constants/theme';
import { useAlertStore } from '../../store/alertStore';
import { useAuthStore } from '../../store/authStore';
import { AlertWithDetails } from '../../types/database';

export function AlertsListScreen() {
  const navigation = useNavigation<any>();
  const { userSites } = useAuthStore();
  const {
    activeAlerts,
    isLoading,
    fetchActiveAlerts,
    subscribeToAlerts,
    unsubscribeFromAlerts,
    setCurrentAlert,
  } = useAlertStore();

  const siteIds = userSites.map((site) => site.id);

  useEffect(() => {
    fetchActiveAlerts(siteIds);
    subscribeToAlerts(siteIds);

    return () => {
      unsubscribeFromAlerts();
    };
  }, [userSites]);

  const handleRefresh = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchActiveAlerts(siteIds);
  };

  const handleAlertPress = async (alert: AlertWithDetails) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentAlert(alert);
    navigation.navigate('AlertDetail', { alertId: alert.id });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Il y a ${diffHours}h`;

    return date.toLocaleDateString('fr-FR');
  };

  const renderAlert = ({ item, index }: { item: AlertWithDetails; index: number }) => {
    const config = alertTypeConfig[item.type];
    const isAcknowledged = item.status === 'acknowledged';

    return (
      <TouchableOpacity
        style={styles.alertCard}
        onPress={() => handleAlertPress(item)}
        activeOpacity={0.7}
      >
        {/* Glow effect */}
        <View style={[styles.alertGlow, { backgroundColor: config.colorGlow }]} />

        {/* Left accent bar */}
        <View style={[styles.accentBar, { backgroundColor: config.color }]} />

        <View style={styles.alertContent}>
          <View style={styles.alertHeader}>
            <View style={[styles.alertTypeIcon, { backgroundColor: `${config.color}20` }]}>
              <Ionicons name={config.icon as any} size={22} color={config.color} />
            </View>
            <View style={styles.alertInfo}>
              <Text style={[styles.alertType, { color: config.color }]}>{config.label}</Text>
              <Text style={styles.alertTime}>{formatTime(item.created_at)}</Text>
            </View>
            {isAcknowledged && (
              <View style={styles.acknowledgedBadge}>
                <View style={styles.acknowledgedDot} />
                <Text style={styles.acknowledgedText}>Pris en charge</Text>
              </View>
            )}
          </View>

          <Text style={styles.alertLocation}>
            {item.site?.name || 'Site inconnu'}
            {item.building && ` • ${item.building.name}`}
            {item.floor && ` • ${item.floor.name}`}
            {item.zone && ` • ${item.zone.name}`}
          </Text>

          {item.description && (
            <Text style={styles.alertDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          <View style={styles.alertFooter}>
            <View style={styles.creatorInfo}>
              <Ionicons name="person-circle" size={16} color={colors.textMuted} />
              <Text style={styles.alertCreator}>
                {item.created_by_profile?.first_name || 'Utilisateur'}{' '}
                {item.created_by_profile?.last_name || ''}
              </Text>
            </View>
            {item.photos && item.photos.length > 0 && (
              <View style={styles.photoBadge}>
                <Ionicons name="images" size={14} color={colors.textSecondary} />
                <Text style={styles.photoCount}>{item.photos.length}</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrapper}>
        <View style={styles.emptyIconGlow} />
        <View style={styles.emptyIcon}>
          <Ionicons name="shield-checkmark" size={48} color={colors.success} />
        </View>
      </View>
      <Text style={styles.emptyTitle}>Aucune alerte active</Text>
      <Text style={styles.emptySubtitle}>
        Tout va bien ! Aucune alerte en cours sur vos sites.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Alertes actives</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{activeAlerts.length}</Text>
        </View>
      </View>

      <FlatList
        data={activeAlerts}
        renderItem={renderAlert}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={renderEmptyState}
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
    backgroundColor: colors.primary,
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
    flexGrow: 1,
  },
  alertCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    
  },
  alertGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    opacity: 0.3,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: borderRadius.lg,
    borderBottomLeftRadius: borderRadius.lg,
  },
  alertContent: {
    padding: spacing.md,
    paddingLeft: spacing.lg,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  alertTypeIcon: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  alertInfo: {
    flex: 1,
  },
  alertType: {
    fontSize: fontSize.md,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  alertTime: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  acknowledgedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.success}15`,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  acknowledgedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  acknowledgedText: {
    color: colors.success,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  alertLocation: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  alertDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  alertFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  creatorInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  alertCreator: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  photoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginRight: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  photoCount: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
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
    backgroundColor: colors.successGlow,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.success}15`,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: `${colors.success}30`,
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
