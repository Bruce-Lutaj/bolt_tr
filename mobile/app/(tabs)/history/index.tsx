import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchAllWorkoutsWithSets } from '../../../src/features/workouts/workoutsApi';
import { LoadingScreen, EmptyState } from '../../../src/components/Feedback';
import { formatDateGrouped, formatVolume } from '../../../src/shared/formatters';

const colors = { background: '#0f172a', surface: '#1e293b', surfaceBorder: '#334155', surfaceHover: '#283548', text: '#f8fafc', textSecondary: '#94a3b8', textMuted: '#64748b' };

interface HistoryWorkout { id: string; name: string; completed_at: string; exerciseCount: number; setCount: number; volume: number; }

export default function HistoryIndex() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<HistoryWorkout[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchAllWorkoutsWithSets().then(({ data }) => {
        if (data) setWorkouts(data);
        setLoading(false);
      });
    }, [])
  );

  if (loading) return <LoadingScreen />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>{workouts.length} workouts logged</Text>
      </View>

      {workouts.length === 0 ? (
        <EmptyState message="No workouts completed yet" />
      ) : (
        <FlatList
          data={workouts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/(tabs)/history/${item.id}`)}
              style={({ pressed }) => [styles.card, pressed && { backgroundColor: colors.surfaceHover }]}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardDate}>{formatDateGrouped(item.completed_at)}</Text>
              <Text style={styles.cardStats}>
                {item.exerciseCount} exercises · {item.setCount} sets · {formatVolume(item.volume)} kg
              </Text>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  list: { paddingHorizontal: 20, paddingBottom: 32 },
  card: { backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.surfaceBorder, padding: 16, marginBottom: 8 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  cardDate: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  cardStats: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },
});
