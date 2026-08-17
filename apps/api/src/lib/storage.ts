import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

export const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024;

const EXTENSAO_POR_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function extensaoPermitida(mimetype: string): string | null {
  return EXTENSAO_POR_MIME[mimetype] ?? null;
}

export async function salvarImagem(buffer: Buffer, mimetype: string, pasta: string): Promise<string> {
  const extensao = extensaoPermitida(mimetype);
  if (!extensao) {
    throw new Error("Tipo de arquivo não permitido");
  }

  const dirDestino = path.join(UPLOAD_ROOT, pasta);
  await mkdir(dirDestino, { recursive: true });

  const nomeArquivo = `${randomUUID()}.${extensao}`;
  await writeFile(path.join(dirDestino, nomeArquivo), buffer);

  return `/uploads/${pasta}/${nomeArquivo}`;
}

export async function excluirImagem(fotoUrl: string): Promise<void> {
  const relativo = fotoUrl.replace(/^\/uploads\//, "");
  try {
    await unlink(path.join(UPLOAD_ROOT, relativo));
  } catch {
    // arquivo pode já não existir — ignora
  }
}
