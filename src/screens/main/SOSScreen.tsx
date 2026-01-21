import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

const { width } = Dimensions.get('window');
const BUTTON_SIZE = Math.min(width * 0.55, 220);
const HOLD_DURATION = 2500;

export function SOSScreen() {
  const navigation = useNavigation<any>();
  const { profile, userSites } = useAuthStore();
  const [isPressed, setIsPressed] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const ringAnim1 = useRef(new Animated.Value(0)).current;
  const ringAnim2 = useRef(new Animated.Value(0)).current;
  const ringAnim3 = useRef(new Animated.Value(0)).current;
  const holdTimer = useRef<NodeJS.Timeout | null>(null);
  const hapticInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    requestLocationPermission();
    startIdleAnimations();
    return () => stopIdleAnimations();
  }, []);

  // Track progress for visual feedback
  useEffect(() => {
    const listener = progressAnim.addListener(({ value }) => {
      setHoldProgress(Math.round(value * 100));
    });
    return () => progressAnim.removeListener(listener);
  }, []);

  const startIdleAnimations = () => {
    // Subtle pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.6,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Ring animations
    const startRingAnimation = (anim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startRingAnimation(ringAnim1, 0);
    startRingAnimation(ringAnim2, 700);
    startRingAnimation(ringAnim3, 1400);
  };

  const stopIdleAnimations = () => {
    pulseAnim.stopAnimation();
    glowAnim.stopAnimation();
    ringAnim1.stopAnimation();
    ringAnim2.stopAnimation();
    ringAnim3.stopAnimation();
  };

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

  const handlePressIn = async () => {
    setIsPressed(true);

    // Initial haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Scale down animation
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
      friction: 8,
    }).start();

    // Progress animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: HOLD_DURATION,
      useNativeDriver: false,
    }).start();

    // Haptic feedback during hold - increasing intensity
    let intensity = 0;
    hapticInterval.current = setInterval(async () => {
      intensity++;
      if (intensity <= 3) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else if (intensity <= 6) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
    }, 250);

    // Trigger alert timer
    holdTimer.current = setTimeout(() => {
      triggerAlert();
    }, HOLD_DURATION);
  };

  const handlePressOut = async () => {
    if (!isPressed) return;

    setIsPressed(false);

    // Light haptic on release
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Reset animations
    progressAnim.stopAnimation();
    progressAnim.setValue(0);

    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
    }).start();

    // Clear timers
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    if (hapticInterval.current) {
      clearInterval(hapticInterval.current);
      hapticInterval.current = null;
    }
  };

  const triggerAlert = async () => {
    // Success haptic pattern
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Clear intervals
    if (hapticInterval.current) {
      clearInterval(hapticInterval.current);
      hapticInterval.current = null;
    }

    setIsPressed(false);
    progressAnim.setValue(0);
    scaleAnim.setValue(1);

    navigation.navigate('CreateAlert', {
      location: currentLocation,
    });
  };

  const renderRing = (anim: Animated.Value, delay: number) => {
    const scale = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 2.5],
    });
    const opacity = anim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.4, 0.2, 0],
    });

    return (
      <Animated.View
        style={[
          styles.ring,
          {
            transform: [{ scale }],
            opacity,
          },
        ]}
      />
    );
  };

  const progressRotation = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Bonjour, {profile?.first_name || 'Utilisateur'}
            </Text>
            <Text style={styles.siteInfo}>
              {userSites.length > 0
                ? `${userSites.length} site${userSites.length > 1 ? 's' : ''} assigné${userSites.length > 1 ? 's' : ''}`
                : 'Aucun site assigné'}
            </Text>
          </View>
          {currentLocation && (
            <View style={styles.gpsBadge}>
              <Ionicons name="location" size={14} color={colors.success} style={styles.gpsIcon} />
              <Text style={styles.gpsText}>GPS</Text>
            </View>
          )}
        </View>

        {/* Main SOS Area */}
        <View style={styles.sosContainer}>
          <Text style={styles.instructions}>
            Maintenez le bouton pour déclencher une alerte
          </Text>

          {/* SOS Button with rings */}
          <View style={styles.buttonArea}>
            {/* Animated rings */}
            {!isPressed && (
              <>
                {renderRing(ringAnim1, 0)}
                {renderRing(ringAnim2, 700)}
                {renderRing(ringAnim3, 1400)}
              </>
            )}

            {/* Glow effect */}
            <Animated.View
              style={[
                styles.glowEffect,
                {
                  opacity: isPressed ? 0.8 : glowAnim,
                  transform: [{ scale: isPressed ? 1.3 : 1.1 }],
                },
              ]}
            />

            {/* Main button */}
            <Animated.View
              style={[
                styles.buttonWrapper,
                {
                  transform: [
                    { scale: Animated.multiply(scaleAnim, pulseAnim) },
                  ],
                },
              ]}
            >
              <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={styles.sosButton}
              >
                <LinearGradient
                  colors={isPressed ? ['#FF1A1A', '#CC0000'] : ['#FF3B30', '#E31E10']}
                  style={styles.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {/* Progress ring */}
                  {isPressed && (
                    <View style={styles.progressRingContainer}>
                      <Animated.View
                        style={[
                          styles.progressRing,
                          { transform: [{ rotate: progressRotation }] },
                        ]}
                      >
                        <View style={styles.progressArc} />
                      </Animated.View>
                    </View>
                  )}

                  <View style={styles.sosContent}>
                    <Text style={styles.sosText}>SOS</Text>
                    <Text style={styles.sosSubtext}>
                      {isPressed ? `${holdProgress}%` : 'Appuyez et maintenez'}
                    </Text>
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          </View>

          {/* Hold time indicator */}
          <View style={styles.holdTimeContainer}>
            <Ionicons name="time-outline" size={16} color={colors.textTertiary} style={styles.holdTimeIcon} />
            <Text style={styles.holdTimeText}>2.5 secondes</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.emergencyNumbers}>
            <Text style={styles.emergencyTitle}>Numéros d'urgence</Text>
            <View style={styles.numbersRow}>
              <View style={styles.numberBadge}>
                <Text style={styles.numberText}>15</Text>
                <Text style={styles.numberLabel}>SAMU</Text>
              </View>
              <View style={styles.numberBadge}>
                <Text style={styles.numberText}>18</Text>
                <Text style={styles.numberLabel}>Pompiers</Text>
              </View>
              <View style={styles.numberBadge}>
                <Text style={styles.numberText}>112</Text>
                <Text style={styles.numberLabel}>Urgences</Text>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  greeting: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  siteInfo: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  gpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gpsIcon: {
    marginRight: 4,
  },
  gpsText: {
    fontSize: fontSize.xs,
    color: colors.success,
    fontWeight: '600',
  },
  sosContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  instructions: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  buttonArea: {
    width: BUTTON_SIZE * 2.5,
    height: BUTTON_SIZE * 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  glowEffect: {
    position: 'absolute',
    width: BUTTON_SIZE * 1.5,
    height: BUTTON_SIZE * 1.5,
    borderRadius: BUTTON_SIZE * 0.75,
    backgroundColor: colors.primary,
    opacity: 0.3,
  },
  buttonWrapper: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 20,
  },
  sosButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRingContainer: {
    position: 'absolute',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRing: {
    width: BUTTON_SIZE - 10,
    height: BUTTON_SIZE - 10,
    borderRadius: (BUTTON_SIZE - 10) / 2,
    borderWidth: 4,
    borderColor: 'transparent',
    borderTopColor: 'rgba(255, 255, 255, 0.8)',
    borderRightColor: 'rgba(255, 255, 255, 0.4)',
  },
  progressArc: {},
  sosContent: {
    alignItems: 'center',
  },
  sosText: {
    fontSize: fontSize.hero,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  sosSubtext: {
    fontSize: fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: spacing.xs,
    fontWeight: '500',
  },
  holdTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    opacity: 0.6,
  },
  holdTimeIcon: {
    marginRight: spacing.xs,
  },
  holdTimeText: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  emergencyNumbers: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emergencyTitle: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  numbersRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  numberBadge: {
    alignItems: 'center',
  },
  numberText: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  numberLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
