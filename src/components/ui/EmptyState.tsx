import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  message: string
  actionLabel?: string
  actionTo?: string
}

export function EmptyState({ icon, message, actionLabel, actionTo }: EmptyStateProps) {
  return (
    <div className="text-center py-12 text-slate-500">
      <div className="flex justify-center mb-2 opacity-40">{icon}</div>
      <p className="text-sm">{message}</p>
      {actionLabel && actionTo && (
        <Link to={actionTo} className="text-green-500 text-sm mt-2 inline-block hover:text-green-400">
          {actionLabel}
        </Link>
      )}
    </div>
  )
}
