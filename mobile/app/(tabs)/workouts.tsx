import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { createWorkout } from '../../src/features/workouts/workoutsApi';
import {
  loadDraft, saveDraft, clearDraft, createEmptyDraft,
  addExerciseToDraft, removeExerciseFromDraft,
  addSetToDraft, removeSetFromDraft, updateSetInDraft,
} from '../../src/features/workouts/draftStore';
import { countValidDraftSets } from '../../src/shared/calculations';
import { ExercisePicker } from '../../src/components/ExercisePicker';
import { LoadingScreen } from '../../src/components/Feedback';
import type { WorkoutDraft, Exercise } from '../../src/shared/types';

const colors = { background: '#0f172a', surface: '#1e293b', surfaceBorder: '#334155', surfaceHover: '#283548', primary: '#22c55e', primaryText: '#4ade80', text: '#f8fafc', textSecondary: '#94a3b8', textMuted: '#64748b', danger: '#ef4444', dangerMuted: 'rgba(239,68,68,0.1)', warning: '#f59e0b', white: '#ffffff' };

export default function WorkoutsScreen() {
  const [draft, setDraft] = useState<WorkoutDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [elapsed, setElapsed] = useState('00:00');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadDraft().then((d) => { setDraft(d); setLoading(false); });
    }, [])
  );

  useEffect(() => {
    if (!draft?.startedAt) return;
    const update = () => {
      const diff = Math.max(0, Math.floor((Date.now() - new Date(draft.startedAt).getTime()) / 1000));
      const hrs = Math.floor(diff / 3600);
      const mins = Math.floor((diff % 3600) / 60);
      const secs = diff % 60;
      setElapsed(hrs > 0 ? `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}` : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
    };
    update();
    intervalRef.current = setInterval(update, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [draft?.startedAt]);

  useEffect(() => {
    if (draft) saveDraft(draft);
  }, [draft]);

  function startNew() { setDraft(createEmptyDraft()); }

  function handleAddExercise(exercise: Exercise) {
    if (!draft) return;
    setDraft(addExerciseToDraft(draft, exercise));
    setShowPicker(false);
  }

  function handleRemoveExercise(entryId: string) {
    if (!draft) return;
    setDraft(removeExerciseFromDraft(draft, entryId));
  }

  function handleAddSet(entryId: string) {
    if (!draft) return;
    setDraft(addSetToDraft(draft, entryId));
  }

  function handleRemoveSet(entryId: string, setId: string) {
    if (!draft) return;
    setDraft(removeSetFromDraft(draft, entryId, setId));
  }

  function handleUpdateSet(entryId: string, setId: string, field: 'reps' | 'weight', value: string) {
    if (!draft) return;
    setDraft(updateSetInDraft(draft, entryId, setId, field, value));
  }

  function handleSetName(name: string) {
    if (!draft) return;
    setDraft({ ...draft, name });
  }

  function handleDiscard() {
    Alert.alert('Discard Workout', 'All progress will be lost.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: async () => { await clearDraft(); setDraft(null); } },
    ]);
  }

  async function handleFinish() {
    if (!draft) return;
    const validSets = countValidDraftSets(draft.exercises);
    if (validSets === 0) { setError('No valid sets to save'); return; }
    setSaving(true); setError(null);
    const name = draft.name.trim() || `Workout ${new Date().toLocaleDateString()}`;
    const result = await createWorkout(name, draft.startedAt, draft.exercises);
    setSaving(false);
    if (result.error) { setError(result.error); }
    else { await clearDraft(); setDraft(null); }
  }

  if (loading) return <LoadingScreen />;

  if (!draft) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Ready to train?</Text>
          <Text style={styles.emptySubtitle}>Start a new workout to begin logging sets</Text>
          <Pressable onPress={startNew} style={({ pressed }) => [styles.bigStartBtn, pressed && { opacity: 0.85 }]}>
            <Text style={styles.bigStartText}>Start Workout</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const validSetCount = countValidDraftSets(draft.exercises);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.toolbar}>
        <View style={{ flex: 1 }}>
          <TextInput placeholder="Workout name" placeholderTextColor={colors.textMuted}
            value={draft.name} onChangeText={handleSetName} style={styles.nameInput} />
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{elapsed}</Text>
            <Text style={styles.metaText}> · {draft.exercises.length} exercises · {validSetCount} sets</Text>
          </View>
        </View>
        <View style={styles.toolbarRight}>
          <Pressable onPress={handleDiscard} hitSlop={8} style={styles.discardBtn}>
            <Text style={styles.discardText}>X</Text>
          </Pressable>
          <Pressable onPress={handleFinish} disabled={validSetCount === 0 || saving}
            style={[styles.finishBtn, (validSetCount === 0 || saving) && { backgroundColor: colors.surfaceBorder }]}>
            <Text style={styles.finishText}>{saving ? '...' : 'Finish'}</Text>
          </Pressable>
        </View>
      </View>

      {error && <View style={styles.errorBar}><Text style={styles.errorText}>{error}</Text></View>}

      <ScrollView contentContainerStyle={styles.exerciseList} keyboardShouldPersistTaps="handled">
        {draft.exercises.length === 0 && (
          <View style={styles.emptyExercises}><Text style={styles.emptyExText}>Add exercises to start your workout</Text></View>
        )}

        {draft.exercises.map((entry) => (
          <View key={entry.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.exName}>{entry.exercise.name}</Text>
                <Text style={styles.exGroup}>{entry.exercise.muscle_group}</Text>
              </View>
              <Pressable onPress={() => handleRemoveExercise(entry.id)} hitSlop={8}>
                <Text style={styles.removeText}>Remove</Text>
              </Pressable>
            </View>

            <View style={styles.setHeaderRow}>
              <Text style={styles.setHeaderCell}>SET</Text>
              <Text style={styles.setHeaderCell}>KG</Text>
              <Text style={styles.setHeaderCell}>REPS</Text>
              <View style={{ width: 32 }} />
            </View>

            {entry.sets.map((set, idx) => (
              <View key={set.id} style={styles.setRow}>
                <Text style={styles.setNum}>{idx + 1}</Text>
                <TextInput value={set.weight} onChangeText={(v) => handleUpdateSet(entry.id, set.id, 'weight', v)}
                  placeholder="0" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" style={styles.setInput} />
                <TextInput value={set.reps} onChangeText={(v) => handleUpdateSet(entry.id, set.id, 'reps', v)}
                  placeholder="0" placeholderTextColor={colors.textMuted} keyboardType="number-pad" style={styles.setInput} />
                <Pressable onPress={() => handleRemoveSet(entry.id, set.id)} hitSlop={8}>
                  <Text style={styles.setRemoveBtn}>-</Text>
                </Pressable>
              </View>
            ))}

            <Pressable onPress={() => handleAddSet(entry.id)} style={styles.addSetBtn}>
              <Text style={styles.addSetText}>+ Add Set</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable onPress={() => setShowPicker(true)} style={({ pressed }) => [styles.addExBtn, pressed && { opacity: 0.85 }]}>
          <Text style={styles.addExText}>+ Add Exercise</Text>
        </Pressable>
      </View>

      <ExercisePicker visible={showPicker} onSelect={handleAddExercise} onClose={() => setShowPicker(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 8 },
  emptySubtitle: { fontSize: 13, color: colors.textMuted, marginBottom: 32 },
  bigStartBtn: { height: 60, paddingHorizontal: 32, backgroundColor: colors.primary, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  bigStartText: { fontSize: 17, fontWeight: '700', color: colors.white },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder },
  nameInput: { fontSize: 15, fontWeight: '600', color: colors.text, padding: 0 },
  metaRow: { flexDirection: 'row', marginTop: 2 },
  metaText: { fontSize: 11, color: colors.textMuted },
  toolbarRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  discardBtn: { padding: 8 },
  discardText: { fontSize: 17, color: colors.textMuted, fontWeight: '700' },
  finishBtn: { height: 36, paddingHorizontal: 16, backgroundColor: colors.primary, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  finishText: { fontSize: 13, fontWeight: '700', color: colors.white },
  errorBar: { backgroundColor: colors.dangerMuted, paddingHorizontal: 20, paddingVertical: 8 },
  errorText: { fontSize: 11, color: colors.danger },
  exerciseList: { padding: 20, paddingBottom: 120 },
  emptyExercises: { alignItems: 'center', paddingVertical: 32 },
  emptyExText: { fontSize: 13, color: colors.textMuted },
  card: { backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.surfaceBorder, padding: 16, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  exName: { fontSize: 15, fontWeight: '600', color: colors.text },
  exGroup: { fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', marginTop: 2 },
  removeText: { fontSize: 11, color: colors.danger, fontWeight: '600' },
  setHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 },
  setHeaderCell: { flex: 1, fontSize: 11, color: colors.textMuted, textAlign: 'center', fontWeight: '600' },
  setRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  setNum: { width: 28, fontSize: 13, color: colors.textMuted, textAlign: 'center', fontWeight: '600' },
  setInput: { flex: 1, height: 48, backgroundColor: colors.background, borderRadius: 6, borderWidth: 1, borderColor: colors.surfaceBorder, textAlign: 'center', fontSize: 17, color: colors.text, fontWeight: '600' },
  setRemoveBtn: { width: 32, fontSize: 20, color: colors.textMuted, textAlign: 'center', fontWeight: '700' },
  addSetBtn: { marginTop: 8, alignItems: 'center', paddingVertical: 8 },
  addSetText: { fontSize: 13, color: colors.primaryText, fontWeight: '600' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 32, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.surfaceBorder },
  addExBtn: { height: 52, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.surfaceBorder, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  addExText: { fontSize: 15, color: colors.primaryText, fontWeight: '600' },
});
