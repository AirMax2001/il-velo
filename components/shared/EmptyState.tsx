export function EmptyState({
  icon = "◇",
  title,
  description,
  action
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <span className="mb-4 text-3xl text-white/20">{icon}</span>
      <p className="text-lg text-veil-gold">{title}</p>
      {description && (
        <p className="mt-2 max-w-sm text-sm leading-6 text-white/55">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
