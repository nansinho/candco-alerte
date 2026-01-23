import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import { useAuthStore } from '../store/authStore';
import { colors } from '../constants/theme';

// Auth screens
import { LoginScreen } from '../screens/auth/LoginScreen';

// Main screens
import { SOSScreen } from '../screens/main/SOSScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';

// Alert screens
import { AlertsListScreen } from '../screens/alerts/AlertsListScreen';
import { CreateAlertScreen } from '../screens/alerts/CreateAlertScreen';
import { AlertSentScreen } from '../screens/alerts/AlertSentScreen';

export type RootStackParamList = {
  Auth: undefined;
  MainTabs: { screen?: string } | undefined;
  CreateAlert: { location?: { latitude: number; longitude: number } };
  AlertSent: { alertId?: string; alertType: string };
  AlertDetail: { alertId: string };
};

export type TabParamList = {
  SOS: undefined;
  Alerts: undefined;
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
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
        },
        headerShown: false,
      })}
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
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
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
});
