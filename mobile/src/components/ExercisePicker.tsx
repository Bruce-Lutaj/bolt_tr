import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, FlatList, Pressable, Modal, StyleSheet, SafeAreaView } from 'react-native';
import { fetchAllExercises, createExercise } from '../features/exercises/exercisesApi';
import { colors, spacing, radius, fontSize } from '../theme';
import type { Exercise } from '../shared/types';

const MUSCLE_GROUPS = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];

interface Props {
  visible: boolean;
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

export function ExercisePicker({ visible, onSelect, onClose }: Props) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGroup, setNewGroup] = useState('Chest');

  useEffect(() => {
    if (visible) {
      fetchAllExercises().then(({ data }) => { if (data) setExercises(data); });
    }
  }, [visible]);

  const filtered = useMemo(() => {
    if (!search.trim()) return exercises;
    const q = search.toLowerCase();
    return exercises.filter((e) => e.name.toLowerCase().includes(q) || e.muscle_group.toLowerCase().includes(q));
  }, [exercises, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, Exercise[]>();
    for (const e of filtered) {
      const list = map.get(e.muscle_group) ?? [];
      list.push(e);
      map.set(e.muscle_group, list);
    }
    return [...map.entries()].map(([title, data]) => ({ title, data }));
  }, [filtered]);

  async function handleCreate() {
    if (!newName.trim()) return;
    const { data } = await createExercise(newName, newGroup);
    if (data) { onSelect(data); setCreating(false); setNewName(''); }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Add Exercise</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.closeBtn}>Close</Text>
          </Pressable>
        </View>

        <TextInput
          placeholder="Search exercises..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
          autoCapitalize="none"
        />

        {creating ? (
          <View style={styles.createForm}>
            <TextInput placeholder="Exercise name" placeholderTextColor={colors.textMuted}
              value={newName} onChangeText={setNewName} style={styles.searchInput} autoFocus />
            <View style={styles.groupRow}>
              {MUSCLE_GROUPS.map((g) => (
                <Pressable key={g} onPress={() => setNewGroup(g)}
                  style={[styles.groupChip, newGroup === g && styles.groupChipActive]}>
                  <Text style={[styles.groupChipText, newGroup === g && styles.groupChipTextActive]}>{g}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.createActions}>
              <Pressable onPress={() => setCreating(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleCreate} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>Create</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            <FlatList
              data={grouped}
              keyExtractor={(item) => item.title}
              contentContainerStyle={styles.list}
              renderItem={({ item: group }) => (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{group.title}</Text>
                  {group.data.map((exercise) => (
                    <Pressable key={exercise.id} onPress={() => onSelect(exercise)}
                      style={({ pressed }) => [styles.exerciseRow, pressed && styles.exerciseRowPressed]}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            />
            <Pressable onPress={() => setCreating(true)} style={styles.createBtn}>
              <Text style={styles.createBtnText}>+ Create Custom Exercise</Text>
            </Pressable>
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  title: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  closeBtn: { fontSize: fontSize.base, color: colors.primaryText, fontWeight: '600' },
  searchInput: {
    height: 48, backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.surfaceBorder, paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.xl, marginBottom: spacing.lg, fontSize: fontSize.base, color: colors.text,
  },
  list: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  section: { marginBottom: spacing.xl },
  sectionTitle: { fontSize: fontSize.xs, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
  exerciseRow: { paddingVertical: spacing.md, paddingHorizontal: spacing.md, borderRadius: radius.sm },
  exerciseRowPressed: { backgroundColor: colors.surfaceHover },
  exerciseName: { fontSize: fontSize.base, color: colors.text },
  createBtn: {
    position: 'absolute', bottom: spacing.xxxl, left: spacing.xl, right: spacing.xl,
    height: 52, backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.surfaceBorder, alignItems: 'center', justifyContent: 'center',
  },
  createBtnText: { fontSize: fontSize.base, color: colors.primaryText, fontWeight: '600' },
  createForm: { paddingHorizontal: spacing.xl },
  groupRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  groupChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder },
  groupChipActive: { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
  groupChipText: { fontSize: fontSize.sm, color: colors.textSecondary },
  groupChipTextActive: { color: colors.primaryText },
  createActions: { flexDirection: 'row', gap: spacing.md },
  cancelBtn: { flex: 1, height: 48, borderRadius: radius.md, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { fontSize: fontSize.base, color: colors.textSecondary, fontWeight: '600' },
  saveBtn: { flex: 1, height: 48, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontSize: fontSize.base, color: colors.white, fontWeight: '600' },
});
