import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/features/auth/AuthContext';

const colors = { background: '#0f172a', surface: '#1e293b', surfaceBorder: '#334155', primary: '#22c55e', text: '#f8fafc', textSecondary: '#94a3b8', textMuted: '#64748b', danger: '#ef4444', white: '#ffffff' };

export default function ProfileScreen() {
  const { user, isGuest, provider, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace('/auth/sign-in');
  }

  function handleSignIn() {
    logout().then(() => router.replace('/auth/sign-in'));
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.title}>Profile</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Status</Text>
          <Text style={styles.value}>
            {isGuest ? 'Guest' : provider === 'smartuser' ? 'SmartUser' : 'Signed in'}
          </Text>
        </View>

        {user && user.email ? (
          <View style={styles.card}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user.email}</Text>
          </View>
        ) : null}

        {user?.displayName ? (
          <View style={styles.card}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{user.displayName}</Text>
          </View>
        ) : null}

        {isGuest ? (
          <View style={styles.actions}>
            <Text style={styles.guestNote}>
              Guest data is stored locally on this device. Sign in to sync across devices.
            </Text>
            <Pressable onPress={handleSignIn} style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}>
              <Text style={styles.primaryBtnText}>Sign In or Create Account</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.actions}>
            <Pressable onPress={handleLogout} style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.85 }]}>
              <Text style={styles.logoutBtnText}>Sign Out</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 24 },
  card: { backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.surfaceBorder, padding: 16, marginBottom: 8 },
  label: { fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', fontWeight: '600', marginBottom: 4 },
  value: { fontSize: 15, color: colors.text, fontWeight: '500' },
  actions: { marginTop: 24 },
  guestNote: { fontSize: 13, color: colors.textSecondary, marginBottom: 16, lineHeight: 20 },
  primaryBtn: { height: 52, backgroundColor: colors.primary, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { fontSize: 15, fontWeight: '600', color: colors.white },
  logoutBtn: { height: 52, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.surfaceBorder, alignItems: 'center', justifyContent: 'center' },
  logoutBtnText: { fontSize: 15, fontWeight: '600', color: colors.danger },
});
