export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-light-bg-muted dark:bg-dark-bg-muted ${className ?? ""}`}
    />
  );
}

export function ListSkeleton({ linhas = 3 }: { linhas?: number }) {
  return (
    <ul className="space-y-3">
      {Array.from({ length: linhas }).map((_, i) => (
        <li
          key={i}
          className="rounded-md border border-light-border bg-light-card p-4 dark:border-dark-border dark:bg-dark-card"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="mt-3 h-3 w-2/3" />
        </li>
      ))}
    </ul>
  );
}
