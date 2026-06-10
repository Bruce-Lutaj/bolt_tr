import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Dumbbell, TrendingUp, Calendar, Flame } from 'lucide-react'
import { supabase } from '../supabase'
import type { Workout } from '../types'

export default function Home() {
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([])
  const [stats, setStats] = useState({ thisWeek: 0, totalWorkouts: 0, totalVolume: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const [workoutsRes, weekRes, volumeRes] = await Promise.all([
      supabase
        .from('workouts')
        .select('*')
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(5),
      supabase
        .from('workouts')
        .select('id', { count: 'exact', head: true })
        .not('completed_at', 'is', null)
        .gte('completed_at', weekAgo.toISOString()),
      supabase
        .from('workout_sets')
        .select('reps, weight'),
    ])

    if (workoutsRes.data) setRecentWorkouts(workoutsRes.data)

    const totalVolume = volumeRes.data
      ? volumeRes.data.reduce((sum, s) => sum + s.reps * s.weight, 0)
      : 0

    setStats({
      thisWeek: weekRes.count ?? 0,
      totalWorkouts: workoutsRes.data?.length ?? 0,
      totalVolume,
    })
    setLoading(false)
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
    <div className="px-5 pt-12 pb-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-white">GymTrack</h1>
        <p className="text-slate-500 text-sm mt-1">Your personal workout companion</p>
      </header>

      <div className="grid grid-cols-3 gap-3 mb-8">
        <StatCard
          icon={<Flame size={18} className="text-orange-400" />}
          value={stats.thisWeek.toString()}
          label="This Week"
        />
        <StatCard
          icon={<Calendar size={18} className="text-blue-400" />}
          value={stats.totalWorkouts.toString()}
          label="Total"
        />
        <StatCard
          icon={<TrendingUp size={18} className="text-green-400" />}
          value={formatVolume(stats.totalVolume)}
          label="Volume (kg)"
        />
      </div>

      <Link
        to="/workout"
        className="flex items-center justify-center gap-2 w-full py-4 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl transition-colors active:scale-[0.98] transform"
      >
        <Dumbbell size={20} />
        Start Workout
      </Link>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Recent Workouts
        </h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recentWorkouts.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Dumbbell size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No workouts yet. Start your first one!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentWorkouts.map((w) => (
              <Link
                key={w.id}
                to={`/history/${w.id}`}
                className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div>
                  <p className="font-medium text-white">{w.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {w.completed_at ? formatDate(w.completed_at) : ''}
                  </p>
                </div>
                <div className="text-slate-600 text-xs">View &rarr;</div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</p>
    </div>
  )
}
