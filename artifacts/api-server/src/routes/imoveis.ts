import { Router, type IRouter } from "express";
import { sql, and, gte, lte, eq, asc, desc } from "drizzle-orm";
import { db, imoveisTable } from "@workspace/db";
import {
  ListImoveisQueryParams,
  GetImovelParams,
  GetImovelResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/imoveis", async (req, res): Promise<void> => {
  const query = ListImoveisQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { cidade, bairro, tipo, precoMin, precoMax, quartos, banheiros, vagas, orderBy, orderDir, page, limit } = query.data;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (cidade) conditions.push(sql`${imoveisTable.cidade} ILIKE ${"%" + cidade + "%"}`);
  if (bairro) conditions.push(sql`${imoveisTable.bairro} ILIKE ${"%" + bairro + "%"}`);
  if (tipo) conditions.push(sql`${imoveisTable.tipo} ILIKE ${"%" + tipo + "%"}`);
  if (precoMin != null) conditions.push(gte(imoveisTable.preco, String(precoMin)));
  if (precoMax != null) conditions.push(lte(imoveisTable.preco, String(precoMax)));
  if (quartos != null) conditions.push(gte(imoveisTable.quartos, quartos));
  if (banheiros != null) conditions.push(gte(imoveisTable.banheiros, banheiros));
  if (vagas != null) conditions.push(gte(imoveisTable.vagas, vagas));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const sortCol = orderBy === "preco" ? imoveisTable.preco : imoveisTable.createdAt;
  const sortOrder = orderDir === "asc" ? asc(sortCol) : desc(sortCol);

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(imoveisTable)
      .where(whereClause)
      .orderBy(sortOrder)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(imoveisTable)
      .where(whereClause),
  ]);

  res.json({
    data: data.map(imovelToResponse),
    total: countResult[0]?.count ?? 0,
    page,
    limit,
  });
});

router.get("/imoveis/:id", async (req, res): Promise<void> => {
  const params = GetImovelParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [imovel] = await db
    .select()
    .from(imoveisTable)
    .where(eq(imoveisTable.id, params.data.id));

  if (!imovel) {
    res.status(404).json({ error: "Imóvel não encontrado" });
    return;
  }

  res.json(GetImovelResponse.parse(imovelToResponse(imovel)));
});

router.patch("/imoveis/:id/preco", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }

  const { preco } = req.body;
  if (typeof preco !== "number" || preco < 0) {
    res.status(400).json({ error: "Preço inválido" });
    return;
  }

  const [updated] = await db
    .update(imoveisTable)
    .set({ preco: String(preco), updatedAt: new Date() })
    .where(eq(imoveisTable.id, id))
    .returning();

  if (!updated) { res.status(404).json({ error: "Imóvel não encontrado" }); return; }

  res.json(imovelToResponse(updated));
});

export function imovelToResponse(i: typeof imoveisTable.$inferSelect) {
  return {
    ...i,
    preco: Number(i.preco),
    area: Number(i.area),
    fotos: i.fotos ?? [],
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  };
}

export default router;
