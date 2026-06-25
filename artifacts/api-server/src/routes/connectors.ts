import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, historicoImportacoesTable } from "@workspace/db";
import { connectorRegistry } from "../connectors/registry";
import { propertyImportService } from "../services/import.service";

const router: IRouter = Router();

router.get("/connectors", (_req, res): void => {
  const list = connectorRegistry.list().map((c) => ({ nome: c.getName() }));
  res.json(list);
});

router.post("/connectors/:nome/importar", async (req, res): Promise<void> => {
  const { nome } = req.params;
  const connector = connectorRegistry.get(nome);

  if (!connector) {
    res.status(404).json({ error: `Conector "${nome}" não encontrado` });
    return;
  }

  const result = await propertyImportService.runImport(connector);

  res.json({
    sucesso: true,
    importados: result.importados,
    atualizados: result.atualizados,
    ignorados: result.ignorados,
  });
});

router.get("/importacoes", async (_req, res): Promise<void> => {
  const historico = await db
    .select()
    .from(historicoImportacoesTable)
    .orderBy(desc(historicoImportacoesTable.inicioExecucao));

  res.json(historico.map(historicoToResponse));
});

function historicoToResponse(h: typeof historicoImportacoesTable.$inferSelect) {
  return {
    ...h,
    inicioExecucao: h.inicioExecucao.toISOString(),
    fimExecucao: h.fimExecucao ? h.fimExecucao.toISOString() : null,
    createdAt: h.createdAt.toISOString(),
  };
}

export default router;
