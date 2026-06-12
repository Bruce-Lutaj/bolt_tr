import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProviderComponent } from '../src/features/auth/AuthContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProviderComponent>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0f172a' }, animation: 'fade' }} />
      </AuthProviderComponent>
    </SafeAreaProvider>
  );
}
