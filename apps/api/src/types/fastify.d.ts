import type { TokenPayload } from "../auth/jwt";

declare module "fastify" {
  interface FastifyRequest {
    usuario?: TokenPayload;
  }
}
