---
name: Helena Connector — Detail Page Enrichment
description: Architecture and decisions for enriching HelenaConnector with detail page data (fotos, quartos, banheiros, vagas, area, descricao)
---

## Rule
HelenaConnector fetches listing pages first, then visits each `urlOriginal` to extract detail data (quartos, banheiros, vagas, area, descricao, fotos, real preco). Sequential with 400ms delay between detail fetches to avoid overloading the server.

## Key decisions
- `fotos` stored as `text[]` (PostgreSQL native array) in `imoveis` table via Drizzle `text("fotos").array().default([]).notNull()`
- `fotos` field added to OpenAPI `Imovel` schema as optional array; `PropertyImportData` already had `fotos?: string[]`
- Regex-based parsing with multiple fallback patterns — site blocks curl but actual fetch() works from Node.js runtime
- Detail parser uses `TextDecoder("iso-8859-1")` same as listing (site sends latin-1 encoding)
- `imovelToResponse` explicitly spreads `fotos: i.fotos ?? []` to ensure always returns array

**Why:** HTML-only parsing (no Playwright/browser automation) is the project constraint. Multiple fallback regexes handle unknown HTML structure gracefully.

**How to apply:** When updating the connector, always return `fotos` as `string[]` (empty array if none found). Never remove the delay between detail page fetches.
