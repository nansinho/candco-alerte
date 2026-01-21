import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../constants/theme';

const { width } = Dimensions.get('window');

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<'email' | 'password' | null>(null);
  const { signIn, isLoading } = useAuthStore();

  // Animations
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoGlow = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(30)).current;
  const ring1Scale = useRef(new Animated.Value(0.8)).current;
  const ring1Opacity = useRef(new Animated.Value(0)).current;
  const ring2Scale = useRef(new Animated.Value(0.8)).current;
  const ring2Opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo entrance animation
    Animated.sequence([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(formTranslateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Pulsing glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoGlow, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(logoGlow, {
          toValue: 0.3,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Ring animations
    const animateRing = (scale: Animated.Value, opacity: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(scale, {
              toValue: 1.5,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(opacity, {
                toValue: 0.3,
                duration: 500,
                useNativeDriver: true,
              }),
              Animated.timing(opacity, {
                toValue: 0,
                duration: 1500,
                useNativeDriver: true,
              }),
            ]),
          ]),
          Animated.parallel([
            Animated.timing(scale, {
              toValue: 0.8,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    };

    animateRing(ring1Scale, ring1Opacity, 0);
    animateRing(ring2Scale, ring2Opacity, 1000);
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { error } = await signIn(email.trim(), password);

    if (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur de connexion', error.message);
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleInputFocus = async (input: 'email' | 'password') => {
    setFocusedInput(input);
    await Haptics.selectionAsync();
  };

  const togglePasswordVisibility = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowPassword(!showPassword);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Animated Logo Section */}
          <View style={styles.header}>
            <View style={styles.logoWrapper}>
              {/* Animated rings */}
              <Animated.View
                style={[
                  styles.ring,
                  {
                    transform: [{ scale: ring1Scale }],
                    opacity: ring1Opacity,
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.ring,
                  styles.ring2,
                  {
                    transform: [{ scale: ring2Scale }],
                    opacity: ring2Opacity,
                  },
                ]}
              />

              {/* Glow effect */}
              <Animated.View
                style={[
                  styles.logoGlow,
                  {
                    opacity: logoGlow,
                  },
                ]}
              />

              {/* Logo */}
              <Animated.View
                style={[
                  styles.logoContainer,
                  {
                    transform: [{ scale: logoScale }],
                  },
                ]}
              >
                <LinearGradient
                  colors={['#FF3B30', '#FF6B6B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.logoGradient}
                >
                  <Ionicons name="warning" size={48} color="#FFFFFF" />
                </LinearGradient>
              </Animated.View>
            </View>

            <Text style={styles.title}>CandCO Alerte</Text>
            <Text style={styles.subtitle}>Système d'alertes d'urgence</Text>
          </View>

          {/* Form Section */}
          <Animated.View
            style={[
              styles.form,
              {
                opacity: formOpacity,
                transform: [{ translateY: formTranslateY }],
              },
            ]}
          >
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focusedInput === 'email' && styles.inputWrapperFocused,
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={focusedInput === 'email' ? colors.primary : colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="votre@email.com"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => handleInputFocus('email')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mot de passe</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focusedInput === 'password' && styles.inputWrapperFocused,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={focusedInput === 'password' ? colors.primary : colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                  onFocus={() => handleInputFocus('password')}
                  onBlur={() => setFocusedInput(null)}
                />
                <TouchableOpacity
                  onPress={togglePasswordVisibility}
                  style={styles.passwordToggle}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleLogin}
              disabled={isLoading}
              style={styles.buttonContainer}
            >
              <LinearGradient
                colors={isLoading ? ['#666', '#444'] : ['#FF3B30', '#FF6B6B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.button, isLoading && styles.buttonDisabled]}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Se connecter</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Footer */}
          <Animated.Text
            style={[
              styles.footer,
              {
                opacity: formOpacity,
              },
            ]}
          >
            Contactez votre administrateur pour créer un compte
          </Animated.Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoWrapper: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  ring: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  ring2: {
    width: 130,
    height: 130,
    borderRadius: 65,
  },
  logoGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primaryGlow,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
      },
  logoGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  form: {
    gap: spacing.lg,
  },
  inputContainer: {
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 56,
  },
  inputWrapperFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceElevated,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    paddingVertical: spacing.md,
  },
  passwordToggle: {
    padding: spacing.sm,
  },
  buttonContainer: {
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
      },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md + 2,
    gap: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: fontSize.lg,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footer: {
    textAlign: 'center',
    color: colors.textTertiary,
    fontSize: fontSize.sm,
    marginTop: spacing.xxl,
  },
});
