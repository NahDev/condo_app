import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { env } from "../env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getKey(): Buffer {
  const key = Buffer.from(env.DOCUMENT_ENCRYPTION_KEY, "hex");
  if (key.length !== 32) {
    throw new Error("DOCUMENT_ENCRYPTION_KEY deve ter 32 bytes (64 caracteres hex)");
  }
  return key;
}

/** Criptografa um texto (ex: CPF/RG) para armazenamento em repouso. */
export function encryptField(texto: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(texto, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString("base64"), authTag.toString("base64"), ciphertext.toString("base64")].join(
    ".",
  );
}

/** Reverte encryptField. Lança erro se o valor não estiver no formato esperado. */
export function decryptField(valor: string): string {
  const [ivB64, authTagB64, ciphertextB64] = valor.split(".");
  if (!ivB64 || !authTagB64 || !ciphertextB64) {
    throw new Error("Valor criptografado em formato inválido");
  }

  const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(authTagB64, "base64"));

  const texto = Buffer.concat([
    decipher.update(Buffer.from(ciphertextB64, "base64")),
    decipher.final(),
  ]);

  return texto.toString("utf8");
}

/** Mascara um documento pra exibição (ex: CPF/RG), mostrando só os últimos 4 caracteres alfanuméricos. */
export function maskDocumento(documento: string): string {
  const visiveis = documento.replace(/[^a-zA-Z0-9]/g, "").slice(-4);
  return `••••${visiveis}`;
}
