import React from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useAuthStore } from '../store/authStore';
import { colors, shadows } from '../constants/theme';
import { AlertType } from '../types/database';

// Navigation ref for external navigation
export const navigationRef = React.createRef<NavigationContainerRef<RootStackParamList>>();

// Auth screens
import { LoginScreen } from '../screens/auth/LoginScreen';

// Main screens
import { SOSScreen } from '../screens/main/SOSScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { CheckInScreen } from '../screens/main/CheckInScreen';
import { AdminScreen } from '../screens/admin/AdminScreen';

// Alert screens
import { AlertsListScreen } from '../screens/alerts/AlertsListScreen';
import { CreateAlertScreen } from '../screens/alerts/CreateAlertScreen';
import { AlertSentScreen } from '../screens/alerts/AlertSentScreen';
import { AlertDetailScreen } from '../screens/alerts/AlertDetailScreen';
import { ActiveAlertScreen } from '../screens/alerts/ActiveAlertScreen';

export type RootStackParamList = {
  Auth: undefined;
  MainTabs: { screen?: string } | undefined;
  CreateAlert: { location?: { latitude: number; longitude: number } };
  AlertSent: { alertId?: string; alertType: string };
  AlertDetail: { alertId: string };
  ActiveAlert: {
    alertId: string;
    alertType: AlertType;
    siteName: string;
    location?: string;
  };
};

export type TabParamList = {
  SOS: undefined;
  Alerts: undefined;
  CheckIn: undefined;
  Admin: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'SOS':
              iconName = focused ? 'alert-circle' : 'alert-circle-outline';
              break;
            case 'Alerts':
              iconName = focused ? 'notifications' : 'notifications-outline';
              break;
            case 'CheckIn':
              iconName = focused ? 'location' : 'location-outline';
              break;
            case 'Admin':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return (
            <View style={focused ? styles.tabIconActive : undefined}>
              <Ionicons name={iconName} size={size} color={color} />
            </View>
          );
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          height: Platform.OS === 'ios' ? 88 : 64,
          ...shadows.sm,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        headerShown: false,
      })}
      screenListeners={{
        tabPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
      }}
    >
      <Tab.Screen
        name="SOS"
        component={SOSScreen}
        options={{ tabBarLabel: 'SOS' }}
      />
      <Tab.Screen
        name="Alerts"
        component={AlertsListScreen}
        options={{ tabBarLabel: 'Alertes' }}
      />
      <Tab.Screen
        name="CheckIn"
        component={CheckInScreen}
        options={{ tabBarLabel: 'Check-in' }}
      />
      <Tab.Screen
        name="Admin"
        component={AdminScreen}
        options={{ tabBarLabel: 'Admin' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profil' }}
      />
    </Tab.Navigator>
  );
}

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingGlow} />
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export function AppNavigator() {
  const { session, isLoading, isInitialized } = useAuthStore();

  if (!isInitialized || isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      >
        {session ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen
              name="CreateAlert"
              component={CreateAlertScreen}
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen
              name="AlertSent"
              component={AlertSentScreen}
              options={{
                presentation: 'modal',
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="AlertDetail"
              component={AlertDetailScreen}
              options={{
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="ActiveAlert"
              component={ActiveAlertScreen}
              options={{
                presentation: 'fullScreenModal',
                gestureEnabled: false,
                animation: 'fade',
              }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primaryGlow,
  },
  tabIconActive: {
    backgroundColor: `${colors.primary}15`,
    borderRadius: 12,
    padding: 4,
    marginBottom: -4,
  },
});
