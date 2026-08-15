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

   Edite `apps/api/.env` e troque `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` por valores aleatórios antes de qualquer uso além de desenvolvimento local.

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
- `pnpm db:studio` — abre o Prisma Studio para inspecionar o banco

## Estado atual

Escopo desta primeira rodada (Fase 1, itens 1–3 do roadmap): fundação do monorepo, autenticação multi-tenant (JWT) e CRUD básico de unidades. Os módulos de negócio (avisos, reservas, ocorrências, financeiro, portaria) e o app mobile estão no roadmap mas ainda não implementados.
