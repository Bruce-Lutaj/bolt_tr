import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Check, X } from 'lucide-react'
import { supabase } from '../supabase'
import type { Exercise } from '../types'

interface SetEntry {
  id: string
  reps: string
  weight: string
}

interface ExerciseEntry {
  id: string
  exercise: Exercise
  sets: SetEntry[]
}

export default function NewWorkout() {
  const navigate = useNavigate()
  const [workoutName, setWorkoutName] = useState('')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [entries, setEntries] = useState<ExerciseEntry[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    supabase
      .from('exercises')
      .select('*')
      .order('muscle_group')
      .order('name')
      .then(({ data }) => {
        if (data) setExercises(data)
      })
  }, [])

  function addExercise(exercise: Exercise) {
    setEntries([
      ...entries,
      {
        id: crypto.randomUUID(),
        exercise,
        sets: [{ id: crypto.randomUUID(), reps: '', weight: '' }],
      },
    ])
    setShowPicker(false)
    setSearchQuery('')
  }

  function addSet(entryId: string) {
    setEntries(
      entries.map((e) =>
        e.id === entryId
          ? { ...e, sets: [...e.sets, { id: crypto.randomUUID(), reps: '', weight: '' }] }
          : e
      )
    )
  }

  function updateSet(entryId: string, setId: string, field: 'reps' | 'weight', value: string) {
    setEntries(
      entries.map((e) =>
        e.id === entryId
          ? {
              ...e,
              sets: e.sets.map((s) =>
                s.id === setId ? { ...s, [field]: value } : s
              ),
            }
          : e
      )
    )
  }

  function removeSet(entryId: string, setId: string) {
    setEntries(
      entries.map((e) =>
        e.id === entryId
          ? { ...e, sets: e.sets.filter((s) => s.id !== setId) }
          : e
      ).filter((e) => e.sets.length > 0)
    )
  }

  function removeExercise(entryId: string) {
    setEntries(entries.filter((e) => e.id !== entryId))
  }

  async function finishWorkout() {
    if (entries.length === 0) return
    setSaving(true)

    const name = workoutName.trim() || `Workout ${new Date().toLocaleDateString()}`

    const { data: workout, error: workoutErr } = await supabase
      .from('workouts')
      .insert({ name, completed_at: new Date().toISOString() })
      .select()
      .single()

    if (workoutErr || !workout) {
      setSaving(false)
      return
    }

    const sets = entries.flatMap((entry) =>
      entry.sets
        .filter((s) => s.reps !== '' && s.weight !== '')
        .map((s, idx) => ({
          workout_id: workout.id,
          exercise_id: entry.exercise.id,
          set_number: idx + 1,
          reps: parseInt(s.reps) || 0,
          weight: parseFloat(s.weight) || 0,
        }))
    )

    if (sets.length > 0) {
      await supabase.from('workout_sets').insert(sets)
    }

    navigate(`/history/${workout.id}`)
  }

  const filteredExercises = exercises.filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.muscle_group.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const grouped = filteredExercises.reduce<Record<string, Exercise[]>>((acc, ex) => {
    if (!acc[ex.muscle_group]) acc[ex.muscle_group] = []
    acc[ex.muscle_group].push(ex)
    return acc
  }, {})

  return (
    <div className="px-5 pt-12 pb-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">New Workout</h1>
        <button
          onClick={finishWorkout}
          disabled={entries.length === 0 || saving}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Check size={16} />
          {saving ? 'Saving...' : 'Finish'}
        </button>
      </header>

      <input
        type="text"
        placeholder="Workout name (optional)"
        value={workoutName}
        onChange={(e) => setWorkoutName(e.target.value)}
        className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-sm mb-6 focus:outline-none focus:border-green-600"
      />

      {entries.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <p className="text-sm">Add exercises to start your workout</p>
        </div>
      )}

      <div className="space-y-4">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold text-white text-sm">{entry.exercise.name}</p>
                <p className="text-[10px] text-slate-500 uppercase">{entry.exercise.muscle_group}</p>
              </div>
              <button
                onClick={() => removeExercise(entry.id)}
                className="p-2 text-slate-600 hover:text-red-400 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="grid grid-cols-[2rem_1fr_1fr_2rem] gap-2 items-center mb-2">
              <span className="text-[10px] text-slate-600 text-center">SET</span>
              <span className="text-[10px] text-slate-600 text-center">KG</span>
              <span className="text-[10px] text-slate-600 text-center">REPS</span>
              <span />
            </div>

            {entry.sets.map((set, idx) => (
              <div
                key={set.id}
                className="grid grid-cols-[2rem_1fr_1fr_2rem] gap-2 items-center mb-2"
              >
                <span className="text-xs text-slate-500 text-center font-medium">
                  {idx + 1}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={set.weight}
                  onChange={(e) => updateSet(entry.id, set.id, 'weight', e.target.value)}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm text-center focus:outline-none focus:border-green-600"
                />
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  value={set.reps}
                  onChange={(e) => updateSet(entry.id, set.id, 'reps', e.target.value)}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm text-center focus:outline-none focus:border-green-600"
                />
                <button
                  onClick={() => removeSet(entry.id, set.id)}
                  className="p-1 text-slate-600 hover:text-red-400 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}

            <button
              onClick={() => addSet(entry.id)}
              className="mt-2 text-xs text-green-500 hover:text-green-400 font-medium transition-colors"
            >
              + Add Set
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowPicker(true)}
        className="mt-4 flex items-center justify-center gap-2 w-full py-3 border border-dashed border-slate-700 hover:border-green-600 text-slate-400 hover:text-green-400 rounded-xl transition-colors text-sm"
      >
        <Plus size={18} />
        Add Exercise
      </button>

      {showPicker && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex flex-col">
          <div className="max-w-lg mx-auto w-full flex flex-col h-full">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">Select Exercise</h2>
              <button
                onClick={() => { setShowPicker(false); setSearchQuery('') }}
                className="p-2 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-5 py-3">
              <input
                type="text"
                placeholder="Search exercises..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-green-600"
              />
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-5">
              {Object.entries(grouped).map(([group, exs]) => (
                <div key={group} className="mb-4">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    {group}
                  </p>
                  <div className="space-y-1">
                    {exs.map((ex) => (
                      <button
                        key={ex.id}
                        onClick={() => addExercise(ex)}
                        className="w-full text-left px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white hover:border-green-600 transition-colors"
                      >
                        {ex.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
