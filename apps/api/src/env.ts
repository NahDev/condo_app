import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(10),
  JWT_REFRESH_SECRET: z.string().min(10),
  DOCUMENT_ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-f]{64}$/i, "deve ter 64 caracteres hexadecimais (32 bytes)"),
  PORT: z.coerce.number().default(3333),
  WEB_ORIGIN: z.string().min(1),
});

export const env = envSchema.parse(process.env);
