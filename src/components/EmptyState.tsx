interface EmptyStateProps {
  lastChecked: Date | null;
  onRefresh: () => void;
}

export function EmptyState({ lastChecked, onRefresh }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="text-5xl">📡</div>
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
        className="mt-2 rounded-lg bg-gray-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-600 active:scale-95"
      >
        Check Now
      </button>
    </div>
  );
}
