import Image from "next/image";

interface EmptyStateProps {
  icone: string;
  titulo: string;
  podeCriar?: boolean;
  dicaCriacao?: string;
}

export function EmptyState({ icone, titulo, podeCriar, dicaCriacao }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-light-border bg-light-card/50 p-8 text-center dark:border-dark-border dark:bg-dark-card/50">
      <Image
        src={icone}
        alt=""
        width={40}
        height={40}
        className="h-10 w-10 object-contain opacity-50"
      />
      <div>
        <p className="text-sm font-medium text-light-text dark:text-dark-text">{titulo}</p>
        {podeCriar && dicaCriacao && (
          <p className="mt-1 text-xs text-light-text-muted dark:text-dark-text-muted">
            {dicaCriacao}
          </p>
        )}
      </div>
    </div>
  );
}
