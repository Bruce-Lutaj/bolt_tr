import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Check, X, Timer, Copy, Search } from 'lucide-react'
import { supabase } from '../supabase'
import { saveDraft, loadDraft, clearDraft, type DraftExercise, type DraftSet, type WorkoutDraft } from '../lib/workoutDraft'
import { useElapsedTime } from '../hooks/useElapsedTime'
import type { Exercise } from '../types'

const MUSCLE_GROUPS = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core']

export default function NewWorkout() {
  const navigate = useNavigate()
  const [workoutName, setWorkoutName] = useState('')
  const [startedAt, setStartedAt] = useState('')
  const [entries, setEntries] = useState<DraftExercise[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const elapsed = useElapsedTime(startedAt || null)
  const draftSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const draft = loadDraft()
    if (draft) {
      setWorkoutName(draft.name)
      setStartedAt(draft.startedAt)
      setEntries(draft.exercises)
    } else {
      setStartedAt(new Date().toISOString())
    }
  }, [])

  const persistDraft = useCallback((name: string, started: string, exercises: DraftExercise[]) => {
    if (draftSaveTimer.current) clearTimeout(draftSaveTimer.current)
    draftSaveTimer.current = setTimeout(() => {
      const draft: WorkoutDraft = { version: 1, name, startedAt: started, exercises }
      saveDraft(draft)
    }, 400)
  }, [])


  function addExerciseFromPicker(exercise: Exercise) {
    const newEntry: DraftExercise = {
      id: crypto.randomUUID(),
      exercise,
      sets: [{ id: crypto.randomUUID(), reps: '', weight: '' }],
    }
    const updated = [...entries, newEntry]
    setEntries(updated)
    persistDraft(workoutName, startedAt, updated)
    setShowPicker(false)
  }

  function addSet(entryId: string) {
    const updated = entries.map((e) => {
      if (e.id !== entryId) return e
      const lastSet = e.sets[e.sets.length - 1]
      const newSet: DraftSet = {
        id: crypto.randomUUID(),
        reps: lastSet?.reps || '',
        weight: lastSet?.weight || '',
      }
      return { ...e, sets: [...e.sets, newSet] }
    })
    setEntries(updated)
    persistDraft(workoutName, startedAt, updated)
  }

  function copyPreviousSet(entryId: string, setIndex: number) {
    const updated = entries.map((e) => {
      if (e.id !== entryId || setIndex === 0) return e
      const prev = e.sets[setIndex - 1]
      return {
        ...e,
        sets: e.sets.map((s, i) =>
          i === setIndex ? { ...s, reps: prev.reps, weight: prev.weight } : s
        ),
      }
    })
    setEntries(updated)
    persistDraft(workoutName, startedAt, updated)
  }

  function updateSet(entryId: string, setId: string, field: 'reps' | 'weight', value: string) {
    const updated = entries.map((e) =>
      e.id === entryId
        ? { ...e, sets: e.sets.map((s) => (s.id === setId ? { ...s, [field]: value } : s)) }
        : e
    )
    setEntries(updated)
    persistDraft(workoutName, startedAt, updated)
  }

  function removeSet(entryId: string, setId: string) {
    const updated = entries
      .map((e) =>
        e.id === entryId ? { ...e, sets: e.sets.filter((s) => s.id !== setId) } : e
      )
      .filter((e) => e.sets.length > 0)
    setEntries(updated)
    persistDraft(workoutName, startedAt, updated)
  }

  function removeExercise(entryId: string) {
    const updated = entries.filter((e) => e.id !== entryId)
    setEntries(updated)
    persistDraft(workoutName, startedAt, updated)
  }

  function handleNameChange(name: string) {
    setWorkoutName(name)
    persistDraft(name, startedAt, entries)
  }

  const validSetCount = entries.reduce(
    (sum, e) => sum + e.sets.filter((s) => s.reps !== '' && s.weight !== '').length,
    0
  )

  async function finishWorkout() {
    if (validSetCount === 0) return
    setSaving(true)

    const name = workoutName.trim() || `Workout ${new Date().toLocaleDateString()}`
    const now = new Date().toISOString()

    const { data: workout, error: workoutErr } = await supabase
      .from('workouts')
      .insert({ name, started_at: startedAt || now, completed_at: now })
      .select()
      .single()

    if (workoutErr || !workout) {
      setSaving(false)
      return
    }

    const workoutExercises = entries.map((entry, idx) => ({
      workout_id: workout.id,
      exercise_id: entry.exercise.id,
      exercise_name_snapshot: entry.exercise.name,
      muscle_group_snapshot: entry.exercise.muscle_group,
      position: idx + 1,
    }))

    const { data: insertedExercises, error: exErr } = await supabase
      .from('workout_exercises')
      .insert(workoutExercises)
      .select()

    if (exErr || !insertedExercises) {
      setSaving(false)
      return
    }

    const sets = entries.flatMap((entry, entryIdx) => {
      const workoutExercise = insertedExercises[entryIdx]
      return entry.sets
        .filter((s) => s.reps !== '' && s.weight !== '')
        .map((s, idx) => ({
          workout_exercise_id: workoutExercise.id,
          set_number: idx + 1,
          reps: parseInt(s.reps) || 1,
          weight_kg: parseFloat(s.weight) || 0,
        }))
    })

    if (sets.length > 0) {
      await supabase.from('workout_sets').insert(sets)
    }

    clearDraft()
    navigate(`/history/${workout.id}`)
  }

  function discardWorkout() {
    if (!confirm('Discard this workout? All progress will be lost.')) return
    clearDraft()
    navigate('/')
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)]">
      {/* Sticky header */}
      <div className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800/50 px-5 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <input
              type="text"
              placeholder="Workout name"
              value={workoutName}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full text-base font-semibold text-white bg-transparent placeholder-slate-600 focus:outline-none truncate"
            />
            <div className="flex items-center gap-3 mt-0.5">
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Timer size={11} />
                {elapsed}
              </span>
              <span className="text-xs text-slate-600">
                {entries.length} exercises
              </span>
              <span className="text-xs text-slate-600">
                {validSetCount} sets
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={discardWorkout}
              className="p-2 text-slate-500 hover:text-red-400 transition-colors"
              title="Discard workout"
            >
              <X size={18} />
            </button>
            <button
              onClick={finishWorkout}
              disabled={validSetCount === 0 || saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <Check size={15} />
              {saving ? 'Saving...' : 'Finish'}
            </button>
          </div>
        </div>
      </div>

      {/* Exercise entries */}
      <div className="flex-1 px-5 py-4 space-y-4">
        {entries.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <p className="text-sm">Add exercises to start your workout</p>
          </div>
        )}

        {entries.map((entry) => (
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

      {/* Sticky bottom add exercise */}
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
          onSelect={addExerciseFromPicker}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}

function ExercisePicker({ onSelect, onClose }: { onSelect: (e: Exercise) => void; onClose: () => void }) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [recentExercises, setRecentExercises] = useState<Exercise[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeGroup, setActiveGroup] = useState('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadExercises()
  }, [])

  async function loadExercises() {
    const [allRes, recentRes] = await Promise.all([
      supabase
        .from('exercises')
        .select('*')
        .is('archived_at', null)
        .order('muscle_group')
        .order('name'),
      supabase
        .from('workout_exercises')
        .select('exercise_id, exercises!inner(*)')
        .not('exercise_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    if (allRes.data) setExercises(allRes.data)

    if (recentRes.data) {
      const seen = new Set<string>()
      const recent: Exercise[] = []
      for (const row of recentRes.data) {
        const ex = row.exercises as unknown as Exercise
        if (ex && !seen.has(ex.id) && !ex.archived_at) {
          seen.add(ex.id)
          recent.push(ex)
          if (recent.length >= 6) break
        }
      }
      setRecentExercises(recent)
    }
    setLoading(false)
  }

  const filtered = exercises.filter((e) => {
    const matchesGroup = activeGroup === 'All' || e.muscle_group === activeGroup
    const matchesSearch =
      !searchQuery ||
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.muscle_group.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesGroup && matchesSearch
  })

  const grouped = filtered.reduce<Record<string, Exercise[]>>((acc, ex) => {
    if (!acc[ex.muscle_group]) acc[ex.muscle_group] = []
    acc[ex.muscle_group].push(ex)
    return acc
  }, {})

  const showRecent = !searchQuery && activeGroup === 'All' && recentExercises.length > 0

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <h2 className="text-lg font-bold text-white">Select Exercise</h2>
        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="px-5 py-3 space-y-3 border-b border-slate-800/50">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            type="text"
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-600 text-sm focus:outline-none focus:border-green-600"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {MUSCLE_GROUPS.map((g) => (
            <button
              key={g}
              onClick={() => setActiveGroup(g)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                activeGroup === g
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p className="text-sm">No exercises found</p>
          </div>
        ) : (
          <>
            {showRecent && (
              <div className="mb-5">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Recent
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {recentExercises.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => onSelect(ex)}
                      className="text-left px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white hover:border-green-600 transition-colors truncate"
                    >
                      {ex.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {Object.entries(grouped).map(([group, exs]) => (
              <div key={group} className="mb-4">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  {group}
                </p>
                <div className="space-y-1">
                  {exs.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => onSelect(ex)}
                      className="w-full text-left px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white hover:border-green-600 transition-colors"
                    >
                      {ex.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
