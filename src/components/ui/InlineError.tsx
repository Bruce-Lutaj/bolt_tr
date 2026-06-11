interface InlineErrorProps {
  error: string | null
  className?: string
}

export function InlineError({ error, className }: InlineErrorProps) {
  if (!error) return null
  return (
    <div className={`px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg ${className ?? ''}`}>
      <p className="text-sm text-red-400">{error}</p>
    </div>
  )
}
