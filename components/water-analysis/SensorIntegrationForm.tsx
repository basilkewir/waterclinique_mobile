import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AquaCard, AquaButton, AquaBadge } from '@/components/ui/AquaComponents';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AquaColors, Spacing, lightTheme, BorderRadius } from '@/constants/theme-constants';
import { SensorData } from '@/services/waterAnalysisEngine';

interface SensorIntegrationFormProps {
  onSubmit: (data: SensorData) => void;
}

export const SensorIntegrationForm: React.FC<SensorIntegrationFormProps> = ({ onSubmit }) => {
  const { t } = useTranslation();
  const [connectedSensors, setConnectedSensors] = useState<any[]>([]);
  const [selectedSensor, setSelectedSensor] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [currentReadings, setCurrentReadings] = useState<any>({});
  const [readingsHistory, setReadingsHistory] = useState<any[]>([]);

  // Mock sensor data for prototype
  const mockSensors = [
    {
      id: 'sensor_001',
      name: 'pH & TDS Sensor',
      type: 'water_quality',
      deviceType: 'AquaSense Pro',
      batteryLevel: 85,
      signalStrength: 92,
      isConnected: false,
      capabilities: ['ph', 'tds', 'temperature'],
    },
    {
      id: 'sensor_002',
      name: 'Turbidity Monitor',
      type: 'turbidity',
      deviceType: 'ClearWater X1',
      batteryLevel: 67,
      signalStrength: 78,
      isConnected: false,
      capabilities: ['turbidity', 'temperature'],
    },
    {
      id: 'sensor_003',
      name: 'Multi-Parameter Probe',
      type: 'comprehensive',
      deviceType: 'HydroLab 2000',
      batteryLevel: 92,
      signalStrength: 88,
      isConnected: false,
      capabilities: ['ph', 'tds', 'temperature', 'conductivity', 'turbidity', 'dissolvedOxygen'],
    },
  ];

  useEffect(() => {
    // Initialize with mock sensors
    setConnectedSensors(mockSensors);
  }, []);

  const scanForSensors = async () => {
    setIsScanning(true);
    
    try {
      // Simulate sensor scanning
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In real app, this would use Bluetooth/WiFi scanning
      Alert.alert('Scan Complete', 'Found 3 nearby sensors');
    } catch (error) {
      Alert.alert('Scan Failed', 'Unable to scan for sensors');
    } finally {
      setIsScanning(false);
    }
  };

  const connectToSensor = async (sensor: any) => {
    try {
      // Simulate connection
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const updatedSensors = connectedSensors.map(s => 
        s.id === sensor.id ? { ...s, isConnected: true } : { ...s, isConnected: false }
      );
      setConnectedSensors(updatedSensors);
      setSelectedSensor({ ...sensor, isConnected: true });
      
      Alert.alert('Connected', `Successfully connected to ${sensor.name}`);
    } catch (error) {
      Alert.alert('Connection Failed', 'Unable to connect to sensor');
    }
  };

  const disconnectFromSensor = async () => {
    if (!selectedSensor) return;
    
    try {
      const updatedSensors = connectedSensors.map(s => 
        s.id === selectedSensor.id ? { ...s, isConnected: false } : s
      );
      setConnectedSensors(updatedSensors);
      setSelectedSensor(null);
      setCurrentReadings({});
      setReadingsHistory([]);
      
      Alert.alert('Disconnected', 'Sensor disconnected successfully');
    } catch (error) {
      Alert.alert('Disconnection Failed', 'Unable to disconnect from sensor');
    }
  };

  const startReading = async () => {
    if (!selectedSensor) return;
    
    setIsReading(true);
    
    try {
      // Simulate real-time data collection
      const readingInterval = setInterval(() => {
        const newReading = generateMockReading(selectedSensor.capabilities);
        setCurrentReadings(newReading);
        setReadingsHistory(prev => [...prev.slice(-9), newReading]); // Keep last 10 readings
      }, 1000);
      
      // Stop after 10 seconds
      setTimeout(() => {
        clearInterval(readingInterval);
        setIsReading(false);
      }, 10000);
      
    } catch (error) {
      setIsReading(false);
      Alert.alert('Reading Failed', 'Unable to read from sensor');
    }
  };

  const generateMockReading = (capabilities: string[]) => {
    const reading: any = {
      timestamp: new Date().toISOString(),
    };
    
    capabilities.forEach(capability => {
      switch (capability) {
        case 'ph':
          reading.ph = 6.5 + Math.random() * 2; // 6.5 - 8.5
          break;
        case 'tds':
          reading.tds = 200 + Math.random() * 300; // 200 - 500 ppm
          break;
        case 'temperature':
          reading.temperature = 15 + Math.random() * 15; // 15 - 30°C
          break;
        case 'conductivity':
          reading.conductivity = 400 + Math.random() * 400; // 400 - 800 μS/cm
          break;
        case 'turbidity':
          reading.turbidity = Math.random() * 5; // 0 - 5 NTU
          break;
        case 'dissolvedOxygen':
          reading.dissolvedOxygen = 5 + Math.random() * 5; // 5 - 10 mg/L
          break;
      }
    });
    
    return reading;
  };

  const submitAnalysis = () => {
    if (!selectedSensor || readingsHistory.length === 0) {
      Alert.alert('No Data', 'Please collect sensor data before submitting');
      return;
    }
    
    const sensorData: SensorData = {
      deviceId: selectedSensor.id,
      deviceType: selectedSensor.deviceType,
      readings: readingsHistory,
      batteryLevel: selectedSensor.batteryLevel,
      signalStrength: selectedSensor.signalStrength,
    };
    
    onSubmit(sensorData);
  };

  const renderSensorList = () => (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle}>Available Sensors</ThemedText>
      
      <TouchableOpacity 
        style={styles.scanButton}
        onPress={scanForSensors}
        disabled={isScanning}
      >
        <IconSymbol 
          name={isScanning ? "gear.badge" : "antenna.radiowaves.left.and.right"} 
          size={20} 
          color={AquaColors.surface} 
        />
        <ThemedText style={styles.scanButtonText}>
          {isScanning ? 'Scanning...' : 'Scan for Sensors'}
        </ThemedText>
      </TouchableOpacity>
      
      <View style={styles.sensorList}>
        {connectedSensors.map(sensor => (
          <AquaCard key={sensor.id} style={[
            styles.sensorCard,
            sensor.isConnected && styles.sensorConnected
          ]}>
            <View style={styles.sensorHeader}>
              <View style={styles.sensorInfo}>
                <ThemedText style={styles.sensorName}>{sensor.name}</ThemedText>
                <ThemedText style={styles.sensorType}>{sensor.deviceType}</ThemedText>
              </View>
              <View style={styles.sensorStatus}>
                <AquaBadge 
                  text={sensor.isConnected ? 'Connected' : 'Available'}
                  variant={sensor.isConnected ? 'safe' : 'info'}
                />
              </View>
            </View>
            
            <View style={styles.sensorDetails}>
              <View style={styles.sensorDetail}>
                <IconSymbol name="battery.100" size={16} color={AquaColors.textSecondary} />
                <ThemedText style={styles.sensorDetailText}>
                  Battery: {sensor.batteryLevel}%
                </ThemedText>
              </View>
              <View style={styles.sensorDetail}>
                <IconSymbol name="wifi" size={16} color={AquaColors.textSecondary} />
                <ThemedText style={styles.sensorDetailText}>
                  Signal: {sensor.signalStrength}%
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.capabilities}>
              <ThemedText style={styles.capabilitiesTitle}>Capabilities:</ThemedText>
              <View style={styles.capabilityTags}>
                {sensor.capabilities.map((cap: string, index: number) => (
                  <AquaBadge 
                    key={index}
                    text={cap.toUpperCase()}
                    variant="info"
                    style={styles.capabilityTag}
                  />
                ))}
              </View>
            </View>
            
            <TouchableOpacity
              style={[
                styles.connectButton,
                sensor.isConnected && styles.disconnectButton
              ]}
              onPress={() => sensor.isConnected ? disconnectFromSensor() : connectToSensor(sensor)}
            >
              <ThemedText style={styles.connectButtonText}>
                {sensor.isConnected ? 'Disconnect' : 'Connect'}
              </ThemedText>
            </TouchableOpacity>
          </AquaCard>
        ))}
      </View>
    </View>
  );

  const renderCurrentReadings = () => {
    if (!selectedSensor || Object.keys(currentReadings).length === 0) return null;
    
    return (
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Current Readings</ThemedText>
        
        <AquaCard style={styles.readingsCard}>
          <View style={styles.readingsHeader}>
            <ThemedText style={styles.readingsTitle}>Live Data</ThemedText>
            {isReading && (
              <View style={styles.readingIndicator}>
                <IconSymbol name="circle.fill" size={12} color={AquaColors.aquaMedium} />
                <ThemedText style={styles.readingText}>Reading...</ThemedText>
              </View>
            )}
          </View>
          
          <View style={styles.readingsGrid}>
            {Object.entries(currentReadings).map(([key, value]) => {
              if (key === 'timestamp') return null;
              
              return (
                <View key={key} style={styles.readingItem}>
                  <ThemedText style={styles.readingLabel}>
                    {key.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}
                  </ThemedText>
                  <ThemedText style={styles.readingValue}>
                    {typeof value === 'number' ? value.toFixed(2) : value}
                    {key === 'ph' ? '' : key === 'temperature' ? '°C' : key === 'tds' ? ' ppm' : key === 'conductivity' ? ' μS/cm' : key === 'turbidity' ? ' NTU' : key === 'dissolvedOxygen' ? ' mg/L' : ''}
                  </ThemedText>
                </View>
              );
            })}
          </View>
          
          <View style={styles.readingActions}>
            <TouchableOpacity
              style={[
                styles.startReadingButton,
                isReading && styles.stopReadingButton
              ]}
              onPress={startReading}
              disabled={isReading}
            >
              <IconSymbol 
                name={isReading ? "stop.circle.fill" : "play.circle.fill"} 
                size={20} 
                color={AquaColors.surface} 
              />
              <ThemedText style={styles.startReadingText}>
                {isReading ? 'Stop Reading' : 'Start Reading'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </AquaCard>
      </View>
    );
  };

  const renderReadingsHistory = () => {
    if (readingsHistory.length === 0) return null;
    
    return (
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Readings History ({readingsHistory.length})</ThemedText>
        
        <AquaCard style={styles.historyCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.historyContainer}>
              {readingsHistory.map((reading, index) => (
                <View key={index} style={styles.historyItem}>
                  <ThemedText style={styles.historyTime}>
                    {new Date(reading.timestamp).toLocaleTimeString()}
                  </ThemedText>
                  {Object.entries(reading).map(([key, value]) => {
                    if (key === 'timestamp') return null;
                    
                    return (
                      <View key={key} style={styles.historyReading}>
                        <ThemedText style={styles.historyLabel}>
                          {key.substring(0, 3).toUpperCase()}
                        </ThemedText>
                        <ThemedText style={styles.historyValue}>
                          {typeof value === 'number' ? value.toFixed(1) : value}
                        </ThemedText>
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
        </AquaCard>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {renderSensorList()}
        {renderCurrentReadings()}
        {renderReadingsHistory()}
        
        {selectedSensor && readingsHistory.length > 0 && (
          <View style={styles.section}>
            <AquaButton
              title="Submit Analysis"
              onPress={submitAnalysis}
              style={styles.submitButton}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.background,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.lg,
  },
  section: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AquaColors.text,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    backgroundColor: AquaColors.aquaDeep,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: AquaColors.surface,
  },
  sensorList: {
    gap: Spacing.md,
  },
  sensorCard: {
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: AquaColors.borderLight,
  },
  sensorConnected: {
    borderColor: AquaColors.aquaMedium,
    backgroundColor: AquaColors.aquaLight,
  },
  sensorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  sensorInfo: {
    flex: 1,
  },
  sensorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AquaColors.text,
  },
  sensorType: {
    fontSize: 14,
    color: AquaColors.textSecondary,
    marginTop: Spacing.xs,
  },
  sensorStatus: {
    marginLeft: Spacing.sm,
  },
  sensorDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sensorDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  sensorDetailText: {
    fontSize: 12,
    color: AquaColors.textSecondary,
  },
  capabilities: {
    marginBottom: Spacing.md,
  },
  capabilitiesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: AquaColors.text,
    marginBottom: Spacing.sm,
  },
  capabilityTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  capabilityTag: {
    marginBottom: Spacing.xs,
  },
  connectButton: {
    padding: Spacing.md,
    backgroundColor: AquaColors.aquaDeep,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  disconnectButton: {
    backgroundColor: AquaColors.error,
  },
  connectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: AquaColors.surface,
  },
  readingsCard: {
    padding: Spacing.lg,
  },
  readingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  readingsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AquaColors.text,
  },
  readingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  readingText: {
    fontSize: 12,
    color: AquaColors.aquaMedium,
  },
  readingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  readingItem: {
    width: '48%',
    padding: Spacing.sm,
    backgroundColor: AquaColors.aquaLight,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  readingLabel: {
    fontSize: 10,
    color: AquaColors.textSecondary,
    marginBottom: Spacing.xs,
  },
  readingValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AquaColors.aquaDeep,
  },
  readingActions: {
    marginTop: Spacing.md,
  },
  startReadingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    backgroundColor: AquaColors.aquaMedium,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  stopReadingButton: {
    backgroundColor: AquaColors.error,
  },
  startReadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: AquaColors.surface,
  },
  historyCard: {
    padding: Spacing.lg,
  },
  historyContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  historyItem: {
    padding: Spacing.sm,
    backgroundColor: AquaColors.aquaLight,
    borderRadius: BorderRadius.sm,
    minWidth: 120,
    alignItems: 'center',
  },
  historyTime: {
    fontSize: 10,
    color: AquaColors.textSecondary,
    marginBottom: Spacing.xs,
  },
  historyReading: {
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  historyLabel: {
    fontSize: 8,
    color: AquaColors.textSecondary,
  },
  historyValue: {
    fontSize: 12,
    fontWeight: '600',
    color: AquaColors.aquaDeep,
  },
  submitButton: {
    marginTop: Spacing.md,
  },
});
