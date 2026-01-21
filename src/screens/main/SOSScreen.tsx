import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Vibration,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

const HOLD_DURATION = 2500; // 2.5 seconds to trigger

export function SOSScreen() {
  const navigation = useNavigation<any>();
  const { profile, userSites } = useAuthStore();
  const [isPressed, setIsPressed] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const holdTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    }
  };

  const handlePressIn = () => {
    setIsPressed(true);
    Vibration.vibrate(50);

    // Start progress animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: HOLD_DURATION,
      useNativeDriver: false,
    }).start();

    // Start scale animation
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();

    // Set timer to trigger alert
    holdTimer.current = setTimeout(() => {
      triggerAlert();
    }, HOLD_DURATION);
  };

  const handlePressOut = () => {
    setIsPressed(false);

    // Cancel animations
    progressAnim.stopAnimation();
    progressAnim.setValue(0);

    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();

    // Cancel timer
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  const triggerAlert = () => {
    Vibration.vibrate([0, 100, 50, 100, 50, 100]);
    setIsPressed(false);
    progressAnim.setValue(0);
    scaleAnim.setValue(1);

    // Navigate to alert type selection
    navigation.navigate('CreateAlert', {
      location: currentLocation,
    });
  };

  const progressInterpolate = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Bonjour, {profile?.first_name || 'Utilisateur'}
        </Text>
        <Text style={styles.siteInfo}>
          {userSites.length > 0
            ? `${userSites.length} site${userSites.length > 1 ? 's' : ''} assigné${userSites.length > 1 ? 's' : ''}`
            : 'Aucun site assigné'}
        </Text>
      </View>

      <View style={styles.sosContainer}>
        <Text style={styles.instructions}>
          Maintenez le bouton pendant 2.5 secondes pour déclencher une alerte
        </Text>

        <Animated.View style={[styles.buttonWrapper, { transform: [{ scale: scaleAnim }] }]}>
          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={styles.sosButton}
          >
            <Animated.View
              style={[
                styles.progressOverlay,
                {
                  width: progressInterpolate,
                },
              ]}
            />
            <View style={styles.sosButtonContent}>
              <Text style={styles.sosText}>SOS</Text>
              <Text style={styles.sosSubtext}>
                {isPressed ? 'Maintenez...' : 'Appuyez et maintenez'}
              </Text>
            </View>
          </Pressable>
        </Animated.View>

        {currentLocation && (
          <View style={styles.locationBadge}>
            <Text style={styles.locationText}>GPS actif</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          En cas d'urgence réelle, appelez également le 15 (SAMU), 18 (Pompiers) ou 112
        </Text>
      </View>
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
  },
  greeting: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
  },
  siteInfo: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  sosContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  instructions: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  buttonWrapper: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  sosButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  progressOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.primaryDark,
  },
  sosButtonContent: {
    alignItems: 'center',
  },
  sosText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.surface,
  },
  sosSubtext: {
    fontSize: fontSize.sm,
    color: colors.surface,
    opacity: 0.9,
    marginTop: spacing.xs,
  },
  locationBadge: {
    marginTop: spacing.xl,
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  locationText: {
    color: colors.surface,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  footer: {
    padding: spacing.lg,
  },
  footerText: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    textAlign: 'center',
  },
});
