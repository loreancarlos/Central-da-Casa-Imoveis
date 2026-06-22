import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db, clientesTable, imoveisTable, matchesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/dashboard/stats", async (_req, res): Promise<void> => {
  const [clienteCount, imovelCount, matchCount, tipoBreakdown] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(clientesTable),
    db.select({ count: sql<number>`count(*)::int` }).from(imoveisTable),
    db.select({ count: sql<number>`count(*)::int` }).from(matchesTable),
    db
      .select({
        tipo: imoveisTable.tipo,
        count: sql<number>`count(*)::int`,
      })
      .from(imoveisTable)
      .groupBy(imoveisTable.tipo)
      .orderBy(sql`count(*) desc`),
  ]);

  res.json({
    totalClientes: clienteCount[0]?.count ?? 0,
    totalImoveis: imovelCount[0]?.count ?? 0,
    totalMatches: matchCount[0]?.count ?? 0,
    imovelPorTipo: tipoBreakdown,
  });
});

export default router;
