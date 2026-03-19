interface EmptyStateProps {
  lastChecked: Date | null;
  onRefresh: () => void;
}

export function EmptyState({ lastChecked, onRefresh }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#1a1a1a] ring-1 ring-[#98ca3f]/20 text-4xl">
        📡
      </div>
      <h2 className="text-xl font-semibold text-white">No live streams right now</h2>
      <p className="text-sm text-gray-400">
        Platzi isn&apos;t streaming at the moment. We check every 5 minutes.
      </p>
      {lastChecked && (
        <p className="text-xs text-gray-500">
          Last checked: {lastChecked.toLocaleTimeString()}
        </p>
      )}
      <button
        onClick={onRefresh}
        className="mt-2 rounded-lg bg-[#98ca3f] px-6 py-2 text-sm font-semibold text-[#0d0d0d] transition hover:bg-[#aad44f] active:scale-95"
      >
        Check Now
      </button>
    </div>
  );
}
