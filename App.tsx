import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useAuthStore } from './src/store/authStore';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function AppContent() {
  const { initialize, updatePushToken, user } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (user) {
      registerForPushNotifications();
    }
  }, [user]);

  const registerForPushNotifications = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return;
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: 'candco-alerte', // Replace with your Expo project ID
    });

    if (token.data) {
      updatePushToken(token.data);
    }
  };

  return (
    <>
      <StatusBar style="dark" />
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
