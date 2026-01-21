import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  FlatList,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius, alertTypeConfig, roleLabels } from '../../constants/theme';
import { useAlertStore } from '../../store/alertStore';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { AlertMessage, Profile, AlertWithDetails } from '../../types/database';
import { RealtimeChannel } from '@supabase/supabase-js';

interface MessageWithProfile extends AlertMessage {
  profile?: Profile;
}

export function AlertDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { alertId } = route.params;

  const { user, profile } = useAuthStore();
  const { currentAlert, acknowledgeAlert, resolveAlert, setCurrentAlert } = useAlertStore();

  const [alert, setAlert] = useState<AlertWithDetails | null>(currentAlert);
  const [messages, setMessages] = useState<MessageWithProfile[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const scrollViewRef = useRef<FlatList>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Fetch alert details
  useEffect(() => {
    fetchAlertDetails();
    fetchMessages();
    subscribeToMessages();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [alertId]);

  // Pulse animation for active alert
  useEffect(() => {
    if (alert?.status === 'active') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [alert?.status]);

  const fetchAlertDetails = async () => {
    const { data, error } = await supabase
      .from('alerts')
      .select(`
        *,
        site:sites(*),
        building:buildings(*),
        floor:floors(*),
        zone:zones(*),
        created_by_profile:profiles!alerts_created_by_fkey(*),
        photos:alert_photos(*)
      `)
      .eq('id', alertId)
      .single();

    if (error) {
      console.error('Error fetching alert:', error);
      return;
    }

    setAlert(data as AlertWithDetails);
    setCurrentAlert(data as AlertWithDetails);
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('alert_messages')
      .select(`
        *,
        profile:profiles(*)
      `)
      .eq('alert_id', alertId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    setMessages(data as MessageWithProfile[]);
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`alert-messages-${alertId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alert_messages',
          filter: `alert_id=eq.${alertId}`,
        },
        async (payload) => {
          // Fetch the new message with profile
          const { data } = await supabase
            .from('alert_messages')
            .select('*, profile:profiles(*)')
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setMessages((prev) => [...prev, data as MessageWithProfile]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'alerts',
          filter: `id=eq.${alertId}`,
        },
        () => {
          fetchAlertDetails();
        }
      )
      .subscribe();

    channelRef.current = channel;
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    setIsSending(true);
    const { error } = await supabase.from('alert_messages').insert({
      alert_id: alertId,
      user_id: user.id,
      message: newMessage.trim(),
    });

    if (error) {
      Alert.alert('Erreur', 'Impossible d\'envoyer le message');
    } else {
      setNewMessage('');
    }
    setIsSending(false);
  };

  const handleAcknowledge = async () => {
    if (!user || !alert) return;

    Alert.alert(
      'Prendre en charge',
      'Voulez-vous prendre en charge cette alerte ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            await acknowledgeAlert(alert.id, user.id);
            fetchAlertDetails();
          },
        },
      ]
    );
  };

  const handleResolve = async () => {
    if (!user || !alert) return;

    Alert.alert(
      'Résoudre l\'alerte',
      'Êtes-vous sûr de vouloir marquer cette alerte comme résolue ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Résoudre',
          style: 'destructive',
          onPress: async () => {
            await resolveAlert(alert.id, user.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMessage = ({ item }: { item: MessageWithProfile }) => {
    const isOwnMessage = item.user_id === user?.id;

    return (
      <View
        style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        {!isOwnMessage && (
          <Text style={styles.messageSender}>
            {item.profile?.first_name || 'Utilisateur'} {item.profile?.last_name || ''}
          </Text>
        )}
        <Text style={[styles.messageText, isOwnMessage && styles.ownMessageText]}>
          {item.message}
        </Text>
        <Text style={[styles.messageTime, isOwnMessage && styles.ownMessageTime]}>
          {formatTime(item.created_at)}
        </Text>
      </View>
    );
  };

  if (!alert) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </SafeAreaView>
    );
  }

  const config = alertTypeConfig[alert.type];
  const canAcknowledge = alert.status === 'active' && profile?.role !== 'employee';
  const canResolve = alert.status === 'acknowledged' && profile?.role !== 'employee';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: config.color }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.surface} />
          </TouchableOpacity>

          <Animated.View style={[styles.headerContent, { transform: [{ scale: pulseAnim }] }]}>
            <Ionicons name={config.icon as any} size={32} color={colors.surface} />
            <Text style={styles.headerTitle}>{config.label}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {alert.status === 'active' ? 'ACTIVE' :
                 alert.status === 'acknowledged' ? 'Pris en charge' : 'Résolue'}
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Alert Info */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color={colors.textSecondary} />
              <Text style={styles.infoText}>
                {alert.site?.name || 'Site inconnu'}
                {alert.building && ` > ${alert.building.name}`}
                {alert.floor && ` > ${alert.floor.name}`}
                {alert.zone && ` > ${alert.zone.name}`}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="person" size={20} color={colors.textSecondary} />
              <Text style={styles.infoText}>
                {alert.created_by_profile?.first_name} {alert.created_by_profile?.last_name}
                {alert.created_by_profile?.role && ` (${roleLabels[alert.created_by_profile.role]})`}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="time" size={20} color={colors.textSecondary} />
              <Text style={styles.infoText}>{formatDate(alert.created_at)}</Text>
            </View>

            {alert.description && (
              <View style={styles.descriptionBox}>
                <Text style={styles.descriptionText}>{alert.description}</Text>
              </View>
            )}

            {/* Photos */}
            {alert.photos && alert.photos.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
                {alert.photos.map((photo) => (
                  <Image key={photo.id} source={{ uri: photo.photo_url }} style={styles.photo} />
                ))}
              </ScrollView>
            )}

            {/* Action buttons */}
            <View style={styles.actionButtons}>
              {canAcknowledge && (
                <TouchableOpacity style={styles.acknowledgeButton} onPress={handleAcknowledge}>
                  <Ionicons name="hand-left" size={20} color={colors.surface} />
                  <Text style={styles.actionButtonText}>Prendre en charge</Text>
                </TouchableOpacity>
              )}
              {canResolve && (
                <TouchableOpacity style={styles.resolveButton} onPress={handleResolve}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.surface} />
                  <Text style={styles.actionButtonText}>Résoudre</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Chat Section */}
          <View style={styles.chatSection}>
            <Text style={styles.chatTitle}>
              <Ionicons name="chatbubbles" size={18} color={colors.text} /> Communication
            </Text>

            <FlatList
              ref={scrollViewRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              style={styles.messagesList}
              contentContainerStyle={styles.messagesContent}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()}
              ListEmptyComponent={
                <Text style={styles.noMessages}>
                  Aucun message. Commencez à communiquer sur cette alerte.
                </Text>
              }
            />

            {/* Message input */}
            {alert.status !== 'resolved' && (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.messageInput}
                  value={newMessage}
                  onChangeText={setNewMessage}
                  placeholder="Envoyer un message..."
                  placeholderTextColor={colors.textLight}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  style={[styles.sendButton, (!newMessage.trim() || isSending) && styles.sendButtonDisabled]}
                  onPress={handleSendMessage}
                  disabled={!newMessage.trim() || isSending}
                >
                  <Ionicons name="send" size={20} color={colors.surface} />
                </TouchableOpacity>
              </View>
            )}
          </View>
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
  loadingText: {
    textAlign: 'center',
    marginTop: spacing.xxl,
    color: colors.textSecondary,
  },
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.surface,
    marginTop: spacing.sm,
  },
  statusBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },
  statusText: {
    color: colors.surface,
    fontWeight: '600',
    fontSize: fontSize.sm,
  },
  content: {
    flex: 1,
  },
  infoSection: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
  },
  descriptionBox: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  descriptionText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  photosScroll: {
    marginTop: spacing.md,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  acknowledgeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.warning,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  resolveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.success,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  actionButtonText: {
    color: colors.surface,
    fontWeight: '600',
    fontSize: fontSize.md,
  },
  chatSection: {
    flex: 1,
    padding: spacing.md,
  },
  chatTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingBottom: spacing.md,
  },
  noMessages: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: spacing.xl,
    fontStyle: 'italic',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageSender: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  messageText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  ownMessageText: {
    color: colors.surface,
  },
  messageTime: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'right',
  },
  ownMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    maxHeight: 100,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  sendButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
