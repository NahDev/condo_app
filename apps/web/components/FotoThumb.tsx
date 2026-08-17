import { API_BASE_URL } from "@/lib/api";

export function FotoThumb({ fotoUrl, alt }: { fotoUrl: string; alt: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- URL dinâmica (origem da API varia por ambiente)
    <img
      src={`${API_BASE_URL}${fotoUrl}`}
      alt={alt}
      className="mt-2 h-32 w-full rounded-md border border-light-border object-cover dark:border-dark-border"
    />
  );
}
