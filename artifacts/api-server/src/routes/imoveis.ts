import { Router, type IRouter } from "express";
import { sql, and, gte, lte } from "drizzle-orm";
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

  const { cidade, bairro, tipo, precoMin, precoMax, quartos, vagas, page, limit } = query.data;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (cidade) conditions.push(sql`${imoveisTable.cidade} ILIKE ${"%" + cidade + "%"}`);
  if (bairro) conditions.push(sql`${imoveisTable.bairro} ILIKE ${"%" + bairro + "%"}`);
  if (tipo) conditions.push(sql`${imoveisTable.tipo} ILIKE ${"%" + tipo + "%"}`);
  if (precoMin != null) conditions.push(gte(imoveisTable.preco, String(precoMin)));
  if (precoMax != null) conditions.push(lte(imoveisTable.preco, String(precoMax)));
  if (quartos != null) conditions.push(gte(imoveisTable.quartos, quartos));
  if (vagas != null) conditions.push(gte(imoveisTable.vagas, vagas));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(imoveisTable)
      .where(whereClause)
      .orderBy(imoveisTable.createdAt)
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

export function imovelToResponse(i: typeof imoveisTable.$inferSelect) {
  return {
    ...i,
    preco: Number(i.preco),
    area: Number(i.area),
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  };
}

export default router;
