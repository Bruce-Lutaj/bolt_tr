import { useState, useEffect, useCallback } from 'react'
import { fetchAllExercises, createExercise, archiveExercise } from '../api/exercisesApi'
import type { Exercise } from '../types'

export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const result = await fetchAllExercises()
    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      setExercises(result.data)
    }
    setLoading(false)
  }

  const create = useCallback(async (name: string, muscleGroup: string): Promise<string | null> => {
    const result = await createExercise(name, muscleGroup)
    if (result.error) return result.error
    if (result.data) {
      setExercises((prev) => [...prev, result.data!].sort((a, b) => a.name.localeCompare(b.name)))
    }
    return null
  }, [])

  const archive = useCallback(async (id: string): Promise<string | null> => {
    const result = await archiveExercise(id)
    if (result.error) return result.error
    setExercises((prev) => prev.filter((e) => e.id !== id))
    return null
  }, [])

  return { exercises, loading, error, create, archive }
}
