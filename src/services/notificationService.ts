import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { AlertType } from '../types/database';
import { alertTypeConfig } from '../constants/theme';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface AlertNotificationData {
  alertId: string;
  alertType: AlertType;
  siteName: string;
  location?: string;
}

// Request notification permissions
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Notification permissions not granted');
    return false;
  }

  // Configure Android channel for alerts
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('alerts', {
      name: 'Alertes d\'urgence',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 200, 500],
      lightColor: '#FF0000',
      sound: 'alert_fire.wav',
      enableVibrate: true,
      enableLights: true,
    });

    // Create channels for each alert type
    await Notifications.setNotificationChannelAsync('alert-fire', {
      name: 'Alertes Incendie',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 200, 500, 200, 500],
      lightColor: '#EF4444',
      sound: 'alert_fire.wav',
    });

    await Notifications.setNotificationChannelAsync('alert-accident', {
      name: 'Alertes Accident',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 200, 500],
      lightColor: '#F59E0B',
      sound: 'alert_accident.wav',
    });

    await Notifications.setNotificationChannelAsync('alert-medical', {
      name: 'Alertes Médicales',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 200, 500],
      lightColor: '#3B82F6',
      sound: 'alert_medical.wav',
    });

    await Notifications.setNotificationChannelAsync('alert-other', {
      name: 'Autres Alertes',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 500, 200, 500],
      lightColor: '#6B7280',
      sound: 'alert_other.wav',
    });
  }

  return true;
}

// Get Expo push token
export async function getExpoPushToken(): Promise<string | null> {
  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId: 'candco-alerte', // Replace with your Expo project ID
    });
    return token;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

// Schedule local alert notification
export async function scheduleAlertNotification(data: AlertNotificationData): Promise<void> {
  const config = alertTypeConfig[data.alertType];

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `🚨 ALERTE ${config.label.toUpperCase()}`,
      body: `${data.siteName}${data.location ? ` - ${data.location}` : ''}`,
      data: {
        alertId: data.alertId,
        alertType: data.alertType,
        siteName: data.siteName,
        location: data.location,
      } as Record<string, unknown>,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
      ...(Platform.OS === 'android' && {
        channelId: `alert-${data.alertType}`,
      }),
    },
    trigger: null, // Immediate
  });
}

// Cancel all notifications for an alert
export async function cancelAlertNotifications(alertId: string): Promise<void> {
  const notifications = await Notifications.getAllScheduledNotificationsAsync();

  for (const notification of notifications) {
    const data = notification.content.data as Record<string, unknown> | undefined;
    if (data?.alertId === alertId) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
}

// Setup notification response listener
export function setupNotificationResponseListener(
  callback: (alertId: string, alertType: AlertType) => void
): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as Record<string, unknown> | undefined;
    if (data?.alertId && data?.alertType) {
      callback(data.alertId as string, data.alertType as AlertType);
    }
  });

  return () => subscription.remove();
}

// Setup notification received listener (when app is in foreground)
export function setupNotificationReceivedListener(
  callback: (data: AlertNotificationData) => void
): () => void {
  const subscription = Notifications.addNotificationReceivedListener((notification) => {
    const data = notification.request.content.data as Record<string, unknown> | undefined;
    if (data?.alertId) {
      callback({
        alertId: data.alertId as string,
        alertType: data.alertType as AlertType,
        siteName: data.siteName as string,
        location: data.location as string | undefined,
      });
    }
  });

  return () => subscription.remove();
}
