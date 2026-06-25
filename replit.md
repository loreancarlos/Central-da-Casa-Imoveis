# Central da Casa Property Finder

Ferramenta interna para corretores de imóveis cadastrarem clientes compradores e encontrarem imóveis compatíveis.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/app run dev` — run the frontend (port 23863)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, TailwindCSS, shadcn/ui, TanStack Query
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/` — Drizzle table definitions (clientes, imoveis, matches, fontes-importacao)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/lib/matching.ts` — Scoring/matching algorithm
- `artifacts/app/src/` — React frontend (pages, components)

## Architecture decisions

- Contract-first: OpenAPI spec → codegen → typed hooks + Zod validators
- Matching is computed on-demand per client request; results are cached in the `matches` table and updated if the score changes
- Score breakdown: 40pts price range, 20pts property type, 20pts bedroom count, 20pts preferred neighborhood (max 100)
- Numeric DB fields (preco, area, score) stored as `numeric`; converted to `Number` in API responses
- Seed: 10 fictional clients and 30 properties all in Timóteo (MG) bairros

## Product

- **Dashboard**: totals (clients, properties, matches) and property breakdown by type
- **Clientes**: paginated + searchable table, modal form for create/edit/delete
- **Imóveis**: property catalog with filters (cidade, bairro, tipo, faixa de preço, quartos, vagas)
- **Matches**: select client → see scored property matches ordered by score → update status (NOVO, VISUALIZADO, INTERESSADO, DESCARTADO) → view details
- **Fontes**: manage partner real estate import sources (CRUD), tracks nome, url, ativo, ultimaExecucao, ultimoStatus

## User preferences

- App language: Portuguese (pt-BR)
- Prices formatted as BRL (R$)

## Multi-source import architecture

- `imoveis.fonte` — name of the source that imported the property (e.g. "Helena Imóveis")
- `imoveis.identificadorOrigem` — stable identifier from the connector (code, URL, etc.)
- Unique partial index `(fonte, identificadorOrigem) WHERE identificadorOrigem IS NOT NULL` prevents duplicate imports per source
- `fontes_importacao` table stores partner sources with activity tracking (ultimaExecucao, ultimoStatus)
- Seed: Helena Imóveis, Casa Linhares, Minas Caixa — all active

## Gotchas

- After changing `openapi.yaml`, always run codegen before touching route or frontend code
- `numeric` Drizzle columns return strings from the DB driver — always wrap with `Number()` before sending in responses
- Express 5: use `res.status().json(); return;` not `return res.status().json()`
- Drizzle partial index `.where()` requires a `sql\`\`` expression, not a raw column reference

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
