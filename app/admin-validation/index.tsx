import { ThemedText } from '@/components/themed-text';
import { AquaBadge, AquaButton, AquaCard } from '@/components/ui/AquaComponents';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AquaColors, Spacing, lightTheme } from '@/constants/theme-constants';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminValidationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [validationData, setValidationData] = useState({
    quality: 'Good',
    riskScore: '25',
    confidence: '87',
    detectedColor: 'Clear',
    detectedClarity: 'Slightly Hazy',
    detectedParticles: 'Few Particles',
    estimatedPH: '7.1 - 7.3',
    estimatedTurbidity: '2-4 NTU',
    recommendations: 'Water appears safe for consumption\nSlight haziness detected - consider filtration\nNo visible contamination found\nRegular testing recommended'
  });

  // Mock pending submissions
  const pendingSubmissions = [
    {
      id: 'WQ_1705567890123',
      source: 'Community Well #1',
      submittedBy: 'John Doe',
      timestamp: '2024-01-18 14:30',
      imageUri: 'https://via.placeholder.com/300x200/00CED1/FFFFFF?text=Water+Sample',
      aiAnalysis: {
        detectedColor: 'Clear',
        detectedClarity: 'Slightly Hazy',
        detectedParticles: 'Few Particles',
        suggestedQuality: 'Good',
        suggestedRiskScore: 25,
        confidence: 87,
        potentialIssues: [
          'Slight turbidity detected',
          'No visible contamination',
          'Color appears normal'
        ]
      }
    }
  ];

  const [selectedSubmission] = useState(pendingSubmissions[0]);

  const handleValidate = () => {
    Alert.alert(
      'Validation Complete',
      'Analysis has been validated and sent to the user.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  const handleReject = () => {
    Alert.alert(
      'Analysis Rejected',
      'The submission has been rejected and user will be notified.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Stack.Screen 
        options={{ 
          title: 'Validate Photo Analysis',
          headerBackTitle: 'Back'
        }} 
      />
      <ScrollView style={styles.flex}>
        <View style={styles.content}>
          <AquaCard style={styles.submissionCard}>
            <View style={styles.submissionHeader}>
              <ThemedText style={styles.submissionTitle}>Submission Details</ThemedText>
              <AquaBadge text="Pending" variant="warning" />
            </View>
            
            <View style={styles.submissionInfo}>
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>ID:</ThemedText>
                <ThemedText style={styles.infoValue}>{selectedSubmission.id}</ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Source:</ThemedText>
                <ThemedText style={styles.infoValue}>{selectedSubmission.source}</ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Submitted By:</ThemedText>
                <ThemedText style={styles.infoValue}>{selectedSubmission.submittedBy}</ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Date:</ThemedText>
                <ThemedText style={styles.infoValue}>{selectedSubmission.timestamp}</ThemedText>
              </View>
            </View>
          </AquaCard>

          <AquaCard style={styles.imageCard}>
            <ThemedText style={styles.sectionTitle}>Water Sample Photo</ThemedText>
            <Image source={{ uri: selectedSubmission.imageUri }} style={styles.waterImage} />
          </AquaCard>

          <AquaCard style={styles.aiAnalysisCard}>
            <ThemedText style={styles.sectionTitle}>AI Analysis Results</ThemedText>
            
            <View style={styles.aiResults}>
              <View style={styles.aiResultRow}>
                <ThemedText style={styles.aiLabel}>Detected Color:</ThemedText>
                <ThemedText style={styles.aiValue}>{selectedSubmission.aiAnalysis.detectedColor}</ThemedText>
              </View>
              <View style={styles.aiResultRow}>
                <ThemedText style={styles.aiLabel}>Clarity:</ThemedText>
                <ThemedText style={styles.aiValue}>{selectedSubmission.aiAnalysis.detectedClarity}</ThemedText>
              </View>
              <View style={styles.aiResultRow}>
                <ThemedText style={styles.aiLabel}>Particles:</ThemedText>
                <ThemedText style={styles.aiValue}>{selectedSubmission.aiAnalysis.detectedParticles}</ThemedText>
              </View>
              <View style={styles.aiResultRow}>
                <ThemedText style={styles.aiLabel}>Suggested Quality:</ThemedText>
                <ThemedText style={styles.aiValue}>{selectedSubmission.aiAnalysis.suggestedQuality}</ThemedText>
              </View>
              <View style={styles.aiResultRow}>
                <ThemedText style={styles.aiLabel}>Risk Score:</ThemedText>
                <ThemedText style={styles.aiValue}>{selectedSubmission.aiAnalysis.suggestedRiskScore}/100</ThemedText>
              </View>
              <View style={styles.aiResultRow}>
                <ThemedText style={styles.aiLabel}>Confidence:</ThemedText>
                <ThemedText style={styles.aiValue}>{selectedSubmission.aiAnalysis.confidence}%</ThemedText>
              </View>
            </View>

            <ThemedText style={styles.issuesTitle}>Potential Issues Detected:</ThemedText>
            {selectedSubmission.aiAnalysis.potentialIssues.map((issue, index) => (
              <View key={index} style={styles.issueItem}>
                <IconSymbol name="exclamationmark.circle.fill" size={16} color={AquaColors.secondary} />
                <ThemedText style={styles.issueText}>{issue}</ThemedText>
              </View>
            ))}
          </AquaCard>

          <AquaCard style={styles.validationCard}>
            <ThemedText style={styles.sectionTitle}>Admin Validation</ThemedText>
            
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Final Quality Assessment</ThemedText>
              <TextInput
                style={styles.input}
                value={validationData.quality}
                onChangeText={(text) => setValidationData({...validationData, quality: text})}
                placeholder="Good"
              />
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <ThemedText style={styles.inputLabel}>Risk Score (0-100)</ThemedText>
                <TextInput
                  style={styles.input}
                  value={validationData.riskScore}
                  onChangeText={(text) => setValidationData({...validationData, riskScore: text})}
                  placeholder="25"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inputHalf}>
                <ThemedText style={styles.inputLabel}>Confidence (%)</ThemedText>
                <TextInput
                  style={styles.input}
                  value={validationData.confidence}
                  onChangeText={(text) => setValidationData({...validationData, confidence: text})}
                  placeholder="87"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Estimated pH Range</ThemedText>
              <TextInput
                style={styles.input}
                value={validationData.estimatedPH}
                onChangeText={(text) => setValidationData({...validationData, estimatedPH: text})}
                placeholder="7.1 - 7.3"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Estimated Turbidity</ThemedText>
              <TextInput
                style={styles.input}
                value={validationData.estimatedTurbidity}
                onChangeText={(text) => setValidationData({...validationData, estimatedTurbidity: text})}
                placeholder="2-4 NTU"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Recommendations (one per line)</ThemedText>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={validationData.recommendations}
                onChangeText={(text) => setValidationData({...validationData, recommendations: text})}
                placeholder="Enter recommendations..."
                multiline
                numberOfLines={4}
              />
            </View>
          </AquaCard>

          <View style={styles.actionButtons}>
            <AquaButton
              title="Reject Analysis"
              onPress={handleReject}
              variant="outline"
              style={styles.actionButton}
            />
            <AquaButton
              title="Validate & Send"
              onPress={handleValidate}
              variant="primary"
              style={styles.actionButton}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
  },
  submissionCard: {
    marginBottom: Spacing.md,
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  submissionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AquaColors.primary,
  },
  submissionInfo: {
    gap: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 14,
    color: lightTheme.text,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: AquaColors.primary,
  },
  imageCard: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AquaColors.dark,
    marginBottom: Spacing.md,
  },
  waterImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  aiAnalysisCard: {
    marginBottom: Spacing.md,
  },
  aiResults: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  aiResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  aiLabel: {
    fontSize: 14,
    color: lightTheme.text,
  },
  aiValue: {
    fontSize: 14,
    fontWeight: '500',
    color: AquaColors.primary,
  },
  issuesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: AquaColors.dark,
    marginBottom: Spacing.sm,
  },
  issueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  issueText: {
    fontSize: 14,
    color: lightTheme.text,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  validationCard: {
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  inputHalf: {
    flex: 0.48,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: lightTheme.text,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: AquaColors.light,
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: 14,
    color: lightTheme.text,
    backgroundColor: lightTheme.surface,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  actionButton: {
    flex: 0.48,
  },
});