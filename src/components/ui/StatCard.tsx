import type { ReactNode } from 'react'

interface StatCardProps {
  icon: ReactNode
  value: string
  label: string
  size?: 'sm' | 'md'
}

export function StatCard({ icon, value, label, size = 'md' }: StatCardProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-center">
      <div className="flex justify-center mb-0.5">{icon}</div>
      <p className={`font-bold text-white leading-tight truncate ${size === 'sm' ? 'text-sm' : 'text-lg'}`}>
        {value}
      </p>
      <p className={`text-slate-500 uppercase tracking-wide mt-0.5 ${size === 'sm' ? 'text-[8px]' : 'text-[9px]'}`}>
        {label}
      </p>
    </div>
  )
}
