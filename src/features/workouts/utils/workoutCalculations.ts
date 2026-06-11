import type { WorkoutExerciseWithSets, DraftExercise } from '../types'

export function calculateTotalVolume(exercises: WorkoutExerciseWithSets[]): number {
  return exercises.reduce(
    (sum, we) => sum + we.workout_sets.reduce((s, set) => s + set.reps * set.weight_kg, 0),
    0
  )
}

export function calculateTotalSets(exercises: WorkoutExerciseWithSets[]): number {
  return exercises.reduce((sum, we) => sum + we.workout_sets.length, 0)
}

export function calculateExerciseCount(exercises: WorkoutExerciseWithSets[]): number {
  return exercises.length
}

export function countValidDraftSets(entries: DraftExercise[]): number {
  return entries.reduce(
    (sum, e) => sum + e.sets.filter((s) => s.reps !== '' && s.weight !== '').length,
    0
  )
}
