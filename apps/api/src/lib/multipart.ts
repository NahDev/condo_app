import type { FastifyRequest } from "fastify";
import { TAMANHO_MAXIMO_BYTES } from "./storage";

export interface ArquivoRecebido {
  buffer: Buffer;
  mimetype: string;
}

export interface MultipartLido {
  campos: Record<string, string>;
  foto: ArquivoRecebido | null;
}

/**
 * Lê um request multipart/form-data campo a campo. Usado nas rotas de criação que
 * aceitam uma foto opcional junto dos demais campos de texto — o @fastify/multipart
 * não popula request.body automaticamente, então cada rota parseia via este helper
 * em vez de usar o parser JSON padrão.
 */
export async function lerMultipart(request: FastifyRequest): Promise<MultipartLido> {
  const campos: Record<string, string> = {};
  let foto: ArquivoRecebido | null = null;

  const parts = request.parts({ limits: { fileSize: TAMANHO_MAXIMO_BYTES } });
  for await (const part of parts) {
    if (part.type === "file") {
      if (part.fieldname === "foto" && !foto) {
        foto = { buffer: await part.toBuffer(), mimetype: part.mimetype };
      } else {
        part.file.resume();
      }
    } else {
      campos[part.fieldname] = part.value as string;
    }
  }

  return { campos, foto };
}
