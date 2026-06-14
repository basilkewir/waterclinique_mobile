import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Alert } from 'react-native';
import { CameraView, useCameraPermissions, FlashMode } from 'expo-camera';
import { IconSymbol } from './icon-symbol';
import * as ImageManipulator from 'expo-image-manipulator';

interface CustomCameraProps {
  onCapture: (uri: string) => void;
  onClose: () => void;
  mode?: 'water' | 'pipe' | 'environment';
}

const GUIDE_LABELS: Record<string, { title: string; subtitle: string }> = {
  water: {
    title: 'Position Glass in Frame',
    subtitle: 'Place a clear glass cup filled with water inside the white guide. Ensure good lighting.',
  },
  pipe: {
    title: 'Photograph Pipe',
    subtitle: 'Capture the pipe, tap, or infrastructure clearly in the frame.',
  },
  environment: {
    title: 'Capture Surroundings',
    subtitle: 'Show the area around the water source for environmental context.',
  },
};

export default function CustomCamera({ onCapture, onClose, mode = 'water' }: CustomCameraProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [capturing, setCapturing] = useState(false);
  const [flash, setFlash] = useState<FlashMode>('off');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const guide = GUIDE_LABELS[mode];

  const FLASH_ICONS: Record<FlashMode, string> = {
    off: 'bolt.slash.fill',
    on: 'bolt.fill',
    auto: 'bolt.badge.a.fill',
    torch: 'flashlight.on.fill',
  };

  const cycleFlash = () => {
    setFlash(prev => (prev === 'off' ? 'on' : prev === 'on' ? 'auto' : 'off'));
  };

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const capture = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85, flash });
      if (photo?.uri) {
        const manipulated = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ resize: { width: 1200 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );
        onCapture(manipulated.uri);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    } finally {
      setCapturing(false);
    }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.permissionContainer}>
        <IconSymbol name="camera.fill" size={48} color="#0077B6" />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>We need camera access to analyze your water sample.</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Access</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn} onPress={onClose}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" autofocus="on" flash={flash}>
        <View style={styles.overlay}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <IconSymbol name="xmark" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modeLabel}>
              {mode === 'water' ? 'Water Sample' : mode === 'pipe' ? 'Pipe' : 'Environment'}
            </Text>
            <TouchableOpacity onPress={cycleFlash} style={styles.closeBtn}>
              <IconSymbol name={FLASH_ICONS[flash] as any} size={20} color={flash === 'on' ? '#facc15' : '#fff'} />
            </TouchableOpacity>
          </View>

          <Animated.View style={[styles.guideFrame, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.guideCornerTL} />
            <View style={styles.guideCornerTR} />
            <View style={styles.guideCornerBL} />
            <View style={styles.guideCornerBR} />
          </Animated.View>

          <View style={styles.guideLabelContainer}>
            <Text style={styles.guideTitle}>{guide.title}</Text>
            <Text style={styles.guideSubtitle}>{guide.subtitle}</Text>
          </View>

          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.captureBtn} onPress={capture} disabled={capturing}>
              <View style={[styles.captureInner, capturing && styles.captureInnerActive]}>
                {capturing && <IconSymbol name="arrow.triangle.2.circlepath" size={24} color="#fff" />}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const CORNER_SIZE = 30;
const CORNER_WIDTH = 4;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'space-between' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeLabel: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },

  guideFrame: {
    position: 'absolute',
    top: '25%',
    left: '10%',
    right: '10%',
    bottom: '35%',
    alignSelf: 'center',
  },
  guideCornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  guideCornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  guideCornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  guideCornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderColor: 'rgba(255,255,255,0.8)',
  },

  guideLabelContainer: {
    position: 'absolute',
    bottom: '28%',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  guideTitle: { color: '#fff', fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  guideSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 12, textAlign: 'center', lineHeight: 18 },

  bottomBar: {
    alignItems: 'center',
    paddingBottom: 48,
    paddingTop: 16,
  },
  captureBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInnerActive: {
    backgroundColor: '#0077B6',
  },

  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 32,
  },
  permissionTitle: { fontSize: 20, fontWeight: '700', color: '#0D1B2A', marginTop: 16, marginBottom: 8 },
  permissionText: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  permissionBtn: {
    backgroundColor: '#0077B6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  permissionBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  backBtn: { marginTop: 16, padding: 8 },
  backBtnText: { color: '#64748B', fontSize: 14 },
});
