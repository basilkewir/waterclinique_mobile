import React from 'react';
import { View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function IconTest() {
  return (
    <View style={{ padding: 20 }}>
      <Text>Icon Test - Material Icons</Text>
      <View style={{ flexDirection: 'row', gap: 20, marginTop: 20 }}>
        <MaterialIcons name="home" size={24} color="#000" />
        <MaterialIcons name="add-circle" size={24} color="#000" />
        <MaterialIcons name="schedule" size={24} color="#000" />
        <MaterialIcons name="person" size={24} color="#000" />
        <MaterialIcons name="warning" size={24} color="#000" />
        <MaterialIcons name="camera-alt" size={24} color="#000" />
        <MaterialIcons name="water-drop" size={24} color="#000" />
        <MaterialIcons name="help" size={24} color="#000" />
      </View>
      <Text style={{ marginTop: 20 }}>If you see icons above, MaterialIcons are working!</Text>
    </View>
  );
}
