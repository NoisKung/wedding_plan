export function GoldDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex-1 h-px bg-[var(--gold)] opacity-40" />
      <div className="w-1 h-1 rounded-full bg-[var(--gold)] opacity-60" />
      <div className="flex-1 h-px bg-[var(--gold)] opacity-40" />
    </div>
  );
}
