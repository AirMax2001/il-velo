export function ErrorState({
  message,
  onRetry
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-red-400/20 bg-red-500/5 py-10 text-center">
      <span className="mb-3 text-2xl text-red-300">⚠</span>
      <p className="text-sm text-red-200">{message}</p>
      {onRetry && (
        <button className="veil-btn-secondary mt-4" onClick={onRetry}>
          Riprova
        </button>
      )}
    </div>
  );
}
