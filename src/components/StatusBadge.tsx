export function StatusBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white shadow">
      <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
      Live
    </span>
  );
}
