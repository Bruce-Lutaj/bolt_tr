import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import { useAuth } from '../../src/features/auth/AuthContext';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { ErrorMessage } from '../../src/components/Feedback';
import { colors, spacing, fontSize, radius } from '../../src/theme';

type AuthMethod = 'smartuser' | 'supabase';

export default function SignInScreen() {
  const router = useRouter();
  const { login, loginWithSmartUser, enterGuest } = useAuth();

  const [authMethod, setAuthMethod] = useState<AuthMethod>('smartuser');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSignIn() {
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required');
      return;
    }
    setError('');
    setSubmitting(true);

    const err = authMethod === 'smartuser'
      ? await loginWithSmartUser(email, password)
      : await login(email, password);

    setSubmitting(false);
    if (err) { setError(err); return; }
    router.replace('/(tabs)/today');
  }

  function handleGuestSignIn() {
    enterGuest();
    router.replace('/(tabs)/today');
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.logoContainer}>
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>GT</Text>
            </View>
            <Text style={styles.title}>GymTrack</Text>
            <Text style={styles.subtitle}>Track workouts. See progress.</Text>
          </View>

          <View style={styles.tabsContainer}>
            <Pressable onPress={() => setAuthMethod('smartuser')} style={[styles.tab, authMethod === 'smartuser' && styles.tabActive]}>
              <Text style={[styles.tabText, authMethod === 'smartuser' && styles.tabTextActive]}>SmartUser</Text>
            </Pressable>
            <Pressable onPress={() => setAuthMethod('supabase')} style={[styles.tab, authMethod === 'supabase' && styles.tabActive]}>
              <Text style={[styles.tabText, authMethod === 'supabase' && styles.tabTextActive]}>Supabase</Text>
            </Pressable>
          </View>

          <View style={styles.form}>
            <Input placeholder="Email" value={email} onChangeText={setEmail} editable={!submitting} keyboardType="email-address" autoCapitalize="none" />
            <Input placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry editable={!submitting} />
            {error ? <ErrorMessage message={error} /> : null}
            <Button title="Sign In" onPress={handleSignIn} loading={submitting} disabled={submitting} />
          </View>

          <View style={styles.linkRow}>
            <Text style={styles.linkText}>Don't have an account? </Text>
            <Link href="/auth/sign-up" asChild>
              <Pressable><Text style={styles.linkAction}>Sign Up</Text></Pressable>
            </Link>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button title="Continue as Guest" onPress={handleGuestSignIn} disabled={submitting} variant="secondary" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.xl, justifyContent: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: spacing.xxl },
  logoBox: { width: 80, height: 80, borderRadius: radius.lg, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg },
  logoText: { fontSize: fontSize.xxxl, fontWeight: '700', color: colors.background },
  title: { fontSize: fontSize.xxxl, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  subtitle: { fontSize: fontSize.base, color: colors.textMuted },
  tabsContainer: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.xs, marginBottom: spacing.lg },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center', borderRadius: radius.sm },
  tabActive: { backgroundColor: colors.primaryMuted },
  tabText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textMuted },
  tabTextActive: { color: colors.primaryText },
  form: { gap: spacing.md, marginBottom: spacing.lg },
  linkRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg },
  linkText: { fontSize: fontSize.sm, color: colors.textMuted },
  linkAction: { fontSize: fontSize.sm, fontWeight: '600', color: colors.primary },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg, gap: spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.surfaceBorder },
  dividerText: { fontSize: fontSize.sm, color: colors.textMuted },
});
