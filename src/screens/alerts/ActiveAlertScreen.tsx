import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { colors, spacing, fontSize, borderRadius, alertTypeConfig } from '../../constants/theme';
import { AlertType } from '../../types/database';

export function ActiveAlertScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { alertId, alertType, siteName, location } = route.params as {
    alertId: string;
    alertType: AlertType;
    siteName: string;
    location?: string;
  };

  const pulseAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const config = alertTypeConfig[alertType];

  useEffect(() => {
    // Start animations
    startAnimations();

    // Start vibration pattern
    const vibrationPattern = [0, 500, 200, 500, 200, 500];
    Vibration.vibrate(vibrationPattern);
    const vibrationInterval = setInterval(() => {
      Vibration.vibrate(vibrationPattern);
    }, 3000);

    // Play alert notification
    playAlertNotification();

    return () => {
      clearInterval(vibrationInterval);
      Vibration.cancel();
    };
  }, []);

  const startAnimations = () => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Scale pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Background opacity animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.8,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const playAlertNotification = async () => {
    // Use system notification with sound
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🚨 ALERTE ${config.label.toUpperCase()}`,
        body: `${siteName}${location ? ` - ${location}` : ''}`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: null,
    });
  };

  const handleViewDetails = () => {
    Vibration.cancel();
    navigation.replace('AlertDetail', { alertId });
  };

  const handleDismiss = () => {
    Vibration.cancel();
    navigation.goBack();
  };

  return (
    <Animated.View style={[styles.container, { backgroundColor: config.color, opacity: opacityAnim }]}>
      <SafeAreaView style={styles.safeArea}>
        {/* Dismiss button */}
        <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
          <Ionicons name="close" size={32} color={colors.surface} />
        </TouchableOpacity>

        {/* Alert content */}
        <View style={styles.content}>
          {/* Animated icon */}
          <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.iconCircle}>
              <Ionicons name={config.icon as any} size={80} color={config.color} />
            </View>
          </Animated.View>

          {/* Alert type */}
          <Text style={styles.alertType}>
            ALERTE {config.label.toUpperCase()}
          </Text>

          {/* Location info */}
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={24} color={colors.surface} />
            <Text style={styles.siteName}>{siteName}</Text>
          </View>

          {location && (
            <Text style={styles.locationDetails}>{location}</Text>
          )}

          {/* Pulsing indicator */}
          <View style={styles.pulseContainer}>
            <Animated.View
              style={[
                styles.pulseOuter,
                {
                  opacity: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0],
                  }),
                  transform: [
                    {
                      scale: pulseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 2],
                      }),
                    },
                  ],
                },
              ]}
            />
            <View style={styles.pulseInner}>
              <Text style={styles.pulseText}>ACTIVE</Text>
            </View>
          </View>
        </View>

        {/* View details button */}
        <TouchableOpacity style={styles.viewButton} onPress={handleViewDetails}>
          <Text style={styles.viewButtonText}>Voir les détails</Text>
          <Ionicons name="arrow-forward" size={24} color={config.color} />
        </TouchableOpacity>

        {/* Emergency reminder */}
        <Text style={styles.emergencyReminder}>
          En cas d'urgence réelle, appelez le 15 (SAMU), 18 (Pompiers) ou 112
        </Text>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    padding: spacing.lg,
  },
  dismissButton: {
    alignSelf: 'flex-end',
    padding: spacing.sm,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  alertType: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.surface,
    textAlign: 'center',
    marginBottom: spacing.lg,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  siteName: {
    fontSize: fontSize.xxl,
    fontWeight: '600',
    color: colors.surface,
  },
  locationDetails: {
    fontSize: fontSize.lg,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: spacing.xl,
  },
  pulseContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  pulseOuter: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  pulseInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseText: {
    fontSize: fontSize.xs,
    fontWeight: 'bold',
    color: colors.primary,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  viewButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.primary,
  },
  emergencyReminder: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.8)',
    fontSize: fontSize.sm,
  },
});
