import { ThemedText } from '@/components/themed-text';
import { AquaBadge, AquaButton, AquaCard } from '@/components/ui/AquaComponents';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AquaColors, Spacing, lightTheme } from '@/constants/theme-constants';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Modal, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ReadingDetailsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfUri, setPdfUri] = useState<string | null>(null);

  // Mock data - in real app, fetch by ID
  const reading = {
    id: id,
    source: 'Community Well #1',
    timestamp: '2024-01-18 14:30',
    ph: 7.2,
    turbidity: 2.1,
    chlorine: 0.8,
    temperature: 24.5,
    dissolvedOxygen: 8.2,
    tds: 150,
    conductivity: 300,
    quality: 'Good',
    riskScore: 25,
    type: 'manual',
    location: 'Douala, Cameroon',
    testedBy: 'Field Technician 1',
    recommendations: [
      'Water quality is within acceptable limits',
      'Continue regular monitoring',
      'Check chlorine levels weekly'
    ]
  };

  const generateReport = async () => {
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Water Quality Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #00CED1; padding-bottom: 20px; margin-bottom: 30px; }
        .title { color: #00CED1; font-size: 24px; font-weight: bold; margin: 0; }
        .subtitle { color: #666; margin: 5px 0; }
        .section { margin: 20px 0; }
        .section-title { color: #00CED1; font-size: 18px; font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px 0; }
        .info-item { padding: 10px; background: #f9f9f9; border-radius: 5px; }
        .label { font-weight: bold; color: #555; }
        .value { color: #00CED1; font-weight: bold; }
        .risk-score { text-align: center; font-size: 36px; color: #00CED1; font-weight: bold; }
        .recommendations li { margin: 5px 0; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="title">WATER QUALITY REPORT</h1>
        <p class="subtitle">ETAP Connect Water Quality Platform</p>
      </div>
      
      <div class="section">
        <h2 class="section-title">Source Information</h2>
        <div class="info-grid">
          <div class="info-item"><span class="label">Source:</span> ${reading.source}</div>
          <div class="info-item"><span class="label">Location:</span> ${reading.location}</div>
          <div class="info-item"><span class="label">Test Date:</span> ${reading.timestamp}</div>
          <div class="info-item"><span class="label">Tested By:</span> ${reading.testedBy}</div>
          <div class="info-item"><span class="label">Test Type:</span> ${reading.type.toUpperCase()}</div>
          <div class="info-item"><span class="label">Quality:</span> <span class="value">${reading.quality}</span></div>
        </div>
      </div>
      
      <div class="section">
        <h2 class="section-title">Water Parameters</h2>
        <div class="info-grid">
          <div class="info-item"><span class="label">pH Level:</span> <span class="value">${reading.ph}</span></div>
          <div class="info-item"><span class="label">Turbidity:</span> <span class="value">${reading.turbidity} NTU</span></div>
          <div class="info-item"><span class="label">Chlorine:</span> <span class="value">${reading.chlorine} mg/L</span></div>
          <div class="info-item"><span class="label">Temperature:</span> <span class="value">${reading.temperature}°C</span></div>
          <div class="info-item"><span class="label">Dissolved Oxygen:</span> <span class="value">${reading.dissolvedOxygen} mg/L</span></div>
          <div class="info-item"><span class="label">TDS:</span> <span class="value">${reading.tds} ppm</span></div>
        </div>
      </div>
      
      <div class="section">
        <h2 class="section-title">Risk Assessment</h2>
        <div class="risk-score">${reading.riskScore}/100</div>
      </div>
      
      <div class="section">
        <h2 class="section-title">Recommendations</h2>
        <ul class="recommendations">
          ${reading.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
      </div>
      
      <div class="footer">
        <p>Generated by ETAP Connect Water Quality Platform</p>
        <p>Report generated on ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      setPdfUri(uri);
      setShowPdfModal(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF report');
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality.toLowerCase()) {
      case 'excellent': return 'safe';
      case 'good': return 'safe';
      case 'fair': return 'warning';
      case 'poor': return 'danger';
      default: return 'danger';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen 
        options={{ 
          title: 'Reading Details',
          headerBackTitle: 'Back',
          headerStyle: {
            backgroundColor: lightTheme.background,
            height: Platform.OS === 'android' ? 100 : 60,
          } as any,
          headerTitleContainerStyle: {
            paddingTop: Platform.OS === 'android' ? 30 : 0,
          } as any,
          headerTitleStyle: {
            color: AquaColors.primary,
          },
          contentStyle: {
            paddingTop: Platform.OS === 'android' ? 20 : 0,
          }
        }} 
      />
      <ScrollView style={styles.container}>
        <View style={[styles.content, { paddingBottom: insets.bottom }]}>
          <AquaCard style={styles.headerCard}>
            <View style={styles.headerRow}>
              <View style={styles.headerInfo}>
                <ThemedText style={styles.sourceName}>{reading.source}</ThemedText>
                <ThemedText style={styles.location}>{reading.location}</ThemedText>
                <View style={styles.timestampRow}>
                  <IconSymbol 
                    name={reading.type === 'manual' ? 'hand.raised.fill' : 'sensor.fill'} 
                    size={16} 
                    color={AquaColors.secondary} 
                  />
                  <ThemedText style={styles.timestamp}>{reading.timestamp}</ThemedText>
                </View>
              </View>
              <AquaBadge 
                text={reading.quality} 
                variant={getQualityColor(reading.quality) as any}
              />
            </View>
          </AquaCard>

          <AquaCard style={styles.parametersCard}>
            <ThemedText style={styles.sectionTitle}>Water Parameters</ThemedText>
            <View style={styles.parametersGrid}>
              <View style={styles.parameterItem}>
                <IconSymbol name="drop.fill" size={20} color={AquaColors.primary} />
                <ThemedText style={styles.parameterLabel}>pH Level</ThemedText>
                <ThemedText style={styles.parameterValue}>{reading.ph}</ThemedText>
              </View>
              <View style={styles.parameterItem}>
                <IconSymbol name="eye.fill" size={20} color={AquaColors.primary} />
                <ThemedText style={styles.parameterLabel}>Turbidity</ThemedText>
                <ThemedText style={styles.parameterValue}>{reading.turbidity} NTU</ThemedText>
              </View>
              <View style={styles.parameterItem}>
                <IconSymbol name="flask.fill" size={20} color={AquaColors.primary} />
                <ThemedText style={styles.parameterLabel}>Chlorine</ThemedText>
                <ThemedText style={styles.parameterValue}>{reading.chlorine} mg/L</ThemedText>
              </View>
              <View style={styles.parameterItem}>
                <IconSymbol name="thermometer" size={20} color={AquaColors.primary} />
                <ThemedText style={styles.parameterLabel}>Temperature</ThemedText>
                <ThemedText style={styles.parameterValue}>{reading.temperature}°C</ThemedText>
              </View>
              <View style={styles.parameterItem}>
                <IconSymbol name="wind" size={20} color={AquaColors.primary} />
                <ThemedText style={styles.parameterLabel}>Dissolved O₂</ThemedText>
                <ThemedText style={styles.parameterValue}>{reading.dissolvedOxygen} mg/L</ThemedText>
              </View>
              <View style={styles.parameterItem}>
                <IconSymbol name="chart.bar.fill" size={20} color={AquaColors.primary} />
                <ThemedText style={styles.parameterLabel}>TDS</ThemedText>
                <ThemedText style={styles.parameterValue}>{reading.tds} ppm</ThemedText>
              </View>
            </View>
          </AquaCard>

          <AquaCard style={styles.riskCard}>
            <ThemedText style={styles.sectionTitle}>Risk Assessment</ThemedText>
            <View style={styles.riskContainer}>
              <View style={styles.riskScore}>
                <ThemedText style={styles.riskNumber}>{reading.riskScore}</ThemedText>
                <ThemedText style={styles.riskOutOf}>/100</ThemedText>
              </View>
              <View style={styles.riskBar}>
                <View 
                  style={[
                    styles.riskFill, 
                    { 
                      width: `${reading.riskScore}%`,
                      backgroundColor: reading.riskScore <= 30 ? AquaColors.status.safe : 
                                     reading.riskScore <= 60 ? AquaColors.status.warning : 
                                     AquaColors.status.danger
                    }
                  ]} 
                />
              </View>
            </View>
          </AquaCard>

          <AquaCard style={styles.recommendationsCard}>
            <ThemedText style={styles.sectionTitle}>Recommendations</ThemedText>
            {reading.recommendations.map((rec, index) => (
              <View key={index} style={styles.recommendationItem}>
                <IconSymbol name="checkmark.circle.fill" size={16} color={AquaColors.primary} />
                <ThemedText style={styles.recommendationText}>{rec}</ThemedText>
              </View>
            ))}
          </AquaCard>

          <View style={styles.actionButtons}>
            <AquaButton 
              title="Generate Report" 
              onPress={generateReport} 
              variant="primary" 
              style={styles.actionButton}
            />
            <AquaButton 
              title="Share Results" 
              onPress={generateReport} 
              variant="secondary" 
              style={styles.actionButton}
            />
          </View>
        </View>
      </ScrollView>
      
      <Modal
        visible={showPdfModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Water Quality Report</ThemedText>
              <AquaButton
                title="Close"
                onPress={() => setShowPdfModal(false)}
                variant="outline"
                size="sm"
              />
            </View>
            
            <View style={styles.modalContent}>
              <ThemedText style={styles.modalSubtitle}>Report generated successfully!</ThemedText>
              <ThemedText style={styles.modalDescription}>
                Choose what you'd like to do with your water quality report:
              </ThemedText>
              
              <View style={styles.modalActions}>
                <AquaButton
                  title="Share Report"
                  onPress={async () => {
                    if (pdfUri && await Sharing.isAvailableAsync()) {
                      await Sharing.shareAsync(pdfUri);
                    }
                  }}
                  variant="primary"
                  style={styles.modalButton}
                />
                
                <AquaButton
                  title="Save to Files"
                  onPress={async () => {
                    if (pdfUri) {
                      const fileName = `WaterReport_${reading.source.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
                      const newUri = `${FileSystem.documentDirectory}${fileName}`;
                      await FileSystem.copyAsync({ from: pdfUri, to: newUri });
                      Alert.alert('Saved', `Report saved as ${fileName}`);
                    }
                  }}
                  variant="secondary"
                  style={styles.modalButton}
                />
                
                <AquaButton
                  title="Print Report"
                  onPress={async () => {
                    if (pdfUri) {
                      await Print.printAsync({ uri: pdfUri });
                    }
                  }}
                  variant="outline"
                  style={styles.modalButton}
                />
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
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
    padding: Spacing.md,
    paddingTop: Platform.OS === 'android' ? 60 : Spacing.lg,
  },
  headerCard: {
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerInfo: {
    flex: 1,
  },
  sourceName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AquaColors.textOnDark,
    marginBottom: Spacing.xs,
  },
  location: {
    fontSize: 14,
    color: lightTheme.text,
    marginBottom: Spacing.sm,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 14,
    color: AquaColors.secondary,
    marginLeft: Spacing.xs,
  },
  parametersCard: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AquaColors.textOnDark,
    marginBottom: Spacing.md,
  },
  parametersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  parameterItem: {
    width: '48%',
    backgroundColor: lightTheme.background,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.sm,
    alignItems: 'center',
  },
  parameterLabel: {
    fontSize: 12,
    color: lightTheme.icon,
    marginTop: Spacing.xs,
    marginBottom: 2,
  },
  parameterValue: {
    fontSize: 16,
    fontWeight: '600',
    color: AquaColors.textOnDark,
  },
  riskCard: {
    marginBottom: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  riskContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  riskScore: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.lg,
    justifyContent: 'center',
    minHeight: 60,
  },
  riskNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: AquaColors.white,
    lineHeight: 42,
  },
  riskOutOf: {
    fontSize: 18,
    color: lightTheme.text,
    marginLeft: 4,
    lineHeight: 22,
  },
  riskBar: {
    width: '100%',
    height: 12,
    backgroundColor: lightTheme.border,
    borderRadius: 6,
    overflow: 'hidden',
  },
  riskFill: {
    height: '100%',
    borderRadius: 6,
  },
  recommendationsCard: {
    marginBottom: Spacing.lg,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  recommendationText: {
    fontSize: 14,
    color: lightTheme.text,
    marginLeft: Spacing.sm,
    flex: 1,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  actionButton: {
    flex: 0.48,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AquaColors.textOnDark,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AquaColors.textOnDark,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: lightTheme.text,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  modalActions: {
    width: '100%',
    gap: Spacing.md,
  },
  modalButton: {
    width: '100%',
  },
});