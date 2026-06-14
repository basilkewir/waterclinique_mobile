import '@/config/i18n';
import { AuthProvider, useProtectedRoute } from '@/contexts/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

function RootNavigator() {
  useProtectedRoute();
  const insets = useSafeAreaInsets();

  return (
    <>
      <StatusBar style="dark" />
      {Platform.OS === 'android' && <View style={[styles.androidStatusBarBg, { height: insets.top }]} />}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth/login" options={{ presentation: 'modal' }} />
        <Stack.Screen name="auth/register" options={{ presentation: 'modal' }} />
        <Stack.Screen name="auth/forgot-password" options={{ presentation: 'modal' }} />
        <Stack.Screen name="auth/reset-password" options={{ presentation: 'modal' }} />
        <Stack.Screen name="analysis-result" />
        <Stack.Screen name="water-cliniq-analysis" />
        <Stack.Screen name="water-image-analysis" />
        <Stack.Screen name="leakage-detection" />
        <Stack.Screen name="community-map" />
        <Stack.Screen name="new-reading" />
        <Stack.Screen name="new-reading-integrated" />
        <Stack.Screen name="alerts" />
        <Stack.Screen name="add-source" />
        <Stack.Screen name="source-details" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="contact-clinic" />
        <Stack.Screen name="contact" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  androidStatusBarBg: {
    backgroundColor: '#fff',
  },
});

export default function RootLayout() {
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const { initSentry } = require('@/services/sentry');
    initSentry();
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
