interface SectionHeaderProps {
  children: string
}

export function SectionHeader({ children }: SectionHeaderProps) {
  return (
    <h2 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
      {children}
    </h2>
  )
}
