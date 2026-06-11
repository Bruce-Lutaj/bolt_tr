import { useState, useEffect, useMemo } from 'react'
import { fetchAllExercises, fetchRecentExercises } from '../api/exercisesApi'
import type { Exercise } from '../types'

export function useExercisePicker() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [recentExercises, setRecentExercises] = useState<Exercise[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeGroup, setActiveGroup] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const [allRes, recentRes] = await Promise.all([
      fetchAllExercises(),
      fetchRecentExercises(),
    ])

    if (allRes.error) setError(allRes.error)
    if (allRes.data) setExercises(allRes.data)
    if (recentRes.data) setRecentExercises(recentRes.data)
    setLoading(false)
  }

  const filtered = useMemo(() => {
    return exercises.filter((e) => {
      const matchesGroup = activeGroup === 'All' || e.muscle_group === activeGroup
      const matchesSearch =
        !searchQuery ||
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.muscle_group.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesGroup && matchesSearch
    })
  }, [exercises, activeGroup, searchQuery])

  const grouped = useMemo(() => {
    return filtered.reduce<Record<string, Exercise[]>>((acc, ex) => {
      if (!acc[ex.muscle_group]) acc[ex.muscle_group] = []
      acc[ex.muscle_group].push(ex)
      return acc
    }, {})
  }, [filtered])

  const showRecent = !searchQuery && activeGroup === 'All' && recentExercises.length > 0

  return {
    exercises,
    recentExercises,
    filtered,
    grouped,
    showRecent,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    activeGroup,
    setActiveGroup,
  }
}
