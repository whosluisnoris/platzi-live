export function StatusBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#98ca3f] px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-[#0d0d0d] shadow">
      <span className="h-2 w-2 animate-pulse rounded-full bg-[#0d0d0d]/50" />
      Live
    </span>
  );
}
