import { useState } from 'react'
import { Plus, Trash2, Check, X, Timer, Copy } from 'lucide-react'
import { useActiveWorkoutDraft, useElapsedTime } from '../features/workouts'
import { useAuth } from '../features/auth'
import { ExercisePicker } from '../features/exercises'
import { InlineError } from '../components/ui'

export default function NewWorkout() {
  const { user } = useAuth()
  const {
    state,
    validSetCount,
    setName,
    addExercise,
    removeExercise,
    addSet,
    removeSet,
    updateSet,
    copyPreviousSet,
    discard,
    finish,
  } = useActiveWorkoutDraft(user?.id ?? 'guest')
  const elapsed = useElapsedTime(state.startedAt || null)
  const [showPicker, setShowPicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFinish() {
    setSaving(true)
    setError(null)
    const err = await finish()
    if (err) {
      setError(err)
      setSaving(false)
    }
  }

  function handleDiscard() {
    if (!confirm('Discard this workout? All progress will be lost.')) return
    discard()
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)]">
      <div className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800/50 px-5 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <input
              type="text"
              placeholder="Workout name"
              value={state.name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-base font-semibold text-white bg-transparent placeholder-slate-600 focus:outline-none truncate"
            />
            <div className="flex items-center gap-3 mt-0.5">
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Timer size={11} />
                {elapsed}
              </span>
              <span className="text-xs text-slate-600">
                {state.exercises.length} exercises
              </span>
              <span className="text-xs text-slate-600">
                {validSetCount} sets
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDiscard}
              className="p-2 text-slate-500 hover:text-red-400 transition-colors"
              title="Discard workout"
            >
              <X size={18} />
            </button>
            <button
              onClick={handleFinish}
              disabled={validSetCount === 0 || saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <Check size={15} />
              {saving ? 'Saving...' : 'Finish'}
            </button>
          </div>
        </div>
        <InlineError error={error} className="mt-2" />
      </div>

      <div className="flex-1 px-5 py-4 space-y-4">
        {state.exercises.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <p className="text-sm">Add exercises to start your workout</p>
          </div>
        )}

        {state.exercises.map((entry) => (
          <div key={entry.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold text-white text-sm">{entry.exercise.name}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">{entry.exercise.muscle_group}</p>
              </div>
              <button
                onClick={() => removeExercise(entry.id)}
                className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                title="Remove exercise"
              >
                <Trash2 size={15} />
              </button>
            </div>

            <div className="grid grid-cols-[2.5rem_1fr_1fr_2.5rem] gap-2 items-center mb-2 px-1">
              <span className="text-[10px] text-slate-600 text-center font-medium">SET</span>
              <span className="text-[10px] text-slate-600 text-center font-medium">KG</span>
              <span className="text-[10px] text-slate-600 text-center font-medium">REPS</span>
              <span />
            </div>

            {entry.sets.map((set, idx) => {
              const isComplete = set.reps !== '' && set.weight !== ''
              return (
                <div
                  key={set.id}
                  className={`grid grid-cols-[2.5rem_1fr_1fr_2.5rem] gap-2 items-center mb-2 rounded-md transition-colors ${
                    !isComplete && (set.reps !== '' || set.weight !== '') ? 'bg-amber-500/5' : ''
                  }`}
                >
                  <span className="text-sm text-slate-500 text-center font-medium">
                    {idx + 1}
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={set.weight}
                    onChange={(e) => updateSet(entry.id, set.id, 'weight', e.target.value)}
                    className="h-11 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white text-base text-center focus:outline-none focus:border-green-600 transition-colors"
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="0"
                    value={set.reps}
                    onChange={(e) => updateSet(entry.id, set.id, 'reps', e.target.value)}
                    className="h-11 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white text-base text-center focus:outline-none focus:border-green-600 transition-colors"
                  />
                  <div className="flex flex-col items-center gap-0.5">
                    {idx > 0 && !isComplete && (
                      <button
                        onClick={() => copyPreviousSet(entry.id, idx)}
                        className="p-1 text-slate-600 hover:text-sky-400 transition-colors"
                        title="Copy previous set"
                      >
                        <Copy size={12} />
                      </button>
                    )}
                    <button
                      onClick={() => removeSet(entry.id, set.id)}
                      className="p-1 text-slate-600 hover:text-red-400 transition-colors"
                      title="Remove set"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              )
            })}

            <button
              onClick={() => addSet(entry.id)}
              className="mt-2 w-full py-2 text-xs text-green-500 hover:text-green-400 font-medium transition-colors text-center"
            >
              + Add Set
            </button>
          </div>
        ))}
      </div>

      <div className="sticky bottom-20 px-5 pb-4 pt-2">
        <button
          onClick={() => setShowPicker(true)}
          className="flex items-center justify-center gap-2 w-full h-12 border border-dashed border-slate-700 hover:border-green-600 text-slate-400 hover:text-green-400 rounded-lg transition-colors text-sm font-medium bg-slate-950/80 backdrop-blur-sm"
        >
          <Plus size={18} />
          Add Exercise
        </button>
      </div>

      {showPicker && (
        <ExercisePicker
          onSelect={(exercise) => {
            addExercise(exercise)
            setShowPicker(false)
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}
