import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { NotificationProvider } from '@/components/ui/NotificationProvider';
import { TopBar } from '@/components/ui/TopBar';
import { OfflineBanner } from '@/components/OfflineBanner';
import { AquaColors } from '@/constants/theme-constants';

import '@/config/i18n';

export default function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <NotificationProvider>
      <OfflineBanner />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: AquaColors.primary,
          tabBarInactiveTintColor: AquaColors.gray,
          tabBarStyle: {
            backgroundColor: AquaColors.white,
            borderTopColor: AquaColors.border,
            borderTopWidth: 1,
            paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom, 8) : Math.max(insets.bottom, 4),
            paddingTop: 6,
            height: Platform.OS === 'android' ? 64 + Math.max(insets.bottom, 0) : 52 + Math.max(insets.bottom, 0),
            elevation: 4,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.06,
            shadowRadius: 6,
          },
          headerShown: true,
          header: () => <TopBar />,
          tabBarButton: HapticTab,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: 2,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            headerShown: false,
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="house.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="analyze"
          options={{
            title: 'Test Water',
            headerShown: false,
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="microscope" color={color} />,
          }}
        />
        <Tabs.Screen
          name="results"
          options={{
            title: 'My Results',
            headerShown: false,
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="chart.bar.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="sources"
          options={{
            title: 'Sources',
            headerShown: false,
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="drop.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="readings"
          options={{ href: null, headerShown: false }}
        />
        <Tabs.Screen
          name="alerts"
          options={{ href: null, headerShown: false }}
        />
        <Tabs.Screen
          name="settings"
          options={{ href: null, headerShown: false }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Settings',
            headerShown: false,
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="person.fill" color={color} />,
          }}
        />
      </Tabs>
    </NotificationProvider>
  );
}
