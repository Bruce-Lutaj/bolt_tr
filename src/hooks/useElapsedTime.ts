import { useState, useEffect, useRef } from 'react'

export function useElapsedTime(startedAt: string | null): string {
  const [elapsed, setElapsed] = useState(() => format(startedAt))
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!startedAt) {
      setElapsed('00:00')
      return
    }

    setElapsed(format(startedAt))
    intervalRef.current = setInterval(() => {
      setElapsed(format(startedAt))
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [startedAt])

  return elapsed
}

function format(startedAt: string | null): string {
  if (!startedAt) return '00:00'
  const diff = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000))
  const hrs = Math.floor(diff / 3600)
  const mins = Math.floor((diff % 3600) / 60)
  const secs = diff % 60
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}
