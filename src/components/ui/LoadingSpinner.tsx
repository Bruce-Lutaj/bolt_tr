export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={className ?? 'flex justify-center py-12'}>
      <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
