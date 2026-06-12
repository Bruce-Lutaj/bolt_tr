export interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  is_custom: boolean;
  archived_at: string | null;
  created_at: string;
}

export interface Workout {
  id: string;
  name: string;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface WorkoutSet {
  id: string;
  workout_exercise_id: string;
  set_number: number;
  reps: number;
  weight_kg: number;
  created_at: string;
}

export interface WorkoutExerciseWithSets {
  id: string;
  workout_id: string;
  exercise_id: string | null;
  exercise_name_snapshot: string;
  muscle_group_snapshot: string;
  position: number;
  created_at: string;
  workout_sets: WorkoutSet[];
}

export interface WorkoutWithExercises extends Workout {
  workout_exercises: WorkoutExerciseWithSets[];
}

export interface DraftSet {
  id: string;
  reps: string;
  weight: string;
}

export interface DraftExerciseInfo {
  id: string | null;
  name: string;
  muscle_group: string;
  is_custom: boolean;
  archived_at: string | null;
  created_at: string;
}

export interface DraftExercise {
  id: string;
  exercise: DraftExerciseInfo;
  sets: DraftSet[];
}

export interface WorkoutDraft {
  version: 1;
  name: string;
  startedAt: string;
  exercises: DraftExercise[];
}
