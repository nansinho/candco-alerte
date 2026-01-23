import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';
import {
  ScheduledSession,
  FinancingMode,
  SessionSelectionType,
  NeedsAnalysis,
} from '../../types/database';
import { useFormationStore } from '../../store/formationStore';
import { useAuthStore } from '../../store/authStore';

type RegistrationStep = 'sessionType' | 'sessionSelection' | 'financing' | 'needsAnalysis' | 'review';

const financingModes: { value: FinancingMode; label: string }[] = [
  { value: 'fonds_propres', label: 'Financement sur fonds propres' },
  { value: 'opco', label: 'OPCO' },
  { value: 'cpf', label: 'CPF (Compte Personnel de Formation)' },
  { value: 'entreprise', label: 'Prise en charge entreprise' },
  { value: 'autre', label: 'Autre' },
];

const skillLevels: { value: NeedsAnalysis['currentSkillLevel']; label: string }[] = [
  { value: 'debutant', label: 'Débutant' },
  { value: 'intermediaire', label: 'Intermédiaire' },
  { value: 'avance', label: 'Avancé' },
];

export function SessionRegistrationScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { formationId, formationTitle } = route.params || {};

  const { user } = useAuthStore();
  const {
    selectedFormation,
    selectionType,
    selectedSession,
    proposedStartDate,
    proposedEndDate,
    financingMode,
    financingDetails,
    message,
    needsAnalysis,
    isSubmitting,
    fetchFormationById,
    setSelectionType,
    setSelectedSession,
    setProposedDates,
    setFinancingMode,
    setFinancingDetails,
    setMessage,
    updateNeedsAnalysis,
    submitRegistration,
    resetRegistrationForm,
  } = useFormationStore();

  const [step, setStep] = useState<RegistrationStep>('sessionType');
  const [localProposedStartDate, setLocalProposedStartDate] = useState('');
  const [localProposedEndDate, setLocalProposedEndDate] = useState('');

  useEffect(() => {
    if (formationId) {
      fetchFormationById(formationId);
    }
    return () => {
      resetRegistrationForm();
    };
  }, [formationId]);

  const scheduledSessions = selectedFormation?.scheduled_sessions || [];

  const handleSelectSessionType = (type: SessionSelectionType) => {
    setSelectionType(type);
    setStep('sessionSelection');
  };

  const handleSelectSession = (session: ScheduledSession) => {
    setSelectedSession(session);
  };

  const handleContinueFromSessionSelection = () => {
    if (selectionType === 'scheduled' && !selectedSession) {
      Alert.alert('Erreur', 'Veuillez sélectionner une session');
      return;
    }
    if (selectionType === 'proposed') {
      if (!localProposedStartDate || !localProposedEndDate) {
        Alert.alert('Erreur', 'Veuillez renseigner les dates souhaitées');
        return;
      }
      setProposedDates(localProposedStartDate, localProposedEndDate);
    }
    setStep('financing');
  };

  const handleContinueFromFinancing = () => {
    if (!financingMode) {
      Alert.alert('Erreur', 'Veuillez sélectionner un mode de financement');
      return;
    }
    setStep('needsAnalysis');
  };

  const handleContinueFromNeedsAnalysis = () => {
    if (!needsAnalysis.learningObjectives.trim()) {
      Alert.alert('Erreur', 'Veuillez renseigner vos objectifs d\'apprentissage');
      return;
    }
    setStep('review');
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      Alert.alert('Erreur', 'Vous devez être connecté pour vous inscrire');
      return;
    }

    const { data, error } = await submitRegistration(user.id);

    if (error) {
      Alert.alert('Erreur', error.message);
      return;
    }

    navigation.navigate('RegistrationSuccess', { registrationId: data?.id });
  };

  const handleBack = () => {
    switch (step) {
      case 'sessionSelection':
        setStep('sessionType');
        break;
      case 'financing':
        setStep('sessionSelection');
        break;
      case 'needsAnalysis':
        setStep('financing');
        break;
      case 'review':
        setStep('needsAnalysis');
        break;
      default:
        navigation.goBack();
    }
  };

  const handleCancel = () => {
    resetRegistrationForm();
    navigation.goBack();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStepNumber = () => {
    const steps: RegistrationStep[] = ['sessionType', 'sessionSelection', 'financing', 'needsAnalysis', 'review'];
    return steps.indexOf(step) + 1;
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4, 5].map((num) => (
        <React.Fragment key={num}>
          <View
            style={[
              styles.stepCircle,
              getStepNumber() >= num && styles.stepCircleActive,
              getStepNumber() === num && styles.stepCircleCurrent,
            ]}
          >
            {getStepNumber() > num ? (
              <Ionicons name="checkmark" size={14} color={colors.surface} />
            ) : (
              <Text
                style={[
                  styles.stepNumber,
                  getStepNumber() >= num && styles.stepNumberActive,
                ]}
              >
                {num}
              </Text>
            )}
          </View>
          {num < 5 && (
            <View
              style={[
                styles.stepLine,
                getStepNumber() > num && styles.stepLineActive,
              ]}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  const renderSessionTypeSelection = () => (
    <View style={styles.content}>
      <Text style={styles.title}>Comment souhaitez-vous vous inscrire ?</Text>
      <Text style={styles.subtitle}>
        Choisissez une session programmée ou proposez vos propres dates
      </Text>

      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => handleSelectSessionType('scheduled')}
        >
          <View style={styles.optionIconContainer}>
            <Ionicons name="calendar" size={32} color={colors.primary} />
          </View>
          <Text style={styles.optionTitle}>Sessions programmées</Text>
          <Text style={styles.optionDescription}>
            Choisissez parmi nos sessions déjà planifiées
          </Text>
          {scheduledSessions.length > 0 && (
            <Text style={styles.optionBadge}>
              {scheduledSessions.length} session{scheduledSessions.length > 1 ? 's' : ''} disponible{scheduledSessions.length > 1 ? 's' : ''}
            </Text>
          )}
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} style={styles.optionArrow} />
        </TouchableOpacity>

        <View style={styles.separator}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>ou</Text>
          <View style={styles.separatorLine} />
        </View>

        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => handleSelectSessionType('proposed')}
        >
          <View style={styles.optionIconContainer}>
            <Ionicons name="create-outline" size={32} color={colors.primary} />
          </View>
          <Text style={styles.optionTitle}>Proposer d'autres dates</Text>
          <Text style={styles.optionDescription}>
            Nous vérifierons la disponibilité de nos formateurs pour vos dates préférées
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} style={styles.optionArrow} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
        <Text style={styles.cancelButtonText}>Annuler</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSessionSelection = () => (
    <ScrollView style={styles.scrollContent}>
      {selectionType === 'scheduled' ? (
        <>
          <Text style={styles.title}>Sessions programmées</Text>
          <Text style={styles.subtitle}>
            Sélectionnez la session qui vous convient
          </Text>

          <View style={styles.sessionsList}>
            {scheduledSessions.map((session) => (
              <TouchableOpacity
                key={session.id}
                style={[
                  styles.sessionCard,
                  selectedSession?.id === session.id && styles.sessionCardSelected,
                ]}
                onPress={() => handleSelectSession(session)}
              >
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionDates}>
                    {formatDate(session.start_date)} - {formatDate(session.end_date)}
                  </Text>
                  <View style={styles.sessionLocationRow}>
                    <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.sessionLocation}>
                      {session.address || session.location}
                    </Text>
                  </View>
                  <View style={styles.sessionSpotsRow}>
                    <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.sessionSpots}>
                      {session.available_spots} places disponibles
                    </Text>
                  </View>
                </View>
                {selectedSession?.id === session.id && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </>
      ) : (
        <>
          <Text style={styles.title}>Proposer des dates</Text>
          <Text style={styles.subtitle}>
            Indiquez vos dates préférées pour cette formation
          </Text>

          <Text style={styles.inputLabel}>Date de début souhaitée</Text>
          <TextInput
            style={styles.dateInput}
            value={localProposedStartDate}
            onChangeText={setLocalProposedStartDate}
            placeholder="JJ/MM/AAAA"
            placeholderTextColor={colors.textLight}
          />

          <Text style={styles.inputLabel}>Date de fin souhaitée</Text>
          <TextInput
            style={styles.dateInput}
            value={localProposedEndDate}
            onChangeText={setLocalProposedEndDate}
            placeholder="JJ/MM/AAAA"
            placeholderTextColor={colors.textLight}
          />

          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={colors.info} />
            <Text style={styles.infoText}>
              Nous vous contacterons pour confirmer la disponibilité de nos formateurs.
            </Text>
          </View>
        </>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinueFromSessionSelection}
        >
          <Text style={styles.continueButtonText}>Continuer</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.surface} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderFinancing = () => (
    <ScrollView style={styles.scrollContent}>
      <Text style={styles.title}>Mode de financement</Text>
      <Text style={styles.subtitle}>
        Comment souhaitez-vous financer cette formation ?
      </Text>

      <View style={styles.optionsList}>
        {financingModes.map((mode) => (
          <TouchableOpacity
            key={mode.value}
            style={[
              styles.financingOption,
              financingMode === mode.value && styles.financingOptionSelected,
            ]}
            onPress={() => setFinancingMode(mode.value)}
          >
            <Text
              style={[
                styles.financingOptionText,
                financingMode === mode.value && styles.financingOptionTextSelected,
              ]}
            >
              {mode.label}
            </Text>
            {financingMode === mode.value && (
              <Ionicons name="checkmark" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {financingMode === 'autre' && (
        <>
          <Text style={styles.inputLabel}>Précisez le mode de financement</Text>
          <TextInput
            style={styles.textInput}
            value={financingDetails}
            onChangeText={setFinancingDetails}
            placeholder="Décrivez votre mode de financement..."
            placeholderTextColor={colors.textLight}
            multiline
          />
        </>
      )}

      <Text style={styles.inputLabel}>Message (optionnel)</Text>
      <TextInput
        style={styles.textArea}
        value={message}
        onChangeText={setMessage}
        placeholder="Ajoutez un message ou des précisions..."
        placeholderTextColor={colors.textLight}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.continueButton, !financingMode && styles.continueButtonDisabled]}
          onPress={handleContinueFromFinancing}
          disabled={!financingMode}
        >
          <Text style={styles.continueButtonText}>Continuer</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.surface} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderNeedsAnalysis = () => (
    <ScrollView style={styles.scrollContent}>
      <View style={styles.needsAnalysisHeader}>
        <Ionicons name="clipboard-outline" size={24} color={colors.primary} />
        <Text style={styles.title}>Analyse des besoins</Text>
      </View>
      <Text style={styles.needsAnalysisNotice}>
        Conformément aux exigences Qualiopi, veuillez compléter cette analyse de vos besoins de formation.
        Cela nous permettra d'adapter au mieux la formation à vos attentes.
      </Text>

      <Text style={styles.inputLabel}>Niveau actuel *</Text>
      <View style={styles.skillLevelContainer}>
        {skillLevels.map((level) => (
          <TouchableOpacity
            key={level.value}
            style={[
              styles.skillLevelButton,
              needsAnalysis.currentSkillLevel === level.value && styles.skillLevelButtonSelected,
            ]}
            onPress={() => updateNeedsAnalysis('currentSkillLevel', level.value)}
          >
            <Text
              style={[
                styles.skillLevelText,
                needsAnalysis.currentSkillLevel === level.value && styles.skillLevelTextSelected,
              ]}
            >
              {level.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.inputLabel}>Expérience précédente dans ce domaine</Text>
      <TextInput
        style={styles.textArea}
        value={needsAnalysis.previousExperience}
        onChangeText={(text) => updateNeedsAnalysis('previousExperience', text)}
        placeholder="Décrivez votre expérience..."
        placeholderTextColor={colors.textLight}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      <Text style={styles.inputLabel}>Objectifs d'apprentissage *</Text>
      <TextInput
        style={styles.textArea}
        value={needsAnalysis.learningObjectives}
        onChangeText={(text) => updateNeedsAnalysis('learningObjectives', text)}
        placeholder="Quels sont vos objectifs pour cette formation ?"
        placeholderTextColor={colors.textLight}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      <Text style={styles.inputLabel}>Contraintes spécifiques</Text>
      <TextInput
        style={styles.textArea}
        value={needsAnalysis.specificConstraints}
        onChangeText={(text) => updateNeedsAnalysis('specificConstraints', text)}
        placeholder="Avez-vous des contraintes particulières ?"
        placeholderTextColor={colors.textLight}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      <Text style={styles.inputLabel}>Résultats attendus</Text>
      <TextInput
        style={styles.textArea}
        value={needsAnalysis.expectedOutcomes}
        onChangeText={(text) => updateNeedsAnalysis('expectedOutcomes', text)}
        placeholder="Qu'attendez-vous de cette formation ?"
        placeholderTextColor={colors.textLight}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !needsAnalysis.learningObjectives.trim() && styles.continueButtonDisabled,
          ]}
          onPress={handleContinueFromNeedsAnalysis}
          disabled={!needsAnalysis.learningObjectives.trim()}
        >
          <Text style={styles.continueButtonText}>Continuer</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.surface} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderReview = () => (
    <ScrollView style={styles.scrollContent}>
      <Text style={styles.title}>Récapitulatif</Text>
      <Text style={styles.subtitle}>Vérifiez les informations avant d'envoyer</Text>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>Formation</Text>
        <Text style={styles.reviewValue}>{selectedFormation?.title || formationTitle}</Text>
      </View>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>Session</Text>
        {selectionType === 'scheduled' && selectedSession ? (
          <>
            <Text style={styles.reviewValue}>
              {formatDate(selectedSession.start_date)} - {formatDate(selectedSession.end_date)}
            </Text>
            <Text style={styles.reviewSubValue}>
              {selectedSession.address || selectedSession.location}
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.reviewValue}>Dates proposées</Text>
            <Text style={styles.reviewSubValue}>
              {localProposedStartDate} - {localProposedEndDate}
            </Text>
          </>
        )}
      </View>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>Financement</Text>
        <Text style={styles.reviewValue}>
          {financingModes.find((m) => m.value === financingMode)?.label}
        </Text>
        {financingDetails && (
          <Text style={styles.reviewSubValue}>{financingDetails}</Text>
        )}
      </View>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>Analyse des besoins</Text>
        <View style={styles.reviewNeedsAnalysis}>
          <Text style={styles.reviewNeedsLabel}>Niveau: </Text>
          <Text style={styles.reviewNeedsValue}>
            {skillLevels.find((l) => l.value === needsAnalysis.currentSkillLevel)?.label}
          </Text>
        </View>
        <View style={styles.reviewNeedsAnalysis}>
          <Text style={styles.reviewNeedsLabel}>Objectifs: </Text>
          <Text style={styles.reviewNeedsValue}>{needsAnalysis.learningObjectives}</Text>
        </View>
      </View>

      {message && (
        <View style={styles.reviewSection}>
          <Text style={styles.reviewSectionTitle}>Message</Text>
          <Text style={styles.reviewValue}>{message}</Text>
        </View>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Envoyer ma demande</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.surface} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inscription à la formation</Text>
        <Text style={styles.headerSubtitle} numberOfLines={1}>
          {selectedFormation?.title || formationTitle}
        </Text>
        {renderStepIndicator()}
      </View>

      {step === 'sessionType' && renderSessionTypeSelection()}
      {step === 'sessionSelection' && renderSessionSelection()}
      {step === 'financing' && renderFinancing()}
      {step === 'needsAnalysis' && renderNeedsAnalysis()}
      {step === 'review' && renderReview()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: colors.primary,
  },
  stepCircleCurrent: {
    borderWidth: 2,
    borderColor: colors.primaryDark,
  },
  stepNumber: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  stepNumberActive: {
    color: colors.surface,
  },
  stepLine: {
    width: 24,
    height: 2,
    backgroundColor: colors.border,
  },
  stepLineActive: {
    backgroundColor: colors.primary,
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
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  optionsContainer: {
    gap: spacing.md,
  },
  optionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${colors.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  optionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  optionDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  optionBadge: {
    fontSize: fontSize.xs,
    color: colors.success,
    fontWeight: '500',
  },
  optionArrow: {
    position: 'absolute',
    right: spacing.lg,
    top: '50%',
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  separatorText: {
    paddingHorizontal: spacing.md,
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  sessionsList: {
    gap: spacing.md,
  },
  sessionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}05`,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDates: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sessionLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  sessionLocation: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  sessionSpotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sessionSpots: {
    fontSize: fontSize.sm,
    color: colors.success,
  },
  inputLabel: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  dateInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    minHeight: 80,
  },
  textArea: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    minHeight: 80,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: `${colors.info}10`,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  infoText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.info,
  },
  optionsList: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  financingOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  financingOptionSelected: {
    backgroundColor: `${colors.primary}10`,
  },
  financingOptionText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  financingOptionTextSelected: {
    fontWeight: '600',
    color: colors.primary,
  },
  needsAnalysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  needsAnalysisNotice: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    backgroundColor: `${colors.warning}10`,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  skillLevelContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  skillLevelButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  skillLevelButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  skillLevelText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  skillLevelTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  reviewSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  reviewSectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  reviewValue: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '500',
  },
  reviewSubValue: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  reviewNeedsAnalysis: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  reviewNeedsLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  reviewNeedsValue: {
    fontSize: fontSize.sm,
    color: colors.text,
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xxl,
    marginBottom: spacing.lg,
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  backButtonText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  continueButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
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
