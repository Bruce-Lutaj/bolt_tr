import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Dumbbell, TrendingUp, Calendar, Flame, Play, ChevronRight, RotateCcw } from 'lucide-react'
import { supabase } from '../supabase'
import { getDraftSummary, saveDraft, type WorkoutDraft } from '../lib/workoutDraft'
import { useElapsedTime } from '../hooks/useElapsedTime'
import type { Workout } from '../types'

export default function Home() {
  const navigate = useNavigate()
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([])
  const [stats, setStats] = useState({ thisWeek: 0, totalWorkouts: 0, totalVolume: 0 })
  const [loading, setLoading] = useState(true)
  const [draftSummary] = useState(getDraftSummary())
  const elapsed = useElapsedTime(draftSummary?.startedAt ?? null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const [workoutsRes, weekRes, totalRes, volumeRes] = await Promise.all([
      supabase
        .from('workouts')
        .select('*')
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(3),
      supabase
        .from('workouts')
        .select('id', { count: 'exact', head: true })
        .not('completed_at', 'is', null)
        .gte('completed_at', weekAgo.toISOString()),
      supabase
        .from('workouts')
        .select('id', { count: 'exact', head: true })
        .not('completed_at', 'is', null),
      supabase
        .from('workout_sets')
        .select('reps, weight_kg'),
    ])

    if (workoutsRes.data) setRecentWorkouts(workoutsRes.data)

    const totalVolume = volumeRes.data
      ? volumeRes.data.reduce((sum, s) => sum + s.reps * s.weight_kg, 0)
      : 0

    setStats({
      thisWeek: weekRes.count ?? 0,
      totalWorkouts: totalRes.count ?? 0,
      totalVolume,
    })
    setLoading(false)
  }

  async function repeatWorkout(workoutId: string) {
    const { data } = await supabase
      .from('workout_exercises')
      .select('exercise_id, exercise_name_snapshot, muscle_group_snapshot, position, workout_sets(set_number, reps, weight_kg)')
      .eq('workout_id', workoutId)
      .order('position')

    if (!data || data.length === 0) return

    const draft: WorkoutDraft = {
      version: 1,
      name: '',
      startedAt: new Date().toISOString(),
      exercises: data.map((we) => ({
        id: crypto.randomUUID(),
        exercise: {
          id: we.exercise_id ?? crypto.randomUUID(),
          name: we.exercise_name_snapshot,
          muscle_group: we.muscle_group_snapshot,
          is_custom: false,
          archived_at: null,
          created_at: '',
        },
        sets: (we.workout_sets as { set_number: number; reps: number; weight_kg: number }[])
          .sort((a, b) => a.set_number - b.set_number)
          .map((s) => ({
            id: crypto.randomUUID(),
            reps: s.reps.toString(),
            weight: s.weight_kg.toString(),
          })),
      })),
    }
    saveDraft(draft)
    navigate('/workout')
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  function formatVolume(vol: number) {
    if (vol >= 1000000) return `${(vol / 1000000).toFixed(1)}M`
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}K`
    return vol.toString()
  }

  return (
    <div className="px-5 pt-10 pb-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">GymTrack</h1>
        <p className="text-slate-500 text-sm mt-0.5">Your personal workout companion</p>
      </header>

      {draftSummary ? (
        <Link
          to="/workout"
          className="flex items-center justify-between w-full p-4 mb-6 bg-amber-500/10 border border-amber-500/30 rounded-lg transition-colors hover:bg-amber-500/15 active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <Play size={18} className="text-amber-400 ml-0.5" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Workout in progress</p>
              <p className="text-xs text-amber-400/80 mt-0.5">
                {elapsed} &middot; {draftSummary.exerciseCount} exercises &middot; {draftSummary.setCount} sets
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-amber-400/60" />
        </Link>
      ) : (
        <Link
          to="/workout"
          className="flex items-center justify-center gap-2.5 w-full py-4 mb-6 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-colors active:scale-[0.98] transform"
        >
          <Dumbbell size={20} />
          Start Workout
        </Link>
      )}

      <div className="grid grid-cols-3 gap-2.5 mb-6">
        <StatCard
          icon={<Flame size={16} className="text-orange-400" />}
          value={stats.thisWeek.toString()}
          label="This Week"
        />
        <StatCard
          icon={<Calendar size={16} className="text-sky-400" />}
          value={stats.totalWorkouts.toString()}
          label="Total"
        />
        <StatCard
          icon={<TrendingUp size={16} className="text-green-400" />}
          value={formatVolume(stats.totalVolume)}
          label="Volume"
        />
      </div>

      <section>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Recent Workouts
        </h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recentWorkouts.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <Dumbbell size={28} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No workouts yet. Start your first one!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentWorkouts.map((w) => (
              <div
                key={w.id}
                className="flex items-center gap-3 p-3.5 bg-slate-900 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <Link to={`/history/${w.id}`} className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm truncate">{w.name}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {w.completed_at ? formatDate(w.completed_at) : ''}
                  </p>
                </Link>
                <button
                  onClick={() => repeatWorkout(w.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-400 hover:text-green-300 bg-green-600/10 hover:bg-green-600/20 rounded-md transition-colors"
                  title="Repeat this workout"
                >
                  <RotateCcw size={12} />
                  Repeat
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-lg font-bold text-white leading-tight">{value}</p>
      <p className="text-[9px] text-slate-500 uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  )
}
