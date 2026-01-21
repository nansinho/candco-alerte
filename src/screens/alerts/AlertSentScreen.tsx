import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius, alertTypeConfig } from '../../constants/theme';
import { AlertType } from '../../types/database';

export function AlertSentScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const alertType = route.params?.alertType as AlertType;
  const config = alertType ? alertTypeConfig[alertType] : null;

  const handleGoToAlerts = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs', params: { screen: 'Alerts' } }],
    });
  };

  const handleGoHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: config?.color || colors.primary }]}>
          <Ionicons name="checkmark" size={64} color={colors.surface} />
        </View>

        <Text style={styles.title}>Alerte envoyée</Text>
        <Text style={styles.subtitle}>
          Votre alerte {config?.label.toLowerCase() || ''} a été transmise à tous les responsables du site.
        </Text>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color={colors.info} />
          <Text style={styles.infoText}>
            Les secouristes (SST) et responsables de site ont été notifiés. Restez calme et suivez les consignes de sécurité.
          </Text>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleGoToAlerts}>
            <Text style={styles.primaryButtonText}>Voir l'alerte</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleGoHome}>
            <Text style={styles.secondaryButtonText}>Retour à l'accueil</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: `${colors.info}10`,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xxl,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
  buttons: {
    width: '100%',
    gap: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  secondaryButton: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: fontSize.md,
  },
});
