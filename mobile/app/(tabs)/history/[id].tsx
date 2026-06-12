import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchWorkoutById, deleteWorkout } from '../../../src/features/workouts/workoutsApi';
import { calculateTotalVolume, calculateTotalSets } from '../../../src/shared/calculations';
import { StatCard } from '../../../src/components/StatCard';
import { LoadingScreen } from '../../../src/components/Feedback';
import { formatDateLong, formatVolume } from '../../../src/shared/formatters';
import type { WorkoutWithExercises } from '../../../src/shared/types';

const colors = { background: '#0f172a', surface: '#1e293b', surfaceBorder: '#334155', text: '#f8fafc', textMuted: '#64748b', primaryText: '#4ade80', danger: '#ef4444' };

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [workout, setWorkout] = useState<WorkoutWithExercises | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchWorkoutById(id).then(({ data, error: err }) => {
      if (err) setError(err);
      if (data) setWorkout(data);
      setLoading(false);
    });
  }, [id]);

  function handleDelete() {
    if (!id) return;
    Alert.alert('Delete Workout', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const result = await deleteWorkout(id);
        if (result.error) setError(result.error);
        else router.back();
      }},
    ]);
  }

  if (loading) return <LoadingScreen />;
  if (error || !workout) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}><Text style={styles.mutedText}>{error ?? 'Workout not found'}</Text></View>
      </SafeAreaView>
    );
  }

  const sorted = [...workout.workout_exercises].sort((a, b) => a.position - b.position);
  const totalSets = calculateTotalSets(sorted);
  const totalVolume = calculateTotalVolume(sorted);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backBtn}>Back</Text>
        </Pressable>
        <Pressable onPress={handleDelete} hitSlop={12}>
          <Text style={styles.deleteBtn}>Delete</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{workout.name}</Text>
        {workout.completed_at && <Text style={styles.date}>{formatDateLong(workout.completed_at)}</Text>}

        <View style={styles.statsRow}>
          <StatCard value={sorted.length.toString()} label="Exercises" />
          <StatCard value={totalSets.toString()} label="Sets" />
          <StatCard value={formatVolume(totalVolume)} label="Volume" />
        </View>

        {sorted.map((we) => (
          <View key={we.id} style={styles.card}>
            <Text style={styles.exName}>{we.exercise_name_snapshot}</Text>
            <Text style={styles.exGroup}>{we.muscle_group_snapshot}</Text>
            <View style={styles.setsHeader}>
              <Text style={styles.setsHeaderText}>SET</Text>
              <Text style={styles.setsHeaderText}>KG</Text>
              <Text style={styles.setsHeaderText}>REPS</Text>
            </View>
            {[...we.workout_sets].sort((a, b) => a.set_number - b.set_number).map((set) => (
              <View key={set.id} style={styles.setRow}>
                <Text style={styles.setCell}>{set.set_number}</Text>
                <Text style={styles.setCellBold}>{set.weight_kg}</Text>
                <Text style={styles.setCellBold}>{set.reps}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mutedText: { fontSize: 13, color: colors.textMuted },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { fontSize: 15, color: colors.primaryText, fontWeight: '600' },
  deleteBtn: { fontSize: 13, color: colors.danger, fontWeight: '600' },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  date: { fontSize: 13, color: colors.textMuted, marginTop: 2, marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  card: { backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.surfaceBorder, padding: 16, marginBottom: 12 },
  exName: { fontSize: 15, fontWeight: '600', color: colors.text },
  exGroup: { fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', marginTop: 2, marginBottom: 12 },
  setsHeader: { flexDirection: 'row', marginBottom: 8 },
  setsHeaderText: { flex: 1, fontSize: 11, color: colors.textMuted, textAlign: 'center', fontWeight: '600' },
  setRow: { flexDirection: 'row', paddingVertical: 4 },
  setCell: { flex: 1, fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  setCellBold: { flex: 1, fontSize: 15, color: colors.text, textAlign: 'center', fontWeight: '600' },
});
