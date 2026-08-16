# Condo App

Plataforma de gestão de condomínios (SaaS direto para síndicos), atendendo síndico/gestão, morador e portaria. Ver plano completo e roadmap em `C:\Users\nahuan\.claude\plans\glowing-marinating-minsky.md`.

## Stack

- Monorepo: pnpm workspaces + Turborepo
- Backend: Fastify + TypeScript + Prisma + PostgreSQL (`apps/api`)
- Web: Next.js 14 (App Router) + Tailwind (`apps/web`)
- Mobile: Expo/React Native — planejado para a Fase 2 (`apps/mobile`, ainda vazio)
- Tipos e client de API compartilhados: `packages/shared`
- Prisma schema/client: `packages/db`

## Setup

1. Instale as dependências:

   ```bash
   pnpm install
   ```

2. Suba o Postgres local (requer Docker Desktop instalado e rodando):

   ```bash
   docker compose up -d
   ```

3. Copie os arquivos de ambiente:

   ```bash
   cp packages/db/.env.example packages/db/.env
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.local.example apps/web/.env.local
   ```

   Edite `apps/api/.env` e troque `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET`/`DOCUMENT_ENCRYPTION_KEY` por valores aleatórios antes de qualquer uso além de desenvolvimento local (`DOCUMENT_ENCRYPTION_KEY` precisa ter exatamente 64 caracteres hexadecimais — gerar com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).

4. Rode as migrations e o seed:

   ```bash
   pnpm db:migrate
   pnpm db:seed
   ```

5. Suba tudo em modo dev:

   ```bash
   pnpm dev
   ```

   - API: http://localhost:3333 (healthcheck em `/health`)
   - Web: http://localhost:3000

6. Login de teste (criado pelo seed):

   - `sindico@exemplo.com` / `senha123`
   - `morador@exemplo.com` / `senha123`

## Scripts úteis

- `pnpm dev` — roda todos os apps em modo desenvolvimento (via Turborepo)
- `pnpm build` — build de produção de todos os apps
- `pnpm typecheck` — checagem de tipos em todo o monorepo
- `pnpm db:migrate` — cria/aplica migration em desenvolvimento (usa shadow database)
- `pnpm db:deploy` — aplica migrations pendentes em produção (sem shadow database)
- `pnpm db:seed` — roda o seed (idempotente, seguro rodar várias vezes)
- `pnpm db:studio` — abre o Prisma Studio para inspecionar o banco

## Deploy (Railway)

O projeto está preparado para rodar em 3 serviços separados dentro de um mesmo projeto Railway, todos apontando para este repositório (Root Directory = raiz do monorepo em todos eles), com Build/Start Command customizados por serviço:

### 1. Postgres
Adicionar o plugin "Postgres" do próprio Railway (gera `DATABASE_URL` automaticamente).

### 2. Serviço API (`@condo/api`)
- **Build Command**: `pnpm install --frozen-lockfile && pnpm --filter @condo/db exec prisma generate`
- **Start Command**: `pnpm --filter @condo/db exec prisma migrate deploy && pnpm --filter @condo/api start`

  > `@condo/api` roda via `tsx` mesmo em produção (script `start`), não via `tsc build` + `node dist`. Os pacotes internos (`@condo/shared`, `@condo/db`) são TypeScript puro sem build próprio — `node` sozinho não consegue resolvê-los, mas o `tsx` sim, do mesmo jeito que em dev.
- **Variáveis de ambiente**:
  - `DATABASE_URL` → referenciar a do serviço Postgres (`${{Postgres.DATABASE_URL}}`)
  - `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` / `DOCUMENT_ENCRYPTION_KEY` → valores aleatórios longos (nunca reaproveitar os de dev; `DOCUMENT_ENCRYPTION_KEY` precisa ter 64 caracteres hex)
  - `WEB_ORIGIN` → URL pública do serviço Web (ex: `https://condo-app-web.up.railway.app`)
  - `PORT` → Railway injeta automaticamente, não precisa setar

### 3. Serviço Web (`@condo/web`)
- **Build Command**: `pnpm install --frozen-lockfile && pnpm --filter @condo/web build`
- **Start Command**: `pnpm --filter @condo/web start`
- **Variáveis de ambiente**:
  - `NEXT_PUBLIC_API_URL` → URL pública do serviço API (ex: `https://condo-app-api.up.railway.app`). É lida em **build time**, então precisa estar configurada antes do primeiro deploy do Web.

> Ordem recomendada: subir o Postgres → subir a API (pegar a URL pública gerada) → configurar `NEXT_PUBLIC_API_URL` no Web com essa URL → subir o Web → voltar na API e configurar `WEB_ORIGIN` com a URL pública do Web → redeploy da API.

Depois do primeiro deploy, rodar o seed uma vez (via `railway run` apontando pro serviço API, ou shell do serviço) se quiser dados de exemplo — em produção real normalmente não se roda o seed, só as migrations.

## Estado atual

Fase 1 completa (Avisos, Unidades, Áreas comuns, Reservas, Ocorrências) + Portaria (Visitantes/Encomendas) da Fase 2 + gestão de usuários com permissões granulares por recurso. Autenticação com JWT, rotação e revogação de refresh token. Segurança básica de produção (rate limiting, CORS travado, security headers) implementada. LGPD mínimo: página de política de privacidade (`/privacidade`) e documento de visitante criptografado em repouso + mascarado na exibição.

Pendente do roadmap: Cobrança, app mobile, CI/CD, testes automatizados, upload de imagens.

## Deploy pausado

Os serviços no Railway foram removidos/pausados para não consumir o crédito do trial gratuito enquanto não estão em uso. Pra reativar: no painel do Railway, em cada serviço (Postgres → API → Web, nessa ordem), abrir o histórico de deployments e clicar em "Redeploy" no último deploy. O código e as variáveis de ambiente continuam salvos, nada se perde.
