import type { DraftExercise, DraftSet } from '../types'
import type { Exercise } from '../../exercises/types'

export interface DraftState {
  name: string
  startedAt: string
  exercises: DraftExercise[]
}

export type DraftAction =
  | { type: 'INIT'; payload: DraftState }
  | { type: 'SET_NAME'; payload: string }
  | { type: 'ADD_EXERCISE'; payload: Exercise }
  | { type: 'REMOVE_EXERCISE'; payload: string }
  | { type: 'ADD_SET'; payload: string }
  | { type: 'REMOVE_SET'; payload: { entryId: string; setId: string } }
  | { type: 'UPDATE_SET'; payload: { entryId: string; setId: string; field: 'reps' | 'weight'; value: string } }
  | { type: 'COPY_PREVIOUS_SET'; payload: { entryId: string; setIndex: number } }
  | { type: 'RESET' }

export const initialDraftState: DraftState = {
  name: '',
  startedAt: '',
  exercises: [],
}

export function workoutDraftReducer(state: DraftState, action: DraftAction): DraftState {
  switch (action.type) {
    case 'INIT':
      return action.payload

    case 'SET_NAME':
      return { ...state, name: action.payload }

    case 'ADD_EXERCISE': {
      const newEntry: DraftExercise = {
        id: crypto.randomUUID(),
        exercise: action.payload,
        sets: [{ id: crypto.randomUUID(), reps: '', weight: '' }],
      }
      return { ...state, exercises: [...state.exercises, newEntry] }
    }

    case 'REMOVE_EXERCISE':
      return { ...state, exercises: state.exercises.filter((e) => e.id !== action.payload) }

    case 'ADD_SET': {
      return {
        ...state,
        exercises: state.exercises.map((e) => {
          if (e.id !== action.payload) return e
          const lastSet = e.sets[e.sets.length - 1]
          const newSet: DraftSet = {
            id: crypto.randomUUID(),
            reps: lastSet?.reps || '',
            weight: lastSet?.weight || '',
          }
          return { ...e, sets: [...e.sets, newSet] }
        }),
      }
    }

    case 'REMOVE_SET': {
      const updated = state.exercises
        .map((e) =>
          e.id === action.payload.entryId
            ? { ...e, sets: e.sets.filter((s) => s.id !== action.payload.setId) }
            : e
        )
        .filter((e) => e.sets.length > 0)
      return { ...state, exercises: updated }
    }

    case 'UPDATE_SET': {
      const { entryId, setId, field, value } = action.payload
      return {
        ...state,
        exercises: state.exercises.map((e) =>
          e.id === entryId
            ? { ...e, sets: e.sets.map((s) => (s.id === setId ? { ...s, [field]: value } : s)) }
            : e
        ),
      }
    }

    case 'COPY_PREVIOUS_SET': {
      const { entryId, setIndex } = action.payload
      return {
        ...state,
        exercises: state.exercises.map((e) => {
          if (e.id !== entryId || setIndex === 0) return e
          const prev = e.sets[setIndex - 1]
          return {
            ...e,
            sets: e.sets.map((s, i) =>
              i === setIndex ? { ...s, reps: prev.reps, weight: prev.weight } : s
            ),
          }
        }),
      }
    }

    case 'RESET':
      return initialDraftState

    default:
      return state
  }
}
