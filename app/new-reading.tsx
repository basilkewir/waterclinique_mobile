import { ThemedText } from '@/components/themed-text';
import { AquaBadge, AquaButton, AquaCard } from '@/components/ui/AquaComponents';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { VisualOptionCard } from '@/components/ui/VisualOptionCard';
import { AquaColors, BorderRadius, lightTheme, Spacing } from '@/constants/theme-constants';
import {
    analyzeWater,
    WaterAnalysisResult,
    WaterObservation,
} from '@/services/WaterAnalysisService';
import WaterDataService from '@/services/WaterDataService';
import SourcePicker from '@/components/ui/SourcePicker';
import type { WaterSource } from '@/services/WaterDataService';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NewReadingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [selectedSource, setSelectedSource] = useState<WaterSource | null>(null);
  const [testMethod, setTestMethod] = useState('manual');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showNewSourceForm, setShowNewSourceForm] = useState(false);
  const [newSourceName, setNewSourceName] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<WaterAnalysisResult | null>(null);
  const [readings, setReadings] = useState({
    ph: '',
    turbidity: '',
    chlorine: '',
    temperature: '',
    dissolvedOxygen: '',
    tds: '',
    conductivity: '',
    color: 'clear',
    smell: 'none',
    taste: 'normal',
    clarity: 'clear',
    foam: 'none',
    particles: 'none'
  });

  const testMethods = [
    { key: 'manual', label: t('readings.manualTest'), icon: 'hand.raised.fill' },
    { key: 'photo', label: t('readings.photoAnalysis'), icon: 'camera.fill' }
  ];

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const analyzePhoto = async () => {
    if (!selectedImage) return;
    setAnalyzing(true);
    setAnalysisResults(null);

    try {
      const observation: WaterObservation = {
        source: selectedSource?.name || undefined,
        ph: readings.ph ? parseFloat(readings.ph) : undefined,
        turbidity: readings.turbidity ? parseFloat(readings.turbidity) : undefined,
        chlorine: readings.chlorine ? parseFloat(readings.chlorine) : undefined,
        temperature: readings.temperature ? parseFloat(readings.temperature) : undefined,
        tds: readings.tds ? parseFloat(readings.tds) : undefined,
        conductivity: readings.conductivity ? parseFloat(readings.conductivity) : undefined,
        color: readings.color,
        clarity: readings.clarity,
        foam: readings.foam,
        smell: readings.smell,
        taste: readings.taste,
        particles: readings.particles,
        hasPhoto: true,
      };

      const result = analyzeWater(observation);
      setAnalysisResults(result);

      // Save reading to storage
      if (selectedSource) {
        await WaterDataService.saveReading({
          water_source_id: selectedSource.id,
          ph: readings.ph ? parseFloat(readings.ph) : undefined,
          turbidity: readings.turbidity ? parseFloat(readings.turbidity) : undefined,
          chlorine: readings.chlorine ? parseFloat(readings.chlorine) : undefined,
          temperature: readings.temperature ? parseFloat(readings.temperature) : undefined,
          tds: readings.tds ? parseFloat(readings.tds) : undefined,
          conductivity: readings.conductivity ? parseFloat(readings.conductivity) : undefined,
          color: readings.color,
          clarity: readings.clarity,
          foam: readings.foam,
          smell: readings.smell,
          taste: readings.taste,
          particles: readings.particles,
          type: 'photo',
          quality: result.overallQuality === 'Likely safe' ? 'Good' : 
                   result.overallQuality === 'Caution' ? 'Fair' : 'Poor',
          riskScore: result.riskScore,
        });
      }

      setAnalyzing(false);
    } catch (error) {
      console.error('Error analyzing photo:', error);
      // Still analyze even if save fails
      const observation: WaterObservation = {
        source: selectedSource?.name || undefined,
        hasPhoto: true,
      };
      const result = analyzeWater(observation);
      setAnalysisResults(result);
      setAnalyzing(false);
    }
  };

  const sources = [
    'Community Well #1',
    'River Intake Point',
    'Borehole Station A'
  ];

  const colorOptions = [
    { key: 'clear', label: t('waterQuality.clear'), icon: 'drop.fill', color: '#E3F2FD' },
    { key: 'slightly_cloudy', label: t('waterQuality.slightlyCloudy'), icon: 'cloud.fill', color: '#F5F5F5' },
    { key: 'cloudy', label: t('waterQuality.cloudy'), icon: 'cloud.fill', color: '#E0E0E0' },
    { key: 'muddy', label: t('waterQuality.muddy'), icon: 'drop.fill', color: '#8D6E63' },
    { key: 'brown', label: t('waterQuality.brown'), icon: 'drop.fill', color: '#795548' },
    { key: 'yellow', label: t('waterQuality.yellow'), icon: 'drop.fill', color: '#FFC107' },
    { key: 'green', label: t('waterQuality.green'), icon: 'drop.fill', color: '#4CAF50' },
    { key: 'red', label: t('waterQuality.red'), icon: 'drop.fill', color: '#F44336' }
  ];
  
  const smellOptions = [
    { key: 'none', label: t('waterQuality.noSmell'), icon: 'checkmark.circle.fill', color: '#4CAF50' },
    { key: 'chlorine', label: t('waterQuality.chlorine'), icon: 'flask.fill', color: '#2196F3' },
    { key: 'earthy', label: t('waterQuality.earthy'), icon: 'leaf.fill', color: '#8BC34A' },
    { key: 'musty', label: t('waterQuality.musty'), icon: 'humidity.fill', color: '#607D8B' },
    { key: 'fishy', label: t('waterQuality.fishy'), icon: 'fish.fill', color: '#FF9800' },
    { key: 'chemical', label: t('waterQuality.chemical'), icon: 'exclamationmark.triangle.fill', color: '#FF5722' },
    { key: 'sewage', label: t('waterQuality.sewage'), icon: 'xmark.circle.fill', color: '#9C27B0' },
    { key: 'rotten', label: t('waterQuality.rotten'), icon: 'trash.fill', color: '#795548' }
  ];
  
  const tasteOptions = [
    { key: 'normal', label: t('waterQuality.normal'), icon: 'checkmark.circle.fill', color: '#4CAF50' },
    { key: 'chlorine', label: t('waterQuality.chlorine'), icon: 'flask.fill', color: '#2196F3' },
    { key: 'metallic', label: t('waterQuality.metallic'), icon: 'gear.circle.fill', color: '#607D8B' },
    { key: 'salty', label: t('waterQuality.salty'), icon: 'drop.circle.fill', color: '#00BCD4' },
    { key: 'bitter', label: t('waterQuality.bitter'), icon: 'minus.circle.fill', color: '#FF9800' },
    { key: 'sweet', label: t('waterQuality.sweet'), icon: 'plus.circle.fill', color: '#E91E63' },
    { key: 'sour', label: t('waterQuality.sour'), icon: 'exclamationmark.circle.fill', color: '#CDDC39' },
    { key: 'chemical', label: t('waterQuality.chemical'), icon: 'exclamationmark.triangle.fill', color: '#FF5722' }
  ];
  
  const clarityOptions = [
    { key: 'crystal_clear', label: t('waterQuality.crystalClear'), icon: 'sparkles', color: '#E3F2FD' },
    { key: 'clear', label: t('waterQuality.clear'), icon: 'drop.fill', color: '#BBDEFB' },
    { key: 'slightly_hazy', label: t('waterQuality.slightlyHazy'), icon: 'cloud.fill', color: '#90CAF9' },
    { key: 'hazy', label: t('waterQuality.hazy'), icon: 'cloud.fill', color: '#64B5F6' },
    { key: 'cloudy', label: t('waterQuality.cloudy'), icon: 'cloud.fill', color: '#42A5F5' },
    { key: 'very_cloudy', label: t('waterQuality.veryCloudy'), icon: 'cloud.fill', color: '#2196F3' }
  ];
  
  const foamOptions = [
    { key: 'none', label: t('waterQuality.noFoam'), icon: 'checkmark.circle.fill', color: '#4CAF50' },
    { key: 'slight', label: t('waterQuality.slightFoam'), icon: 'bubble.left.fill', color: '#8BC34A' },
    { key: 'moderate', label: t('waterQuality.moderate'), icon: 'bubble.middle.bottom.fill', color: '#FFC107' },
    { key: 'heavy', label: t('waterQuality.heavyFoam'), icon: 'bubble.right.fill', color: '#FF9800' },
    { key: 'excessive', label: t('waterQuality.excessive'), icon: 'exclamationmark.bubble.fill', color: '#F44336' }
  ];
  
  const particlesOptions = [
    { key: 'none', label: t('waterQuality.noParticles'), icon: 'checkmark.circle.fill', color: '#4CAF50' },
    { key: 'few', label: t('waterQuality.fewParticles'), icon: 'circle.fill', color: '#8BC34A' },
    { key: 'some', label: t('waterQuality.someParticles'), icon: 'circle.grid.2x2.fill', color: '#FFC107' },
    { key: 'many', label: t('waterQuality.manyParticles'), icon: 'circle.grid.3x3.fill', color: '#FF9800' },
    { key: 'excessive', label: t('waterQuality.excessive'), icon: 'exclamationmark.triangle.fill', color: '#F44336' }
  ];

  const handleSubmit = async () => {
    if (!selectedSource) {
      Alert.alert(t('waterImageAnalysis.error'), t('waterImageAnalysis.selectSourceFirst'));
      return;
    }

    setAnalyzing(true);
    setAnalysisResults(null);

    try {
      // Analyze first
      const observation: WaterObservation = {
        source: selectedSource?.name,
        ph: readings.ph ? parseFloat(readings.ph) : undefined,
        turbidity: readings.turbidity ? parseFloat(readings.turbidity) : undefined,
        chlorine: readings.chlorine ? parseFloat(readings.chlorine) : undefined,
        temperature: readings.temperature ? parseFloat(readings.temperature) : undefined,
        tds: readings.tds ? parseFloat(readings.tds) : undefined,
        conductivity: readings.conductivity ? parseFloat(readings.conductivity) : undefined,
        color: readings.color,
        clarity: readings.clarity,
        foam: readings.foam,
        smell: readings.smell,
        taste: readings.taste,
        particles: readings.particles,
        hasPhoto: !!selectedImage,
      };

      const result = analyzeWater(observation);
      setAnalysisResults(result);

      // Save reading to storage
      await WaterDataService.saveReading({
        water_source_id: selectedSource.id,
        ph: readings.ph ? parseFloat(readings.ph) : undefined,
        turbidity: readings.turbidity ? parseFloat(readings.turbidity) : undefined,
        chlorine: readings.chlorine ? parseFloat(readings.chlorine) : undefined,
        temperature: readings.temperature ? parseFloat(readings.temperature) : undefined,
        dissolved_oxygen: readings.dissolvedOxygen ? parseFloat(readings.dissolvedOxygen) : undefined,
        tds: readings.tds ? parseFloat(readings.tds) : undefined,
        conductivity: readings.conductivity ? parseFloat(readings.conductivity) : undefined,
        color: readings.color,
        clarity: readings.clarity,
        foam: readings.foam,
        smell: readings.smell,
        taste: readings.taste,
        particles: readings.particles,
        type: testMethod === 'photo' ? 'photo' : 'manual',
        quality: result.overallQuality === 'Likely safe' ? 'Good' : 
                 result.overallQuality === 'Caution' ? 'Fair' : 'Poor',
        riskScore: result.riskScore,
      });

      setAnalyzing(false);
    } catch (error) {
      console.error('Error saving reading:', error);
      Alert.alert(t('waterImageAnalysis.error'), t('waterImageAnalysis.saveFailed'));
      setAnalyzing(false);
    }
  };

  const getQualityVariant = (quality: WaterAnalysisResult['overallQuality']): 'safe' | 'warning' | 'danger' => {
    if (quality === 'Safe to drink') return 'safe';
    if (quality === 'Caution') return 'warning';
    return 'danger';
  };

  const handleContactClinic = () => {
    router.push('/contact-clinic');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <AquaCard style={styles.formCard}>
            <ThemedText style={styles.title}>{t('readings.testYourWater')}</ThemedText>
            
            <SourcePicker onSelect={setSelectedSource} />
            
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>{t('readings.testMethod')}</ThemedText>
              <View style={styles.methodGrid}>
                {testMethods.map((method) => (
                  <AquaCard
                    key={method.key}
                    style={[
                      styles.methodCard,
                      testMethod === method.key && styles.methodCardActive
                    ]}
                    onPress={() => {
                      console.log('Method selected:', method.key);
                      setTestMethod(method.key);
                    }}
                  >
                    <IconSymbol 
                      name={method.icon} 
                      size={24} 
                      color={testMethod === method.key ? '#FFFFFF' : AquaColors.primary} 
                    />
                    <ThemedText style={[
                      styles.methodText,
                      testMethod === method.key && styles.methodTextActive
                    ]}>
                      {method.label}
                    </ThemedText>
                  </AquaCard>
                ))}
              </View>
            </View>

            {testMethod === 'photo' && (
              <View style={styles.inputGroup}>
                <ThemedText style={styles.sectionTitle}>{t('readings.photoAnalysis')}</ThemedText>
                
                {!selectedImage ? (
                  <View style={styles.imagePickerContainer}>
                    <AquaCard 
                      style={styles.imagePlaceholder}
                      onPress={pickImage}
                    >
                      <IconSymbol name="camera.fill" size={32} color={AquaColors.light} />
                      <ThemedText style={styles.placeholderText}>{t('waterImageAnalysis.takeOrSelectPhoto')}</ThemedText>
                    </AquaCard>
                    
                    <View style={styles.imageButtonRow}>
                      <AquaButton
                        title={t('waterImageAnalysis.takePhoto')}
                        variant="primary"
                        onPress={takePhoto}
                        style={styles.imageButton}
                      />
                      <AquaButton
                        title={t('waterImageAnalysis.chooseImage')}
                        variant="secondary"
                        onPress={pickImage}
                        style={styles.imageButton}
                      />
                    </View>
                  </View>
                ) : (
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
                    
                    <View style={styles.imageActions}>
                      <AquaButton
                        title={t('waterImageAnalysis.changePhoto')}
                        variant="outline"
                        onPress={() => {
                          setSelectedImage(null);
                          setAnalysisResults(null);
                        }}
                        style={styles.imageButton}
                      />
                      <AquaButton
                        title={analyzing ? t('waterImageAnalysis.analyzing') : t('waterImageAnalysis.analyzeWater')}
                        variant="primary"
                        onPress={analyzePhoto}
                        disabled={analyzing}
                        style={styles.imageButton}
                      />
                    </View>
                    
                    {analyzing && (
                      <View style={styles.analyzingRow}>
                        <ActivityIndicator size="small" color={AquaColors.primary} />
                        <ThemedText style={styles.analyzingText}>
                          {t('assistant.analyzing')}
                        </ThemedText>
                      </View>
                    )}

                    {analysisResults && !analyzing && (
                      <AquaCard style={styles.resultsCard}>
                        <ThemedText style={styles.resultsTitle}>
                          {t('assistant.analysisTitle')}
                        </ThemedText>

                        <View style={styles.assistantBubble}>
                          <ThemedText style={styles.assistantLabel}>{t('assistant.name')}</ThemedText>
                          <ThemedText style={styles.assistantText}>
                            {t('assistant.photoAnalysisResult')}
                          </ThemedText>
                        </View>

                        {/* Show the analyzed image if available for photo analysis */}
                        {selectedImage && (
                          <View style={styles.resultImageContainer}>
                            <ThemedText style={styles.resultImageLabel}>{t('waterImageAnalysis.analyzedImage')}</ThemedText>
                            <Image source={{ uri: selectedImage }} style={styles.resultImage} />
                          </View>
                        )}

                        <View style={styles.qualityRow}>
                          <ThemedText style={styles.qualityLabel}>{t('waterImageAnalysis.overallQuality')}</ThemedText>
                          <AquaBadge
                            text={analysisResults.overallQuality}
                            variant={getQualityVariant(analysisResults.overallQuality)}
                          />
                        </View>

                        <View style={styles.resultRow}>
                          <ThemedText style={styles.resultLabel}>{t('assistant.riskScore')}</ThemedText>
                          <ThemedText style={styles.resultValue}>
                            {analysisResults.riskScore}/100
                          </ThemedText>
                        </View>

                        <View style={styles.resultRow}>
                          <ThemedText style={styles.resultLabel}>{t('assistant.confidence')}</ThemedText>
                          <ThemedText style={styles.resultValue}>
                            {analysisResults.confidence}%
                          </ThemedText>
                        </View>

                        {analysisResults.issues.length > 0 && (
                          <>
                            <ThemedText style={styles.sectionTitle}>
                              {t('assistant.issuesTitle')}
                            </ThemedText>
                            {analysisResults.issues.map((issue, index) => (
                              <View key={issue.id ?? index} style={styles.issueRow}>
                                <IconSymbol
                                  name={
                                    issue.severity === 'danger'
                                      ? 'exclamationmark.triangle.fill'
                                      : issue.severity === 'warning'
                                      ? 'exclamationmark.circle.fill'
                                      : 'info.circle.fill'
                                  }
                                  size={18}
color={
                            issue.severity === 'danger'
                              ? AquaColors.status.danger
                              : issue.severity === 'warning'
                              ? AquaColors.status.warning
                              : AquaColors.secondary
                          }
                                />
                                <ThemedText style={styles.issueText}>{issue.message}</ThemedText>
                              </View>
                            ))}
                          </>
                        )}

                        {analysisResults.recommendations.length > 0 && (
                          <>
                            <ThemedText style={styles.sectionTitle}>
                              {t('assistant.nextStepsTitle')}
                            </ThemedText>
                            {analysisResults.recommendations.map((rec, index) => (
                              <View key={index} style={styles.recommendationRow}>
                                <IconSymbol
                                  name="checkmark.circle.fill"
                                  size={18}
                                  color={AquaColors.quality.good}
                                />
                                <ThemedText style={styles.recommendationText}>{rec}</ThemedText>
                              </View>
                            ))}
                          </>
                        )}

                        <ThemedText style={styles.disclaimerText}>
                          {t('assistant.analysisDisclaimer')}
                        </ThemedText>

                        <AquaCard style={styles.ctaCard}>
                          <ThemedText style={styles.ctaTitle}>
                            {t('waterImageAnalysis.certifiedTestTitle')}
                          </ThemedText>
                          <ThemedText style={styles.ctaBody}>
                            {t('waterImageAnalysis.certifiedTestBody')}
                          </ThemedText>
                          <AquaButton
                            title={t('waterImageAnalysis.contactWaterCliniq')}
                            variant="primary"
                            onPress={handleContactClinic}
                            style={styles.ctaButton}
                          />
                        </AquaCard>
                      </AquaCard>
                    )}
                  </View>
                )}
              </View>
            )}

            {testMethod === 'manual' && (
              <>
                <ThemedText style={styles.sectionTitle}>{t('readings.visualObservations')}</ThemedText>
                <ThemedText style={styles.manualNote}>
                  {t('waterImageAnalysis.manualObserveNote')}
                </ThemedText>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>{t('readings.waterColor')}</ThemedText>
                  <View style={styles.visualGrid}>
                    {colorOptions.map((option) => (
                      <VisualOptionCard
                        key={option.key}
                        option={option.key}
                        label={option.label}
                        icon={option.icon}
                        color={option.color}
                        selected={readings.color === option.key}
                        onPress={() => setReadings({...readings, color: option.key})}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>{t('readings.waterClarity')}</ThemedText>
                  <View style={styles.visualGrid}>
                    {clarityOptions.map((option) => (
                      <VisualOptionCard
                        key={option.key}
                        option={option.key}
                        label={option.label}
                        icon={option.icon}
                        color={option.color}
                        selected={readings.clarity === option.key}
                        onPress={() => setReadings({...readings, clarity: option.key})}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>{t('readings.foam')}</ThemedText>
                  <View style={styles.visualGrid}>
                    {foamOptions.map((option) => (
                      <VisualOptionCard
                        key={option.key}
                        option={option.key}
                        label={option.label}
                        icon={option.icon}
                        color={option.color}
                        selected={readings.foam === option.key}
                        onPress={() => setReadings({...readings, foam: option.key})}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>{t('readings.particles')}</ThemedText>
                  <View style={styles.visualGrid}>
                    {particlesOptions.map((option) => (
                      <VisualOptionCard
                        key={option.key}
                        option={option.key}
                        label={option.label}
                        icon={option.icon}
                        color={option.color}
                        selected={readings.particles === option.key}
                        onPress={() => setReadings({...readings, particles: option.key})}
                      />
                    ))}
                  </View>
                </View>

                <ThemedText style={styles.sectionTitle}>{t('readings.sensoryObservations')}</ThemedText>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>{t('readings.smell')}</ThemedText>
                  <View style={styles.visualGrid}>
                    {smellOptions.map((option) => (
                      <VisualOptionCard
                        key={option.key}
                        option={option.key}
                        label={option.label}
                        icon={option.icon}
                        color={option.color}
                        selected={readings.smell === option.key}
                        onPress={() => setReadings({...readings, smell: option.key})}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>{t('readings.taste')}</ThemedText>
                  <View style={styles.visualGrid}>
                    {tasteOptions.map((option) => (
                      <VisualOptionCard
                        key={option.key}
                        option={option.key}
                        label={option.label}
                        icon={option.icon}
                        color={option.color}
                        selected={readings.taste === option.key}
                        onPress={() => setReadings({...readings, taste: option.key})}
                      />
                    ))}
                  </View>
                </View>
              </>
            )}

            {!analysisResults && (
              <View style={styles.buttonRow}>
                <AquaButton
                  title={t('common.cancel')}
                  variant="outline"
                  onPress={() => router.back()}
                  style={styles.button}
                />
                <AquaButton
                  title={t('readings.submitReading')}
                  variant="primary"
                  onPress={handleSubmit}
                  disabled={analyzing}
                  style={styles.button}
                />
              </View>
            )}

            {analyzing && (
              <AquaCard style={styles.resultsCard}>
                <View style={styles.analyzingRow}>
                  <IconSymbol name="hourglass" size={24} color={AquaColors.primary} />
                  <ThemedText style={styles.analyzingText}>
                    {t('waterImageAnalysis.analyzingWaterQuality')}
                  </ThemedText>
                </View>
              </AquaCard>
            )}

            {analysisResults && !analyzing && (
              <AquaCard style={styles.resultsCard}>
                <View style={styles.assistantBubble}>
                  <ThemedText style={styles.assistantLabel}>{t('waterImageAnalysis.aquaAssistant')}</ThemedText>
                  <ThemedText style={styles.assistantText}>
                    {t('assistant.manualAnalysisResult')}
                  </ThemedText>
                </View>

                {/* Show the analyzed image if available */}
                {selectedImage && (
                  <View style={styles.resultImageContainer}>
                    <ThemedText style={styles.resultImageLabel}>{t('waterImageAnalysis.analyzedImage')}</ThemedText>
                    <Image source={{ uri: selectedImage }} style={styles.resultImage} />
                  </View>
                )}

                <ThemedText style={styles.resultsTitle}>{t('assistant.analysisTitle')}</ThemedText>

                <View style={styles.qualityRow}>
                  <ThemedText style={styles.resultLabel}>{t('assistant.overallQuality')}</ThemedText>
                  <AquaBadge
                    text={analysisResults.overallQuality}
                    variant={getQualityVariant(analysisResults.overallQuality)}
                  />
                </View>

                <View style={styles.resultRow}>
                  <ThemedText style={styles.resultLabel}>{t('assistant.riskScore')}</ThemedText>
                  <ThemedText style={styles.resultValue}>
                    {analysisResults.riskScore}/100
                  </ThemedText>
                </View>

                <View style={styles.resultRow}>
                  <ThemedText style={styles.resultLabel}>{t('assistant.confidence')}</ThemedText>
                  <ThemedText style={styles.resultValue}>
                    {analysisResults.confidence}%
                  </ThemedText>
                </View>

                {analysisResults.issues.length > 0 && (
                  <>
                    <ThemedText style={styles.sectionTitle}>{t('assistant.probableIssues')}</ThemedText>
                    {analysisResults.issues.map((issue, index) => (
                      <View key={issue.id ?? index} style={styles.issueRow}>
                        <IconSymbol
                          name={
                            issue.severity === 'danger'
                              ? 'exclamationmark.triangle.fill'
                              : issue.severity === 'warning'
                              ? 'exclamationmark.circle.fill'
                              : 'info.circle.fill'
                          }
                          size={18}
                          color={
                            issue.severity === 'danger'
                              ? AquaColors.status.danger
                              : issue.severity === 'warning'
                              ? AquaColors.status.warning
                              : AquaColors.status.info
                          }
                        />
                        <ThemedText style={styles.issueText}>{issue.message}</ThemedText>
                      </View>
                    ))}
                  </>
                )}

                <ThemedText style={styles.sectionTitle}>{t('assistant.recommendations')}</ThemedText>
                {analysisResults.recommendations.map((rec, index) => (
                  <View key={index} style={styles.recommendationRow}>
                    <IconSymbol
                      name="checkmark.circle.fill"
                      size={18}
                      color={AquaColors.primary}
                    />
                    <ThemedText style={styles.recommendationText}>{rec}</ThemedText>
                  </View>
                ))}

                <ThemedText style={styles.disclaimerText}>
                  {t('assistant.disclaimer')}
                </ThemedText>

                <AquaCard style={styles.ctaCard}>
                  <ThemedText style={styles.ctaTitle}>
                    {t('waterImageAnalysis.certifiedTestTitle')}
                  </ThemedText>
                  <ThemedText style={styles.ctaBody}>
                    {t('waterImageAnalysis.certifiedTestBody')}
                  </ThemedText>
                  <AquaButton
                    title={t('waterImageAnalysis.contactWaterCliniq')}
                    variant="primary"
                    onPress={handleContactClinic}
                    style={styles.ctaButton}
                  />
                </AquaCard>

                <View style={styles.buttonRow}>
                  <AquaButton
                    title={t('assistant.newAnalysis')}
                    variant="outline"
                    onPress={() => {
                      setAnalysisResults(null);
                      setAnalyzing(false);
                    }}
                    style={styles.button}
                  />
                  <AquaButton
                    title={t('assistant.done')}
                    variant="primary"
                    onPress={() => router.back()}
                    style={styles.button}
                  />
                </View>
              </AquaCard>
            )}
          </AquaCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AquaColors.primary,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
    paddingTop: Spacing.xl,
  },
  formCard: {
    padding: Spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AquaColors.primary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: AquaColors.dark,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    letterSpacing: 0.2,
  },
  issueRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  issueText: {
    fontSize: 14,
    color: '#FFFFFF', // White text for better contrast on dark background
    marginLeft: Spacing.sm,
    flex: 1,
    lineHeight: 20,
  },
  recommendationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  recommendationText: {
    fontSize: 14,
    color: '#FFFFFF', // White text for better contrast on dark background
    marginLeft: Spacing.sm,
    flex: 1,
    lineHeight: 20,
    fontWeight: '400',
  },
  disclaimerText: {
    fontSize: 11,
    color: '#FFFFFF', // White text for better contrast on dark background
    fontStyle: 'italic',
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    textAlign: 'center',
    lineHeight: 16,
  },
  ctaCard: {
    marginTop: Spacing.md,
    backgroundColor: '#FFFFFF', // White background for better contrast
    borderWidth: 2,
    borderColor: AquaColors.primary,
    borderRadius: 16,
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AquaColors.primary,
    marginBottom: Spacing.sm,
    letterSpacing: 0.3,
  },
  ctaBody: {
    fontSize: 14,
    color: '#333333', // Dark text for better contrast on white background
    marginBottom: Spacing.md,
    lineHeight: 20,
    fontWeight: '400',
  },
  ctaButton: {
    marginTop: Spacing.xs,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF', // White text for better contrast on dark background
    marginBottom: Spacing.xs,
  },
  paramLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF', // White text for better contrast on dark background
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: AquaColors.light,
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: 16,
    color: '#FFFFFF', // White text for better contrast on dark background
    backgroundColor: lightTheme.surface,
  },
  methodGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  methodCard: {
    flex: 0.3,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    backgroundColor: lightTheme.surface,
  },
  methodCardActive: {
    backgroundColor: AquaColors.primary,
  },
  methodText: {
    fontSize: 12,
    color: AquaColors.primary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  methodTextActive: {
    color: '#FFFFFF',
  },
  imagePickerContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  imagePlaceholder: {
    width: 200,
    height: 120,
    backgroundColor: lightTheme.background,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: AquaColors.light,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
placeholderText: {
    fontSize: 12,
    color: AquaColors.primary,
    marginTop: Spacing.xs,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  selectedImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  imageButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  imageButton: {
    flex: 0.48,
  },
  resultImageContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.md,
  },
  resultImageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  resultImage: {
    width: 150,
    height: 112,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  parameterGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  parameterInput: {
    flex: 0.48,
  },
  visualGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  button: {
    flex: 0.48,
  },
  sourceGrid: {
    flexDirection: 'column',
    gap: Spacing.sm,
  },
  sourceBadge: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
  },
  createSourceButton: {
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
  },
  newSourceForm: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: lightTheme.background,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AquaColors.primary,
    marginBottom: Spacing.md,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginVertical: Spacing.md,
  },
  typeBadge: {
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  formButton: {
    flex: 0.48,
  },
  resultsCard: {
    marginTop: Spacing.lg,
    backgroundColor: lightTheme.surface,
    width: '100%',
    borderWidth: 1.5,
    borderColor: AquaColors.light,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  resultsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: AquaColors.primary,
    marginBottom: Spacing.md,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  assistantBubble: {
    backgroundColor: lightTheme.background,
    borderRadius: 20,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1.5,
    borderColor: AquaColors.light,
    shadowColor: AquaColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  assistantLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: AquaColors.primary,
    marginBottom: Spacing.xs,
    letterSpacing: 0.3,
  },
  assistantText: {
    fontSize: 15,
    color: lightTheme.text,
    lineHeight: 22,
    fontWeight: '400',
  },
  analyzingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  analyzingText: {
    fontSize: 15,
    color: lightTheme.text,
    marginLeft: Spacing.sm,
    fontWeight: '500',
  },
  confidenceContainer: {
    backgroundColor: AquaColors.light,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: AquaColors.primary,
  },
  qualitySection: {
    marginBottom: Spacing.md,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  resultLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF', // White text for better contrast on dark background
  },
  resultValue: {
    fontSize: 15,
    fontWeight: '700',
    color: AquaColors.primary,
  },
  qualityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  qualityLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF', // White text for better contrast on dark background
  },
  riskScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AquaColors.primary,
  },
  detectionSection: {
    marginBottom: Spacing.md,
  },
  detectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AquaColors.dark,
    marginBottom: Spacing.sm,
  },
  detectionGrid: {
    backgroundColor: lightTheme.background,
    padding: Spacing.sm,
    borderRadius: 8,
  },
  detectionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  detectionLabel: {
    fontSize: 14,
    color: lightTheme.text,
  },
  detectionValue: {
    fontSize: 14,
    fontWeight: '500',
    color: AquaColors.primary,
  },
  parametersSection: {
    marginBottom: Spacing.md,
  },
  parametersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AquaColors.dark,
    marginBottom: Spacing.sm,
  },
  parametersList: {
    backgroundColor: lightTheme.background,
    padding: Spacing.sm,
    borderRadius: 8,
  },
  parameterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  parameterLabel: {
    fontSize: 14,
    color: lightTheme.text,
  },
  parameterValue: {
    fontSize: 14,
    fontWeight: '500',
    color: AquaColors.primary,
  },
  recommendationsSection: {
    marginBottom: Spacing.sm,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AquaColors.dark,
    marginBottom: Spacing.sm,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  recommendationText: {
    fontSize: 14,
    color: '#6C757D',
    marginLeft: Spacing.sm,
    flex: 1,
    lineHeight: 20,
  },
  technicalNote: {
    fontSize: 12,
    color: AquaColors.secondary,
    fontStyle: 'italic',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  manualNote: {
    fontSize: 12,
    color: AquaColors.secondary,
    fontStyle: 'italic',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  pendingContainer: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  pendingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AquaColors.primary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  pendingMessage: {
    fontSize: 14,
    color: lightTheme.text,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  pendingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: Spacing.sm,
  },
  pendingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: lightTheme.text,
  },
  pendingValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: AquaColors.primary,
  },
  pendingNote: {
    fontSize: 12,
    color: AquaColors.secondary,
    textAlign: 'center',
    marginTop: Spacing.md,
    fontStyle: 'italic',
  },
});