import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: boolean
}

export function Card({ children, className, padding = true }: CardProps) {
  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-lg ${padding ? 'p-4' : ''} ${className ?? ''}`}>
      {children}
    </div>
  )
}
