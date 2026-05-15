type OfflineWarningProps = {
  isOffline: boolean;
};

export function OfflineWarning({ isOffline }: OfflineWarningProps) {
  if (!isOffline) return undefined;

  return (
    <div data-testid="offline-warning" role="status" className="bg-warning/30 px-4 py-2 text-center text-sm font-semibold text-warning-content">
      You are offline. Your local data is still available.
    </div>
  );
}
