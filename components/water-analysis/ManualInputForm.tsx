import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AquaCard, AquaButton, AquaBadge } from '@/components/ui/AquaComponents';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AquaColors, Spacing, lightTheme, BorderRadius } from '@/constants/theme-constants';

interface FormData {
  source: string;
  testDate: string;
  location: string;
  color: string;
  particles: string;
  particlesDescription: string;
  smell: string;
  taste: string;
  ph: string;
  tds: string;
  temperature: string;
  hardness: string;
  contaminants: string[];
  pipeAge: string;
  visibleIssues: string[];
  recentChanges: string;
  recentChangesDescription: string;
}

interface ManualInputFormProps {
  onSubmit: (data: FormData) => void;
}

export const ManualInputForm: React.FC<ManualInputFormProps> = ({ onSubmit }) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    source: '',
    testDate: new Date().toISOString().split('T')[0],
    location: '',
    color: '',
    particles: '',
    particlesDescription: '',
    smell: '',
    taste: '',
    ph: '',
    tds: '',
    temperature: '',
    hardness: '',
    contaminants: [],
    pipeAge: '',
    visibleIssues: [],
    recentChanges: '',
    recentChangesDescription: '',
  });

  const waterSources = [
    { label: 'Tap Water', value: 'tap' },
    { label: 'Bottled Water', value: 'bottled' },
    { label: 'Well Water', value: 'well' },
    { label: 'River/Lake', value: 'river' },
    { label: 'Rainwater', value: 'rainwater' },
    { label: 'Other', value: 'other' },
  ];

  const colorOptions = [
    { label: 'Clear', value: 'clear' },
    { label: 'Cloudy', value: 'cloudy' },
    { label: 'Yellowish', value: 'yellowish' },
    { label: 'Brownish', value: 'brownish' },
    { label: 'Greenish', value: 'greenish' },
    { label: 'Other', value: 'other' },
  ];

  const smellOptions = [
    { label: 'None', value: 'none' },
    { label: 'Earthy/Musty', value: 'earthy' },
    { label: 'Chlorine', value: 'chlorine' },
    { label: 'Rotten Eggs', value: 'rotten_eggs' },
    { label: 'Metallic', value: 'metallic' },
    { label: 'Other', value: 'other' },
  ];

  const tasteOptions = [
    { label: 'None', value: 'none' },
    { label: 'Bitter', value: 'bitter' },
    { label: 'Salty', value: 'salty' },
    { label: 'Metallic', value: 'metallic' },
    { label: 'Sweet', value: 'sweet' },
    { label: 'Other', value: 'other' },
  ];

  const contaminantOptions = [
    { label: 'Chlorine', value: 'chlorine' },
    { label: 'Lead', value: 'lead' },
    { label: 'Bacteria', value: 'bacteria' },
    { label: 'Nitrates', value: 'nitrates' },
    { label: 'Fluoride', value: 'fluoride' },
    { label: 'None', value: 'none' },
    { label: 'Unknown', value: 'unknown' },
  ];

  const pipeAgeOptions = [
    { label: 'Less than 5 years', value: '<5' },
    { label: '5-20 years', value: '5-20' },
    { label: 'More than 20 years', value: '>20' },
    { label: 'Unknown', value: 'unknown' },
  ];

  const visibleIssueOptions = [
    { label: 'Rust on pipes', value: 'rust' },
    { label: 'Leaks', value: 'leaks' },
    { label: 'Stains in sink', value: 'stains' },
    { label: 'None', value: 'none' },
  ];

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleContaminant = (value: string) => {
    setFormData(prev => ({
      ...prev,
      contaminants: prev.contaminants.includes(value)
        ? prev.contaminants.filter(c => c !== value)
        : [...prev.contaminants, value]
    }));
  };

  const toggleVisibleIssue = (value: string) => {
    setFormData(prev => ({
      ...prev,
      visibleIssues: prev.visibleIssues.includes(value)
        ? prev.visibleIssues.filter(i => i !== value)
        : [...prev.visibleIssues, value]
    }));
  };

  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.source || !formData.color) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    onSubmit(formData);
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4, 5].map((step) => (
        <View key={step} style={styles.stepItem}>
          <View
            style={[
              styles.stepCircle,
              step === currentStep && styles.stepActive,
              step < currentStep && styles.stepCompleted
            ]}
          >
            <ThemedText
              style={[
                styles.stepNumber,
                (step === currentStep || step < currentStep) && styles.stepNumberActive
              ]}
            >
              {step < currentStep ? (
                <IconSymbol name="checkmark" size={14} color={AquaColors.white} />
              ) : step}
            </ThemedText>
          </View>
          <ThemedText style={styles.stepLabel}>Step {step}</ThemedText>
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <ThemedText style={styles.stepTitle}>Basic Information</ThemedText>
      <ThemedText style={styles.stepDescription}>
        Tell us about your water source and when it was tested
      </ThemedText>

      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>Water Source *</ThemedText>
        <View style={styles.optionsContainer}>
          {waterSources.map((source) => (
            <TouchableOpacity
              key={source.value}
              style={[
                styles.optionButton,
                formData.source === source.value && styles.optionSelected
              ]}
              onPress={() => updateFormData('source', source.value)}
            >
              <ThemedText style={styles.optionText}>{source.label}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>Test Date</ThemedText>
        <TouchableOpacity style={styles.dateButton}>
          <IconSymbol name="calendar" size={20} color={AquaColors.aquaDeep} />
          <ThemedText style={styles.dateText}>{formData.testDate}</ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>Location (Optional)</ThemedText>
        <TouchableOpacity style={styles.input}>
          <ThemedText style={styles.inputPlaceholder}>
            Enter city or zip code
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <ThemedText style={styles.stepTitle}>Visual & Sensory Observations</ThemedText>
      <ThemedText style={styles.stepDescription}>
        Describe what you see, smell, and taste (if safe to taste)
      </ThemedText>

      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>Water Color *</ThemedText>
        <View style={styles.optionsContainer}>
          {colorOptions.map((color) => (
            <TouchableOpacity
              key={color.value}
              style={[
                styles.optionButton,
                formData.color === color.value && styles.optionSelected
              ]}
              onPress={() => updateFormData('color', color.value)}
            >
              <ThemedText style={styles.optionText}>{color.label}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>Particles or Sediment</ThemedText>
        <View style={styles.yesNoContainer}>
          <TouchableOpacity
            style={[
              styles.yesNoButton,
              formData.particles === 'yes' && styles.yesNoSelected
            ]}
            onPress={() => updateFormData('particles', 'yes')}
          >
            <ThemedText style={styles.yesNoText}>Yes</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.yesNoButton,
              formData.particles === 'no' && styles.yesNoSelected
            ]}
            onPress={() => updateFormData('particles', 'no')}
          >
            <ThemedText style={styles.yesNoText}>No</ThemedText>
          </TouchableOpacity>
        </View>
        {formData.particles === 'yes' && (
          <TouchableOpacity style={styles.input}>
            <ThemedText style={styles.inputPlaceholder}>
              Describe: Floating bits, Sand-like, etc.
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>Smell</ThemedText>
        <View style={styles.optionsContainer}>
          {smellOptions.map((smell) => (
            <TouchableOpacity
              key={smell.value}
              style={[
                styles.optionButton,
                formData.smell === smell.value && styles.optionSelected
              ]}
              onPress={() => updateFormData('smell', smell.value)}
            >
              <ThemedText style={styles.optionText}>{smell.label}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>Taste</ThemedText>
        <View style={styles.optionsContainer}>
          {tasteOptions.map((taste) => (
            <TouchableOpacity
              key={taste.value}
              style={[
                styles.optionButton,
                formData.taste === taste.value && styles.optionSelected
              ]}
              onPress={() => updateFormData('taste', taste.value)}
            >
              <ThemedText style={styles.optionText}>{taste.label}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.warningRow}>
          <IconSymbol name="exclamationmark.triangle.fill" size={14} color={AquaColors.warning} />
          <ThemedText style={styles.warningText}>
            {' '}Do not taste water if you suspect it's unsafe
          </ThemedText>
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <ThemedText style={styles.stepTitle}>Known Measurements</ThemedText>
      <ThemedText style={styles.stepDescription}>
        Enter any measurements you have (optional)
      </ThemedText>

      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>pH Level (0-14)</ThemedText>
        <TouchableOpacity style={styles.input}>
          <ThemedText style={styles.inputPlaceholder}>
            Use home test kit if available
          </ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.hintText}>
          Ideal range: 6.5 - 8.5
        </ThemedText>
      </View>

      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>Total Dissolved Solids (TDS) in ppm</ThemedText>
        <TouchableOpacity style={styles.input}>
          <ThemedText style={styles.inputPlaceholder}>
            Enter TDS reading
          </ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.hintText}>
          Measures minerals/salts. Ideal: < 500ppm
        </ThemedText>
      </View>

      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>Temperature (°C/°F)</ThemedText>
        <TouchableOpacity style={styles.input}>
          <ThemedText style={styles.inputPlaceholder}>
            Enter temperature
          </ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>Hardness (mg/L)</ThemedText>
        <TouchableOpacity style={styles.input}>
          <ThemedText style={styles.inputPlaceholder}>
            Calcium/magnesium hardness
          </ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>Known Contaminants</ThemedText>
        <View style={styles.multiSelectContainer}>
          {contaminantOptions.map((contaminant) => (
            <TouchableOpacity
              key={contaminant.value}
              style={[
                styles.multiSelectButton,
                formData.contaminants.includes(contaminant.value) && styles.multiSelectSelected
              ]}
              onPress={() => toggleContaminant(contaminant.value)}
            >
              <View style={[
                styles.checkBox,
                formData.contaminants.includes(contaminant.value) && styles.checkBoxSelected
              ]}>
                {formData.contaminants.includes(contaminant.value) && (
                  <IconSymbol name="checkmark" size={12} color={AquaColors.surface} />
                )}
              </View>
              <ThemedText style={styles.multiSelectText}>{contaminant.label}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <ThemedText style={styles.stepTitle}>Infrastructure Details</ThemedText>
      <ThemedText style={styles.stepDescription}>
        Information about plumbing and recent changes
      </ThemedText>

      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>Age of Pipes/Plumbing</ThemedText>
        <View style={styles.optionsContainer}>
          {pipeAgeOptions.map((age) => (
            <TouchableOpacity
              key={age.value}
              style={[
                styles.optionButton,
                formData.pipeAge === age.value && styles.optionSelected
              ]}
              onPress={() => updateFormData('pipeAge', age.value)}
            >
              <ThemedText style={styles.optionText}>{age.label}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>Visible Issues</ThemedText>
        <View style={styles.multiSelectContainer}>
          {visibleIssueOptions.map((issue) => (
            <TouchableOpacity
              key={issue.value}
              style={[
                styles.multiSelectButton,
                formData.visibleIssues.includes(issue.value) && styles.multiSelectSelected
              ]}
              onPress={() => toggleVisibleIssue(issue.value)}
            >
              <View style={[
                styles.checkBox,
                formData.visibleIssues.includes(issue.value) && styles.checkBoxSelected
              ]}>
                {formData.visibleIssues.includes(issue.value) && (
                  <IconSymbol name="checkmark" size={12} color={AquaColors.surface} />
                )}
              </View>
              <ThemedText style={styles.multiSelectText}>{issue.label}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>Recent Changes</ThemedText>
        <View style={styles.yesNoContainer}>
          <TouchableOpacity
            style={[
              styles.yesNoButton,
              formData.recentChanges === 'yes' && styles.yesNoSelected
            ]}
            onPress={() => updateFormData('recentChanges', 'yes')}
          >
            <ThemedText style={styles.yesNoText}>Yes</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.yesNoButton,
              formData.recentChanges === 'no' && styles.yesNoSelected
            ]}
            onPress={() => updateFormData('recentChanges', 'no')}
          >
            <ThemedText style={styles.yesNoText}>No</ThemedText>
          </TouchableOpacity>
        </View>
        {formData.recentChanges === 'yes' && (
          <TouchableOpacity style={styles.input}>
            <ThemedText style={styles.inputPlaceholder}>
              Describe: New construction, Water treatment changes, etc.
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.stepContent}>
      <ThemedText style={styles.stepTitle}>Review & Submit</ThemedText>
      <ThemedText style={styles.stepDescription}>
        Review your information before submitting for analysis
      </ThemedText>

      <AquaCard style={styles.reviewCard}>
        <ThemedText style={styles.reviewTitle}>Summary</ThemedText>
        
        <View style={styles.reviewItem}>
          <ThemedText style={styles.reviewLabel}>Source:</ThemedText>
          <ThemedText style={styles.reviewValue}>
            {waterSources.find(s => s.value === formData.source)?.label || formData.source}
          </ThemedText>
        </View>

        <View style={styles.reviewItem}>
          <ThemedText style={styles.reviewLabel}>Color:</ThemedText>
          <ThemedText style={styles.reviewValue}>
            {colorOptions.find(c => c.value === formData.color)?.label || formData.color}
          </ThemedText>
        </View>

        <View style={styles.reviewItem}>
          <ThemedText style={styles.reviewLabel}>Particles:</ThemedText>
          <ThemedText style={styles.reviewValue}>{formData.particles || 'Not specified'}</ThemedText>
        </View>

        <View style={styles.reviewItem}>
          <ThemedText style={styles.reviewLabel}>Smell:</ThemedText>
          <ThemedText style={styles.reviewValue}>
            {smellOptions.find(s => s.value === formData.smell)?.label || formData.smell}
          </ThemedText>
        </View>

        {formData.contaminants.length > 0 && (
          <View style={styles.reviewItem}>
            <ThemedText style={styles.reviewLabel}>Contaminants:</ThemedText>
            <View style={styles.reviewTags}>
              {formData.contaminants.map((contaminant, index) => (
                <AquaBadge
                  key={index}
                  text={contaminantOptions.find(c => c.value === contaminant)?.label || contaminant}
                  variant="warning"
                  style={styles.reviewTag}
                />
              ))}
            </View>
          </View>
        )}

        <ThemedText style={styles.reviewNote}>
          Your data will be analyzed using our advanced water quality algorithms to identify potential issues and provide recommendations.
        </ThemedText>
      </AquaCard>
    </View>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderStepIndicator()}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStep()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.footerButton, styles.prevButton]}
          onPress={prevStep}
          disabled={currentStep === 1}
        >
          <IconSymbol name="chevron.left" size={20} color={AquaColors.aquaDeep} />
          <ThemedText style={styles.footerButtonText}>Previous</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.footerButton, styles.nextButton]}
          onPress={nextStep}
        >
          <ThemedText style={styles.footerButtonText}>
            {currentStep === 5 ? 'Submit Analysis' : 'Next'}
          </ThemedText>
          <IconSymbol name="chevron.right" size={20} color={AquaColors.surface} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.background,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    backgroundColor: AquaColors.surface,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AquaColors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  stepActive: {
    backgroundColor: AquaColors.aquaDeep,
  },
  stepCompleted: {
    backgroundColor: AquaColors.aquaMedium,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: AquaColors.textSecondary,
  },
  stepNumberActive: {
    color: AquaColors.surface,
  },
  stepLabel: {
    fontSize: 10,
    color: AquaColors.textSecondary,
  },
  stepContent: {
    padding: Spacing.lg,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AquaColors.text,
    marginBottom: Spacing.sm,
  },
  stepDescription: {
    fontSize: 14,
    color: AquaColors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: AquaColors.text,
    marginBottom: Spacing.sm,
  },
  optionsContainer: {
    gap: Spacing.sm,
  },
  optionButton: {
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: AquaColors.borderLight,
    borderRadius: BorderRadius.md,
    backgroundColor: AquaColors.surface,
  },
  optionSelected: {
    borderColor: AquaColors.aquaDeep,
    backgroundColor: AquaColors.aquaLight,
  },
  optionText: {
    fontSize: 16,
    color: AquaColors.text,
    textAlign: 'center',
  },
  yesNoContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  yesNoButton: {
    flex: 1,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: AquaColors.borderLight,
    borderRadius: BorderRadius.md,
    backgroundColor: AquaColors.surface,
    alignItems: 'center',
  },
  yesNoSelected: {
    borderColor: AquaColors.aquaDeep,
    backgroundColor: AquaColors.aquaLight,
  },
  yesNoText: {
    fontSize: 16,
    fontWeight: '600',
    color: AquaColors.text,
  },
  input: {
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: AquaColors.borderLight,
    borderRadius: BorderRadius.md,
    backgroundColor: AquaColors.surface,
  },
  inputPlaceholder: {
    color: AquaColors.textSecondary,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  warningText: {
    fontSize: 12,
    color: AquaColors.warning,
    fontStyle: 'italic',
  },
  hintText: {
    fontSize: 12,
    color: AquaColors.textSecondary,
    marginTop: Spacing.xs,
  },
  multiSelectContainer: {
    gap: Spacing.sm,
  },
  multiSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: AquaColors.borderLight,
    borderRadius: BorderRadius.md,
    backgroundColor: AquaColors.surface,
  },
  multiSelectSelected: {
    borderColor: AquaColors.aquaDeep,
    backgroundColor: AquaColors.aquaLight,
  },
  checkBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: AquaColors.borderLight,
    backgroundColor: AquaColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  checkBoxSelected: {
    backgroundColor: AquaColors.aquaDeep,
    borderColor: AquaColors.aquaDeep,
  },
  multiSelectText: {
    fontSize: 14,
    color: AquaColors.text,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: AquaColors.borderLight,
    borderRadius: BorderRadius.md,
    backgroundColor: AquaColors.surface,
    gap: Spacing.sm,
  },
  dateText: {
    fontSize: 16,
    color: AquaColors.text,
  },
  reviewCard: {
    padding: Spacing.lg,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AquaColors.text,
    marginBottom: Spacing.md,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  reviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: AquaColors.textSecondary,
  },
  reviewValue: {
    fontSize: 14,
    color: AquaColors.text,
    flex: 1,
    textAlign: 'right',
  },
  reviewTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  reviewTag: {
    marginBottom: Spacing.xs,
  },
  reviewNote: {
    fontSize: 12,
    color: AquaColors.textSecondary,
    fontStyle: 'italic',
    marginTop: Spacing.md,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    backgroundColor: AquaColors.surface,
    borderTopWidth: 1,
    borderTopColor: AquaColors.borderLight,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  prevButton: {
    backgroundColor: AquaColors.borderLight,
  },
  nextButton: {
    backgroundColor: AquaColors.aquaDeep,
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
