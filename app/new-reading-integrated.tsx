import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AquaColors, BorderRadius, lightTheme, Spacing } from '@/constants/theme-constants';
import ApiService from '@/services/ApiService';
import { storageService } from '@/services/storage';
import { useAuth } from '@/contexts/AuthContext';
import { ImageAnalysisData, ManualInputData, SensorData, WaterAnalysisEngine } from '@/services/waterAnalysisEngine';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert as RNAlert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type InputType = 'manual' | 'image' | 'sensor' | null;

export default function NewReadingIntegratedScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [selectedType, setSelectedType] = useState<InputType>(null);
  const { isAuthenticated } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const inputTypes = [
    {
      type: 'manual' as const,
      title: 'Manual Input',
      description: 'Answer questions about your water',
      icon: 'doc.text.fill',
      color: AquaColors.aquaMedium,
    },
    {
      type: 'image' as const,
      title: 'Image Analysis',
      description: 'Take photos for AI analysis',
      icon: 'camera.fill',
      color: AquaColors.aquaBright,
    },
    {
      type: 'sensor' as const,
      title: 'Sensor Data',
      description: 'Connect to water quality sensors',
      icon: 'antenna.radiowaves.left.and.right',
      color: AquaColors.warning,
    },
  ];

  const handleManualSubmit = async (data: ManualInputData) => {
    setIsProcessing(true);
    
    try {
      // Process the manual input data
      const analysis = WaterAnalysisEngine.processManualInput(data);
      
      // Save to backend first
      if (isAuthenticated) {
        try {
          await ApiService.createReading({
            source_type: data.source,
            location: data.location,
            quality_score: analysis.score,
            quality_level: analysis.status,
            issues: analysis.issues,
            recommendations: analysis.recommendations,
            input_data: data,
            reading_type: 'manual',
          });
        } catch {}
      }

      // Save to local storage
      await storageService.saveWaterAnalysis(analysis);
      
      // Create alert if needed
      if (analysis.score < 80) {
        const alert = {
          id: `alert_${Date.now()}`,
          type: analysis.score < 70 ? 'danger' : 'warning',
          message: `Water quality ${analysis.status}: ${analysis.issues.join(', ')}`,
          time: 'Just now',
          read: false,
          analysisId: analysis.id,
        } as any;
        await storageService.saveAlert(alert);
      }
      
      RNAlert.alert('Analysis Complete', `Water quality score: ${analysis.score}/100 (${analysis.status})`);
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save analysis. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageSubmit = async (data: ImageAnalysisData) => {
    setIsProcessing(true);
    
    try {
      // Process the image analysis data
      const analysis = WaterAnalysisEngine.processImageAnalysis(data);
      
      // Save to backend first
      if (isAuthenticated) {
        try {
          await ApiService.createReading({
            source_type: 'image_analysis',
            quality_score: analysis.score,
            quality_level: analysis.status,
            issues: analysis.issues,
            recommendations: analysis.recommendations,
            input_data: data,
            reading_type: 'image',
          });
        } catch {}
      }

      // Save to local storage
      await storageService.saveWaterAnalysis(analysis);
      
      // Create alert if needed
      if (analysis.score < 80) {
        const alert = {
          id: `alert_${Date.now()}`,
          type: analysis.score < 70 ? 'danger' : 'warning',
          message: `Image analysis: ${analysis.issues.join(', ')}`,
          time: 'Just now',
          read: false,
          analysisId: analysis.id,
        } as any;
        await storageService.saveAlert(alert);
      }
      
      RNAlert.alert('Analysis Complete', `AI analysis score: ${analysis.score}/100 (${analysis.status})`);
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save analysis. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSensorSubmit = async (data: SensorData) => {
    setIsProcessing(true);
    
    try {
      // Process the sensor data
      const analysis = WaterAnalysisEngine.processSensorData(data);
      
      // Save to backend first
      if (isAuthenticated) {
        try {
          await ApiService.createReading({
            source_type: 'sensor',
            quality_score: analysis.score,
            quality_level: analysis.status,
            issues: analysis.issues,
            recommendations: analysis.recommendations,
            input_data: data,
            reading_type: 'sensor',
          });
        } catch {}
      }

      // Save to local storage
      await storageService.saveWaterAnalysis(analysis);
      
      // Create alert if needed
      if (analysis.score < 80) {
        const alert = {
          id: `alert_${Date.now()}`,
          type: analysis.score < 70 ? 'danger' : 'warning',
          message: `Sensor reading: ${analysis.issues.join(', ')}`,
          time: 'Just now',
          read: false,
          analysisId: analysis.id,
        } as any;
        await storageService.saveAlert(alert);
      }
      
      RNAlert.alert('Analysis Complete', `Sensor analysis score: ${analysis.score}/100 (${analysis.status})`);
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save analysis. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderInputTypeSelection = () => (
    <View style={[styles.content, { paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>New Water Analysis</ThemedText>
        <ThemedText style={styles.subtitle}>
          Choose how you'd like to analyze your water quality
        </ThemedText>
      </View>

      <View style={styles.typeGrid}>
        {inputTypes.map((inputType) => (
          <TouchableOpacity
            key={inputType.type}
            style={[
              styles.typeCard,
              selectedType === inputType.type && styles.typeSelected
            ]}
            onPress={() => setSelectedType(inputType.type)}
            disabled={isProcessing}
          >
            <View style={[styles.typeIcon, { backgroundColor: inputType.color }]}>
              <IconSymbol name={inputType.icon} size={32} color={AquaColors.surface} />
            </View>
            <ThemedText style={styles.typeTitle}>{inputType.title}</ThemedText>
            <ThemedText style={styles.typeDescription}>{inputType.description}</ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {selectedType && (
        <View style={styles.selectedActions}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedType(null)}
          >
            <IconSymbol name="chevron.left" size={20} color={AquaColors.aquaDeep} />
            <ThemedText style={styles.backButtonText}>Back</ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderInputForm = () => {
    switch (selectedType) {
      case 'manual':
        return (
          <ManualInputForm
            onSubmit={handleManualSubmit}
          />
        );
      case 'image':
        return (
          <ImageAnalysisForm
            onSubmit={handleImageSubmit}
          />
        );
      case 'sensor':
        return (
          <SensorIntegrationForm
            onSubmit={handleSensorSubmit}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {selectedType ? renderInputForm() : renderInputTypeSelection()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: lightTheme.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AquaColors.textDark,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: AquaColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  typeGrid: {
    gap: Spacing.lg,
  },
  typeCard: {
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: AquaColors.borderLight,
    borderRadius: BorderRadius.lg,
    backgroundColor: AquaColors.surface,
    alignItems: 'center',
    gap: Spacing.md,
  },
  typeSelected: {
    borderColor: AquaColors.aquaDeep,
    backgroundColor: AquaColors.aquaLight,
  },
  typeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AquaColors.textDark,
  },
  typeDescription: {
    fontSize: 14,
    color: AquaColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  selectedActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: AquaColors.borderLight,
    borderRadius: BorderRadius.md,
    backgroundColor: AquaColors.surface,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: AquaColors.aquaDeep,
  },
});
