import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { getActiveAccountIdentity } from '../../lib/identity';
import type { WorkoutDraft, DraftExercise, DraftSet, Exercise } from '../../shared/types';

async function getDraftKey(): Promise<string> {
  const { provider, accountId } = await getActiveAccountIdentity();
  if (provider === 'guest') return 'gymtrack.guest.activeWorkoutDraft';
  if (provider === 'smartuser' && accountId) return `gymtrack.smartuser.${accountId}.activeWorkoutDraft`;
  if (provider === 'supabase' && accountId) return `gymtrack.supabase.${accountId}.activeWorkoutDraft`;
  return 'gymtrack.activeWorkoutDraft';
}

export async function loadDraft(): Promise<WorkoutDraft | null> {
  const key = await getDraftKey();
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as WorkoutDraft;
    return parsed?.version === 1 ? parsed : null;
  } catch { return null; }
}

export async function saveDraft(draft: WorkoutDraft): Promise<void> {
  const key = await getDraftKey();
  await AsyncStorage.setItem(key, JSON.stringify(draft));
}

export async function clearDraft(): Promise<void> {
  const key = await getDraftKey();
  await AsyncStorage.removeItem(key);
}

export function createEmptyDraft(): WorkoutDraft {
  return { version: 1, name: '', startedAt: new Date().toISOString(), exercises: [] };
}

export function addExerciseToDraft(draft: WorkoutDraft, exercise: Exercise): WorkoutDraft {
  const newEntry: DraftExercise = {
    id: Crypto.randomUUID(),
    exercise: { id: exercise.id, name: exercise.name, muscle_group: exercise.muscle_group, is_custom: exercise.is_custom, archived_at: exercise.archived_at, created_at: exercise.created_at },
    sets: [{ id: Crypto.randomUUID(), reps: '', weight: '' }],
  };
  return { ...draft, exercises: [...draft.exercises, newEntry] };
}

export function removeExerciseFromDraft(draft: WorkoutDraft, entryId: string): WorkoutDraft {
  return { ...draft, exercises: draft.exercises.filter((e) => e.id !== entryId) };
}

export function addSetToDraft(draft: WorkoutDraft, entryId: string): WorkoutDraft {
  return {
    ...draft,
    exercises: draft.exercises.map((e) => {
      if (e.id !== entryId) return e;
      const lastSet = e.sets[e.sets.length - 1];
      const newSet: DraftSet = { id: Crypto.randomUUID(), reps: lastSet?.reps || '', weight: lastSet?.weight || '' };
      return { ...e, sets: [...e.sets, newSet] };
    }),
  };
}

export function removeSetFromDraft(draft: WorkoutDraft, entryId: string, setId: string): WorkoutDraft {
  const exercises = draft.exercises
    .map((e) => e.id === entryId ? { ...e, sets: e.sets.filter((s) => s.id !== setId) } : e)
    .filter((e) => e.sets.length > 0);
  return { ...draft, exercises };
}

export function updateSetInDraft(draft: WorkoutDraft, entryId: string, setId: string, field: 'reps' | 'weight', value: string): WorkoutDraft {
  return {
    ...draft,
    exercises: draft.exercises.map((e) =>
      e.id === entryId ? { ...e, sets: e.sets.map((s) => s.id === setId ? { ...s, [field]: value } : s) } : e
    ),
  };
}
