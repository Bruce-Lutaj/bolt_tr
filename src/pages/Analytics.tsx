import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../supabase'
import type { Exercise } from '../types'

interface SetData {
  exercise_id: string
  weight: number
  reps: number
  workout_completed_at: string
}

interface WeekData {
  week: string
  label: string
  count: number
  volume: number
}

export default function Analytics() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [setData, setSetData] = useState<SetData[]>([])
  const [weeklyData, setWeeklyData] = useState<WeekData[]>([])
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [exercisesRes, setsRes, workoutsRes] = await Promise.all([
      supabase.from('exercises').select('*').order('name'),
      supabase
        .from('workout_sets')
        .select('exercise_id, weight, reps, created_at, workouts!inner(completed_at)')
        .not('workouts.completed_at', 'is', null)
        .order('created_at', { ascending: true }),
      supabase
        .from('workouts')
        .select('completed_at')
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: true }),
    ])

    if (exercisesRes.data) setExercises(exercisesRes.data)

    if (setsRes.data) {
      const mapped = setsRes.data.map((s: Record<string, unknown>) => ({
        exercise_id: s.exercise_id as string,
        weight: s.weight as number,
        reps: s.reps as number,
        workout_completed_at: (s.workouts as { completed_at: string }).completed_at,
      }))
      setSetData(mapped)

      if (mapped.length > 0) {
        const exerciseCounts = new Map<string, number>()
        for (const s of mapped) {
          exerciseCounts.set(s.exercise_id, (exerciseCounts.get(s.exercise_id) || 0) + 1)
        }
        let mostUsed = mapped[0].exercise_id
        let maxCount = 0
        for (const [id, count] of exerciseCounts) {
          if (count > maxCount) {
            mostUsed = id
            maxCount = count
          }
        }
        setSelectedExercise(mostUsed)
      }
    }

    if (workoutsRes.data && setsRes.data) {
      setWeeklyData(buildWeeklyData(workoutsRes.data, setsRes.data))
    }

    setLoading(false)
  }

  function buildWeeklyData(
    workouts: { completed_at: string | null }[],
    sets: Record<string, unknown>[]
  ): WeekData[] {
    const weekMap = new Map<string, { count: number; volume: number }>()

    for (const w of workouts) {
      if (!w.completed_at) continue
      const weekKey = getWeekKey(new Date(w.completed_at))
      const existing = weekMap.get(weekKey) || { count: 0, volume: 0 }
      existing.count++
      weekMap.set(weekKey, existing)
    }

    for (const s of sets) {
      const workoutData = s.workouts as { completed_at: string } | null
      if (!workoutData?.completed_at) continue
      const weekKey = getWeekKey(new Date(workoutData.completed_at))
      const existing = weekMap.get(weekKey) || { count: 0, volume: 0 }
      existing.volume += (s.weight as number) * (s.reps as number)
      weekMap.set(weekKey, existing)
    }

    return Array.from(weekMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([week, data]) => ({
        week,
        label: formatWeekLabel(week),
        ...data,
      }))
  }

  function getWeekKey(date: Date) {
    const d = new Date(date)
    d.setDate(d.getDate() - d.getDay())
    return d.toISOString().slice(0, 10)
  }

  const exerciseProgress = useMemo(() => {
    if (!selectedExercise) return []
    const relevant = setData.filter((s) => s.exercise_id === selectedExercise)

    const bySession = new Map<string, { maxWeight: number; date: string }>()
    for (const s of relevant) {
      const dateKey = s.workout_completed_at.slice(0, 10)
      const existing = bySession.get(dateKey)
      if (!existing || s.weight > existing.maxWeight) {
        bySession.set(dateKey, { maxWeight: s.weight, date: dateKey })
      }
    }

    return Array.from(bySession.values()).sort((a, b) => a.date.localeCompare(b.date))
  }, [selectedExercise, setData])

  const exercisesWithData = useMemo(() => {
    const ids = new Set(setData.map((s) => s.exercise_id))
    return exercises.filter((e) => ids.has(e.id))
  }, [exercises, setData])

  const personalBests = useMemo(() => {
    const maxByExercise = new Map<string, number>()
    for (const s of setData) {
      const current = maxByExercise.get(s.exercise_id) || 0
      if (s.weight > current) maxByExercise.set(s.exercise_id, s.weight)
    }
    const exerciseMap = new Map(exercises.map((e) => [e.id, e]))
    return Array.from(maxByExercise.entries())
      .map(([id, weight]) => {
        const ex = exerciseMap.get(id)
        return { exerciseId: id, name: ex?.name || 'Unknown', group: ex?.muscle_group || '', weight }
      })
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 10)
  }, [setData, exercises])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const hasData = setData.length > 0

  return (
    <div className="px-5 pt-12 pb-6">
      <header className="mb-6">
        <h1 className="text-xl font-bold text-white">Progress</h1>
        <p className="text-slate-500 text-sm mt-1">Track your gains over time</p>
      </header>

      {!hasData ? (
        <div className="text-center py-12 text-slate-500">
          <p className="text-sm">Complete some workouts to see your progress here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <section>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Weekly Workouts
            </h2>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              {weeklyData.length < 2 ? (
                <p className="text-slate-500 text-sm text-center py-4">Need at least 2 weeks of data</p>
              ) : (
                <BarChart
                  data={weeklyData.map((w) => ({ label: w.label, value: w.count }))}
                  color="#4ade80"
                  unit="workouts"
                />
              )}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Weekly Volume
            </h2>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              {weeklyData.length < 2 ? (
                <p className="text-slate-500 text-sm text-center py-4">Need at least 2 weeks of data</p>
              ) : (
                <BarChart
                  data={weeklyData.map((w) => ({ label: w.label, value: Math.round(w.volume) }))}
                  color="#38bdf8"
                  unit="kg"
                />
              )}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Exercise Progress (Max Weight)
            </h2>
            <select
              value={selectedExercise || ''}
              onChange={(e) => setSelectedExercise(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm mb-3 focus:outline-none focus:border-green-600 appearance-none"
            >
              {exercisesWithData.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              {exerciseProgress.length < 2 ? (
                <p className="text-slate-500 text-sm text-center py-4">Need at least 2 sessions to chart</p>
              ) : (
                <LineChart
                  data={exerciseProgress.map((p) => ({
                    label: formatShortDate(p.date),
                    value: p.maxWeight,
                  }))}
                />
              )}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Personal Bests
            </h2>
            <div className="space-y-2">
              {personalBests.map((pb) => (
                <div key={pb.exerciseId} className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-white">{pb.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase">{pb.group}</p>
                  </div>
                  <p className="text-sm font-bold text-green-400">{pb.weight} kg</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

function formatWeekLabel(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatShortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function BarChart({ data, color, unit }: { data: { label: string; value: number }[]; color: string; unit: string }) {
  const maxValue = Math.max(...data.map((d) => d.value), 1)

  return (
    <div>
      <div className="flex items-end justify-between gap-1.5 h-28">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
            <span className="text-[9px] text-slate-400 mb-1 font-medium">{d.value}</span>
            <div
              className="w-full rounded-t-md min-h-[4px]"
              style={{
                height: `${(d.value / maxValue) * 100}%`,
                backgroundColor: color,
                opacity: 0.7 + (i / data.length) * 0.3,
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between gap-1.5 mt-2 border-t border-slate-800 pt-2">
        {data.map((d, i) => (
          <span key={i} className="flex-1 text-[8px] text-slate-600 text-center truncate">{d.label}</span>
        ))}
      </div>
      <p className="text-[10px] text-slate-600 text-right mt-1">{unit}</p>
    </div>
  )
}

function LineChart({ data }: { data: { label: string; value: number }[] }) {
  const values = data.map((d) => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const height = 120
  const width = 280
  const pad = 10

  const points = data.map((d, i) => ({
    x: pad + (i / (data.length - 1)) * (width - pad * 2),
    y: pad + (1 - (d.value - min) / range) * (height - pad * 2),
  }))

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-28">
        <defs>
          <linearGradient id="areaFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#areaFill)" />
        <path d={pathD} fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#22c55e" />
        ))}
      </svg>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] text-slate-500">{data[0].label}</span>
        <span className="text-[9px] text-slate-500">{data[data.length - 1].label}</span>
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-slate-400">Low: <span className="text-white font-medium">{min} kg</span></span>
        <span className="text-[10px] text-slate-400">High: <span className="text-green-400 font-medium">{max} kg</span></span>
      </div>
    </div>
  )
}
