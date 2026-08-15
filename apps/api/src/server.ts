import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { env } from "./env";
import { authRoutes } from "./routes/auth";
import { unidadesRoutes } from "./routes/unidades";
import { avisosRoutes } from "./routes/avisos";
import { areasComunsRoutes } from "./routes/areas-comuns";
import { reservasRoutes } from "./routes/reservas";
import { ocorrenciasRoutes } from "./routes/ocorrencias";
import { visitantesRoutes } from "./routes/visitantes";
import { encomendasRoutes } from "./routes/encomendas";
import { usuariosRoutes } from "./routes/usuarios";

async function main() {
  const app = Fastify({ logger: true });

  await app.register(helmet);
  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });
  await app.register(cors, { origin: env.WEB_ORIGIN });

  app.get("/health", async () => ({ status: "ok" }));

  await app.register(authRoutes);
  await app.register(unidadesRoutes);
  await app.register(avisosRoutes);
  await app.register(areasComunsRoutes);
  await app.register(reservasRoutes);
  await app.register(ocorrenciasRoutes);
  await app.register(visitantesRoutes);
  await app.register(encomendasRoutes);
  await app.register(usuariosRoutes);

  await app.listen({ port: env.PORT, host: "0.0.0.0" });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
