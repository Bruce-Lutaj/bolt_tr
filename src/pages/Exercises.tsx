import { useEffect, useState } from 'react'
import { Plus, X, Search } from 'lucide-react'
import { supabase } from '../supabase'
import type { Exercise } from '../types'

const MUSCLE_GROUPS = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core']

export default function Exercises() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newGroup, setNewGroup] = useState('Chest')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    loadExercises()
  }, [])

  async function loadExercises() {
    const { data } = await supabase
      .from('exercises')
      .select('*')
      .order('muscle_group')
      .order('name')
    if (data) setExercises(data)
    setLoading(false)
  }

  async function addExercise() {
    if (!newName.trim()) return
    setAdding(true)
    const { data, error } = await supabase
      .from('exercises')
      .insert({ name: newName.trim(), muscle_group: newGroup })
      .select()
      .single()
    if (!error && data) {
      setExercises([...exercises, data].sort((a, b) => a.name.localeCompare(b.name)))
      setNewName('')
      setShowAdd(false)
    }
    setAdding(false)
  }

  const filtered = exercises.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.muscle_group.toLowerCase().includes(search.toLowerCase())
  )

  const grouped = filtered.reduce<Record<string, Exercise[]>>((acc, ex) => {
    if (!acc[ex.muscle_group]) acc[ex.muscle_group] = []
    acc[ex.muscle_group].push(ex)
    return acc
  }, {})

  return (
    <div className="px-5 pt-12 pb-6">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Exercises</h1>
          <p className="text-slate-500 text-sm mt-0.5">{exercises.length} exercises</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={16} />
          Add
        </button>
      </header>

      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
        <input
          type="text"
          placeholder="Search exercises..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-green-600"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([group, exs]) => (
            <div key={group}>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
                {group} ({exs.length})
              </p>
              <div className="space-y-1">
                {exs.map((ex) => (
                  <div
                    key={ex.id}
                    className="px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white"
                  >
                    {ex.name}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-end sm:items-center justify-center">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Add Exercise</h2>
              <button
                onClick={() => setShowAdd(false)}
                className="p-2 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Exercise Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dumbbell Flyes"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-green-600"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Muscle Group</label>
                <div className="grid grid-cols-3 gap-2">
                  {MUSCLE_GROUPS.map((g) => (
                    <button
                      key={g}
                      onClick={() => setNewGroup(g)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        newGroup === g
                          ? 'bg-green-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={addExercise}
                disabled={!newName.trim() || adding}
                className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl transition-colors"
              >
                {adding ? 'Adding...' : 'Add Exercise'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
