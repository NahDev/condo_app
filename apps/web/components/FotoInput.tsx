"use client";

interface FotoInputProps {
  onChange: (file: File | null) => void;
  resetKey: number;
}

export function FotoInput({ onChange, resetKey }: FotoInputProps) {
  return (
    <input
      key={resetKey}
      type="file"
      accept="image/jpeg,image/png,image/webp"
      onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      className="block w-full text-sm text-light-text-muted file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-light-bg-muted file:px-3 file:py-2 file:text-sm file:font-medium file:text-light-text hover:file:bg-light-border dark:text-dark-text-muted dark:file:bg-dark-bg-muted dark:file:text-dark-text dark:hover:file:bg-dark-border"
    />
  );
}
