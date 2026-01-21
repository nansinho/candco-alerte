import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { AppNavigator, navigationRef } from './src/navigation/AppNavigator';
import { useAuthStore } from './src/store/authStore';
import { AlertType } from './src/types/database';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function AppContent() {
  const { initialize, updatePushToken, user } = useAuthStore();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (user) {
      registerForPushNotifications();
      setupNotificationListeners();
    }

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user]);

  const registerForPushNotifications = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return;
    }

    // Setup Android notification channels
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('alerts', {
        name: 'Alertes d\'urgence',
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    // Get project ID from expo config (works in production builds)
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;

    if (!projectId) {
      // Skip push token registration in Expo Go / development
      console.log('Push tokens: Skipping in development mode (no projectId)');
      return;
    }

    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      if (token.data) {
        updatePushToken(token.data);
      }
    } catch (error) {
      console.log('Error getting push token:', error);
    }
  };

  const setupNotificationListeners = () => {
    // Listen for notifications received while app is in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as {
        alertId?: string;
        alertType?: AlertType;
        siteName?: string;
        location?: string;
      };

      // If it's an alert notification and user is authenticated, navigate to active alert screen
      if (data?.alertId && data?.alertType && data?.siteName) {
        navigationRef.current?.navigate('ActiveAlert', {
          alertId: data.alertId,
          alertType: data.alertType,
          siteName: data.siteName,
          location: data.location,
        });
      }
    });

    // Listen for notification interactions (when user taps on notification)
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as {
        alertId?: string;
        alertType?: AlertType;
        siteName?: string;
        location?: string;
      };

      if (data?.alertId) {
        // Navigate to alert detail when user taps notification
        navigationRef.current?.navigate('AlertDetail', {
          alertId: data.alertId,
        });
      }
    });
  };

  return (
    <>
      <StatusBar style="light" />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}
