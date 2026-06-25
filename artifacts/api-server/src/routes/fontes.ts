import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, fontesImportacaoTable } from "@workspace/db";
import {
  CreateFonteBody,
  GetFonteParams,
  GetFonteResponse,
  UpdateFonteParams,
  UpdateFonteBody,
  UpdateFonteResponse,
  DeleteFonteParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/fontes", async (_req, res): Promise<void> => {
  const fontes = await db
    .select()
    .from(fontesImportacaoTable)
    .orderBy(fontesImportacaoTable.nome);
  res.json(fontes.map(fonteToResponse));
});

router.post("/fontes", async (req, res): Promise<void> => {
  const parsed = CreateFonteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [fonte] = await db
    .insert(fontesImportacaoTable)
    .values({
      nome: parsed.data.nome,
      url: parsed.data.url,
      ativo: parsed.data.ativo ?? true,
      ultimaExecucao: parsed.data.ultimaExecucao ? new Date(parsed.data.ultimaExecucao) : null,
      ultimoStatus: parsed.data.ultimoStatus ?? null,
    })
    .returning();

  res.status(201).json(GetFonteResponse.parse(fonteToResponse(fonte)));
});

router.get("/fontes/:id", async (req, res): Promise<void> => {
  const params = GetFonteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [fonte] = await db
    .select()
    .from(fontesImportacaoTable)
    .where(eq(fontesImportacaoTable.id, params.data.id));

  if (!fonte) {
    res.status(404).json({ error: "Fonte não encontrada" });
    return;
  }

  res.json(GetFonteResponse.parse(fonteToResponse(fonte)));
});

router.put("/fontes/:id", async (req, res): Promise<void> => {
  const params = UpdateFonteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateFonteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [fonte] = await db
    .update(fontesImportacaoTable)
    .set({
      nome: parsed.data.nome,
      url: parsed.data.url,
      ativo: parsed.data.ativo ?? true,
      ultimaExecucao: parsed.data.ultimaExecucao ? new Date(parsed.data.ultimaExecucao) : null,
      ultimoStatus: parsed.data.ultimoStatus ?? null,
      updatedAt: new Date(),
    })
    .where(eq(fontesImportacaoTable.id, params.data.id))
    .returning();

  if (!fonte) {
    res.status(404).json({ error: "Fonte não encontrada" });
    return;
  }

  res.json(UpdateFonteResponse.parse(fonteToResponse(fonte)));
});

router.delete("/fontes/:id", async (req, res): Promise<void> => {
  const params = DeleteFonteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(fontesImportacaoTable)
    .where(eq(fontesImportacaoTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Fonte não encontrada" });
    return;
  }

  res.sendStatus(204);
});

function fonteToResponse(f: typeof fontesImportacaoTable.$inferSelect) {
  return {
    ...f,
    ultimaExecucao: f.ultimaExecucao ? f.ultimaExecucao.toISOString() : null,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
  };
}

export default router;
