import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/features/auth/AuthContext';
import { LoadingScreen } from '../src/components/Feedback';

export default function Index() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Redirect href="/(tabs)/today" />;
  return <Redirect href="/auth/sign-in" />;
}
