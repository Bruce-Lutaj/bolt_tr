import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/features/auth/AuthContext';
import { fetchRecentWorkouts, fetchWeeklyWorkoutCount, fetchTotalWorkoutCount, fetchTotalVolume } from '../../src/features/workouts/workoutsApi';
import { loadDraft } from '../../src/features/workouts/draftStore';
import { StatCard } from '../../src/components/StatCard';
import { LoadingScreen, EmptyState, ErrorMessage } from '../../src/components/Feedback';
import { formatDate, formatVolume } from '../../src/shared/formatters';
import type { Workout } from '../../src/shared/types';

const colors = { background: '#0f172a', surface: '#1e293b', surfaceBorder: '#334155', surfaceHover: '#283548', primary: '#22c55e', primaryText: '#4ade80', text: '#f8fafc', textMuted: '#64748b', warning: '#f59e0b', warningMuted: 'rgba(245,158,11,0.1)', white: '#ffffff' };

export default function TodayScreen() {
  const { user, isGuest, provider } = useAuth();
  const router = useRouter();
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([]);
  const [stats, setStats] = useState({ thisWeek: 0, total: 0, volume: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
        const [workoutsRes, weekRes, totalRes, volRes, draft] = await Promise.all([
          fetchRecentWorkouts(3), fetchWeeklyWorkoutCount(), fetchTotalWorkoutCount(), fetchTotalVolume(), loadDraft(),
        ]);
        const errors: string[] = [];
        if (workoutsRes.error) errors.push(workoutsRes.error);
        if (weekRes.error) errors.push(weekRes.error);
        if (errors.length > 0) setError(errors.join('. '));
        else setError(null);
        if (workoutsRes.data) setRecentWorkouts(workoutsRes.data);
        setStats({ thisWeek: weekRes.data, total: totalRes.data, volume: volRes.data });
        setHasDraft(draft !== null);
        setLoading(false);
      })();
    }, [])
  );

  const subtitle = isGuest ? 'Guest mode' : provider === 'smartuser' ? 'SmartUser account' : (user?.displayName || user?.email || '');

  if (loading) return <LoadingScreen />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>GymTrack</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        {error && <ErrorMessage message={error} />}

        {hasDraft ? (
          <Pressable onPress={() => router.push('/(tabs)/workouts')} style={({ pressed }) => [styles.draftBanner, pressed && { opacity: 0.85 }]}>
            <View style={styles.draftIcon}><Text style={styles.draftIconText}>{'>'}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.draftTitle}>Workout in progress</Text>
              <Text style={styles.draftSub}>Tap to continue</Text>
            </View>
          </Pressable>
        ) : (
          <Pressable onPress={() => router.push('/(tabs)/workouts')} style={({ pressed }) => [styles.startBtn, pressed && { opacity: 0.85 }]}>
            <Text style={styles.startBtnText}>Start Workout</Text>
          </Pressable>
        )}

        <View style={styles.statsRow}>
          <StatCard value={stats.thisWeek.toString()} label="This Week" />
          <StatCard value={stats.total.toString()} label="Total" />
          <StatCard value={formatVolume(stats.volume)} label="Volume" />
        </View>

        <Text style={styles.sectionTitle}>Recent Workouts</Text>
        {recentWorkouts.length === 0 ? (
          <EmptyState message="No workouts yet. Start your first one!" />
        ) : (
          recentWorkouts.map((w) => (
            <Pressable key={w.id} onPress={() => router.push(`/(tabs)/history/${w.id}`)}
              style={({ pressed }) => [styles.workoutCard, pressed && { backgroundColor: colors.surfaceHover }]}>
              <Text style={styles.workoutName}>{w.name}</Text>
              <Text style={styles.workoutDate}>{w.completed_at ? formatDate(w.completed_at) : ''}</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 32 },
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  draftBanner: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: colors.warningMuted, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', marginBottom: 24 },
  draftIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: 'rgba(245,158,11,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  draftIconText: { fontSize: 17, color: colors.warning, fontWeight: '700' },
  draftTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  draftSub: { fontSize: 11, color: colors.warning, marginTop: 2 },
  startBtn: { height: 56, backgroundColor: colors.primary, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  startBtnText: { fontSize: 17, fontWeight: '700', color: colors.white },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  sectionTitle: { fontSize: 11, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  workoutCard: { backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.surfaceBorder, padding: 16, marginBottom: 8 },
  workoutName: { fontSize: 15, fontWeight: '600', color: colors.text },
  workoutDate: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
});
