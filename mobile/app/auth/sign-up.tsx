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

export default function SignUpScreen() {
  const router = useRouter();
  const { signup, signupWithSmartUser } = useAuth();

  const [authMethod, setAuthMethod] = useState<AuthMethod>('smartuser');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSignUp() {
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (authMethod === 'supabase' && !displayName.trim()) {
      setError('Display name is required');
      return;
    }

    setError('');
    setSubmitting(true);

    const err = authMethod === 'smartuser'
      ? await signupWithSmartUser(email, password)
      : await signup(email, password, displayName);

    setSubmitting(false);
    if (err) { setError(err); return; }
    router.replace('/(tabs)/today');
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start tracking your progress</Text>
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
            {authMethod === 'supabase' && (
              <Input placeholder="Display Name" value={displayName} onChangeText={setDisplayName} editable={!submitting} />
            )}
            <Input placeholder="Password (min 6 characters)" value={password} onChangeText={setPassword} secureTextEntry editable={!submitting} />
            {error ? <ErrorMessage message={error} /> : null}
            <Button title={authMethod === 'smartuser' ? 'Sign Up with SmartUser' : 'Create Account'} onPress={handleSignUp} loading={submitting} disabled={submitting} />
          </View>

          <View style={styles.linkRow}>
            <Text style={styles.linkText}>Already have an account? </Text>
            <Link href="/auth/sign-in" asChild>
              <Pressable><Text style={styles.linkAction}>Sign In</Text></Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.xl },
  header: { marginBottom: spacing.xxl },
  title: { fontSize: fontSize.xxxl, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  subtitle: { fontSize: fontSize.base, color: colors.textMuted },
  tabsContainer: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.xs, marginBottom: spacing.lg },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center', borderRadius: radius.sm },
  tabActive: { backgroundColor: colors.primaryMuted },
  tabText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textMuted },
  tabTextActive: { color: colors.primaryText },
  form: { gap: spacing.md, marginBottom: spacing.lg },
  linkRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  linkText: { fontSize: fontSize.sm, color: colors.textMuted },
  linkAction: { fontSize: fontSize.sm, fontWeight: '600', color: colors.primary },
});
