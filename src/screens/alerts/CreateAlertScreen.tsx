import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius, alertTypeConfig } from '../../constants/theme';
import { AlertType } from '../../types/database';
import { useAlertStore } from '../../store/alertStore';
import { useAuthStore } from '../../store/authStore';

const alertTypes: AlertType[] = ['fire', 'accident', 'medical', 'other'];

export function CreateAlertScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const location = route.params?.location;

  const { userSites } = useAuthStore();
  const {
    createAlert,
    isCreatingAlert,
    selectedSite,
    selectedBuilding,
    selectedFloor,
    selectedZone,
    availableBuildings,
    availableFloors,
    availableZones,
    setSelectedSite,
    setSelectedBuilding,
    setSelectedFloor,
    setSelectedZone,
    resetLocationSelection,
  } = useAlertStore();

  const [selectedType, setSelectedType] = useState<AlertType | null>(null);
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [step, setStep] = useState<'type' | 'location' | 'details'>('type');

  const handleSelectType = (type: AlertType) => {
    setSelectedType(type);
    setStep('location');
  };

  const handleSelectSite = (site: typeof userSites[0]) => {
    setSelectedSite(site);
  };

  const handleContinueToDetails = () => {
    if (!selectedSite) {
      Alert.alert('Erreur', 'Veuillez sélectionner un site');
      return;
    }
    setStep('details');
  };

  const handleAddPhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotos([...photos, result.assets[0].uri]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedType) {
      Alert.alert('Erreur', 'Veuillez sélectionner un type d\'alerte');
      return;
    }

    const { data, error } = await createAlert({
      type: selectedType,
      description: description.trim() || undefined,
      latitude: location?.latitude,
      longitude: location?.longitude,
      siteId: selectedSite?.id,
      buildingId: selectedBuilding?.id,
      floorId: selectedFloor?.id,
      zoneId: selectedZone?.id,
      photos,
    });

    if (error) {
      Alert.alert('Erreur', 'Impossible de créer l\'alerte: ' + error.message);
      return;
    }

    resetLocationSelection();
    navigation.navigate('AlertSent', { alertId: data?.id, alertType: selectedType });
  };

  const handleCancel = () => {
    resetLocationSelection();
    navigation.goBack();
  };

  const renderTypeSelection = () => (
    <View style={styles.content}>
      <Text style={styles.title}>Type d'urgence</Text>
      <Text style={styles.subtitle}>Sélectionnez le type d'alerte</Text>

      <View style={styles.typeGrid}>
        {alertTypes.map((type) => {
          const config = alertTypeConfig[type];
          return (
            <TouchableOpacity
              key={type}
              style={[styles.typeCard, { borderColor: config.color }]}
              onPress={() => handleSelectType(type)}
            >
              <View style={[styles.typeIconContainer, { backgroundColor: config.color }]}>
                <Ionicons name={config.icon as any} size={32} color={colors.surface} />
              </View>
              <Text style={styles.typeLabel}>{config.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
        <Text style={styles.cancelButtonText}>Annuler</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLocationSelection = () => (
    <ScrollView style={styles.scrollContent}>
      <Text style={styles.title}>Localisation</Text>
      <Text style={styles.subtitle}>Où se situe l'urgence ?</Text>

      {/* Site selection */}
      <Text style={styles.sectionTitle}>Site</Text>
      <View style={styles.optionsList}>
        {userSites.map((site) => (
          <TouchableOpacity
            key={site.id}
            style={[
              styles.optionItem,
              selectedSite?.id === site.id && styles.optionItemSelected,
            ]}
            onPress={() => handleSelectSite(site)}
          >
            <Text
              style={[
                styles.optionText,
                selectedSite?.id === site.id && styles.optionTextSelected,
              ]}
            >
              {site.name}
            </Text>
            {selectedSite?.id === site.id && (
              <Ionicons name="checkmark" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Building selection */}
      {availableBuildings.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Bâtiment (optionnel)</Text>
          <View style={styles.optionsList}>
            {availableBuildings.map((building) => (
              <TouchableOpacity
                key={building.id}
                style={[
                  styles.optionItem,
                  selectedBuilding?.id === building.id && styles.optionItemSelected,
                ]}
                onPress={() => setSelectedBuilding(building)}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedBuilding?.id === building.id && styles.optionTextSelected,
                  ]}
                >
                  {building.name}
                </Text>
                {selectedBuilding?.id === building.id && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Floor selection */}
      {availableFloors.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Étage (optionnel)</Text>
          <View style={styles.optionsList}>
            {availableFloors.map((floor) => (
              <TouchableOpacity
                key={floor.id}
                style={[
                  styles.optionItem,
                  selectedFloor?.id === floor.id && styles.optionItemSelected,
                ]}
                onPress={() => setSelectedFloor(floor)}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedFloor?.id === floor.id && styles.optionTextSelected,
                  ]}
                >
                  {floor.name}
                </Text>
                {selectedFloor?.id === floor.id && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Zone selection */}
      {availableZones.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Zone (optionnel)</Text>
          <View style={styles.optionsList}>
            {availableZones.map((zone) => (
              <TouchableOpacity
                key={zone.id}
                style={[
                  styles.optionItem,
                  selectedZone?.id === zone.id && styles.optionItemSelected,
                ]}
                onPress={() => setSelectedZone(zone)}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedZone?.id === zone.id && styles.optionTextSelected,
                  ]}
                >
                  {zone.name}
                </Text>
                {selectedZone?.id === zone.id && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep('type')}
        >
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.continueButton, !selectedSite && styles.continueButtonDisabled]}
          onPress={handleContinueToDetails}
          disabled={!selectedSite}
        >
          <Text style={styles.continueButtonText}>Continuer</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderDetailsEntry = () => (
    <ScrollView style={styles.scrollContent}>
      <Text style={styles.title}>Détails</Text>
      <Text style={styles.subtitle}>Informations complémentaires (optionnel)</Text>

      {/* Alert summary */}
      {selectedType && (
        <View style={[styles.summaryCard, { borderLeftColor: alertTypeConfig[selectedType].color }]}>
          <Text style={styles.summaryType}>{alertTypeConfig[selectedType].label}</Text>
          <Text style={styles.summaryLocation}>
            {selectedSite?.name}
            {selectedBuilding && ` > ${selectedBuilding.name}`}
            {selectedFloor && ` > ${selectedFloor.name}`}
            {selectedZone && ` > ${selectedZone.name}`}
          </Text>
        </View>
      )}

      {/* Description */}
      <Text style={styles.sectionTitle}>Description</Text>
      <TextInput
        style={styles.textArea}
        value={description}
        onChangeText={setDescription}
        placeholder="Décrivez la situation..."
        placeholderTextColor={colors.textLight}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      {/* Photos */}
      <Text style={styles.sectionTitle}>Photos</Text>
      <View style={styles.photosContainer}>
        {photos.map((photo, index) => (
          <View key={index} style={styles.photoWrapper}>
            <Image source={{ uri: photo }} style={styles.photo} />
            <TouchableOpacity
              style={styles.removePhotoButton}
              onPress={() => handleRemovePhoto(index)}
            >
              <Ionicons name="close-circle" size={24} color={colors.error} />
            </TouchableOpacity>
          </View>
        ))}
        {photos.length < 3 && (
          <TouchableOpacity style={styles.addPhotoButton} onPress={handleAddPhoto}>
            <Ionicons name="camera" size={32} color={colors.textSecondary} />
            <Text style={styles.addPhotoText}>Ajouter</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep('location')}
        >
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={isCreatingAlert}
        >
          {isCreatingAlert ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.submitButtonText}>Envoyer l'alerte</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {step === 'type' && renderTypeSelection()}
      {step === 'location' && renderLocationSelection()}
      {step === 'details' && renderDetailsEntry()}
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
  },
  scrollContent: {
    flex: 1,
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  typeCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: spacing.md,
  },
  typeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  typeLabel: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  optionsList: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionItemSelected: {
    backgroundColor: `${colors.primary}10`,
  },
  optionText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  optionTextSelected: {
    fontWeight: '600',
    color: colors.primary,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderLeftWidth: 4,
    marginBottom: spacing.lg,
  },
  summaryType: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  summaryLocation: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  textArea: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    minHeight: 100,
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  photoWrapper: {
    position: 'relative',
    marginRight: spacing.md,
    marginBottom: spacing.md,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  addPhotoButton: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: spacing.xxl,
    marginBottom: spacing.lg,
  },
  backButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.md,
    alignItems: 'center',
  },
  backButtonText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  continueButton: {
    flex: 2,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    color: colors.surface,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  submitButtonText: {
    color: colors.surface,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 'auto',
    padding: spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
});
