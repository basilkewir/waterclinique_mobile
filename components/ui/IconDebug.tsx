import React from 'react';
import { View, Text, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// Simple icon component for testing
export function SimpleIcon({ name, size = 24, color }: { name: string; size?: number; color: string }) {
  console.log(`SimpleIcon: ${name} on ${Platform.OS}`);
  
  try {
    return <MaterialIcons name={name as any} size={size} color={color} />;
  } catch (error) {
    console.error(`Error rendering icon ${name}:`, error);
    return <Text style={{ color, fontSize: size }}>?</Text>;
  }
}

// Test component
export default function IconDebug() {
  return (
    <View style={{ padding: 20 }}>
      <Text>Icon Debug - Platform: {Platform.OS}</Text>
      
      <View style={{ marginVertical: 20 }}>
        <Text>Direct MaterialIcons:</Text>
        <View style={{ flexDirection: 'row', gap: 20, marginTop: 10 }}>
          <SimpleIcon name="home" color="#000" />
          <SimpleIcon name="add-circle" color="#000" />
          <SimpleIcon name="schedule" color="#000" />
          <SimpleIcon name="person" color="#000" />
        </View>
      </View>

      <View style={{ marginVertical: 20 }}>
        <Text>IconSymbol component:</Text>
        <IconSymbol name="house.fill" color="#000" />
        <IconSymbol name="plus.circle.fill" color="#000" />
        <IconSymbol name="clock.fill" color="#000" />
        <IconSymbol name="person.fill" color="#000" />
      </View>
    </View>
  );
}

// Import the original IconSymbol for comparison
import { IconSymbol } from './icon-symbol';
