import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius, alertTypeConfig } from '../../constants/theme';
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

  const handleRefresh = () => {
    fetchActiveAlerts(siteIds);
  };

  const handleAlertPress = (alert: AlertWithDetails) => {
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

  const renderAlert = ({ item }: { item: AlertWithDetails }) => {
    const config = alertTypeConfig[item.type];
    const isAcknowledged = item.status === 'acknowledged';

    return (
      <TouchableOpacity
        style={[styles.alertCard, { borderLeftColor: config.color }]}
        onPress={() => handleAlertPress(item)}
      >
        <View style={styles.alertHeader}>
          <View style={[styles.alertTypeIcon, { backgroundColor: config.color }]}>
            <Ionicons name={config.icon as any} size={20} color={colors.surface} />
          </View>
          <View style={styles.alertInfo}>
            <Text style={styles.alertType}>{config.label}</Text>
            <Text style={styles.alertTime}>{formatTime(item.created_at)}</Text>
          </View>
          {isAcknowledged && (
            <View style={styles.acknowledgedBadge}>
              <Text style={styles.acknowledgedText}>Pris en charge</Text>
            </View>
          )}
        </View>

        <Text style={styles.alertLocation}>
          {item.site?.name || 'Site inconnu'}
          {item.building && ` - ${item.building.name}`}
          {item.floor && ` - ${item.floor.name}`}
          {item.zone && ` - ${item.zone.name}`}
        </Text>

        {item.description && (
          <Text style={styles.alertDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.alertFooter}>
          <Text style={styles.alertCreator}>
            Par {item.created_by_profile?.first_name || 'Utilisateur'}{' '}
            {item.created_by_profile?.last_name || ''}
          </Text>
          {item.photos && item.photos.length > 0 && (
            <View style={styles.photoBadge}>
              <Ionicons name="image" size={14} color={colors.textSecondary} />
              <Text style={styles.photoCount}>{item.photos.length}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="shield-checkmark" size={64} color={colors.success} />
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
        <Text style={styles.subtitle}>
          {activeAlerts.length} alerte{activeAlerts.length !== 1 ? 's' : ''} en cours
        </Text>
      </View>

      <FlatList
        data={activeAlerts}
        renderItem={renderAlert}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
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
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
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
  listContent: {
    padding: spacing.md,
    flexGrow: 1,
  },
  alertCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  alertTypeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  alertInfo: {
    flex: 1,
  },
  alertType: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  alertTime: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  acknowledgedBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  acknowledgedText: {
    color: colors.surface,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  alertLocation: {
    fontSize: fontSize.sm,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  alertDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertCreator: {
    fontSize: fontSize.xs,
    color: colors.textLight,
  },
  photoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  photoCount: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
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
