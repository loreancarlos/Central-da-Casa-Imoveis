import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, clientesTable, imoveisTable, matchesTable } from "@workspace/db";
import {
  GetMatchesForClienteParams,
  UpdateMatchStatusParams,
  UpdateMatchStatusBody,
  UpdateMatchStatusResponse,
} from "@workspace/api-zod";
import { calcularScore } from "../lib/matching";
import { imovelToResponse } from "./imoveis";

const router: IRouter = Router();

router.get("/matches", async (_req, res): Promise<void> => {
  const matches = await db.select().from(matchesTable).orderBy(matchesTable.createdAt);
  res.json(
    matches.map((m) => ({
      ...m,
      score: Number(m.score),
      createdAt: m.createdAt.toISOString(),
    }))
  );
});

router.get("/matches/cliente/:clienteId", async (req, res): Promise<void> => {
  const params = GetMatchesForClienteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [cliente] = await db
    .select()
    .from(clientesTable)
    .where(eq(clientesTable.id, params.data.clienteId));

  if (!cliente) {
    res.status(404).json({ error: "Cliente não encontrado" });
    return;
  }

  const imoveis = await db.select().from(imoveisTable);

  const existingMatches = await db
    .select()
    .from(matchesTable)
    .where(eq(matchesTable.clienteId, params.data.clienteId));

  const matchMap = new Map(existingMatches.map((m) => [m.imovelId, m]));

  const results = [];
  for (const imovel of imoveis) {
    const score = calcularScore(cliente, imovel);
    if (score === 0) continue;

    let match = matchMap.get(imovel.id);
    if (!match) {
      const [created] = await db
        .insert(matchesTable)
        .values({
          clienteId: cliente.id,
          imovelId: imovel.id,
          score: String(score),
          status: "NOVO",
        })
        .returning();
      match = created;
    } else if (Number(match.score) !== score) {
      const [updated] = await db
        .update(matchesTable)
        .set({ score: String(score) })
        .where(eq(matchesTable.id, match.id))
        .returning();
      match = updated;
    }

    results.push({
      matchId: match.id,
      score,
      status: match.status,
      imovel: imovelToResponse(imovel),
    });
  }

  results.sort((a, b) => b.score - a.score);

  res.json(results);
});

router.patch("/matches/:id/status", async (req, res): Promise<void> => {
  const params = UpdateMatchStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateMatchStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [match] = await db
    .update(matchesTable)
    .set({ status: parsed.data.status })
    .where(eq(matchesTable.id, params.data.id))
    .returning();

  if (!match) {
    res.status(404).json({ error: "Match não encontrado" });
    return;
  }

  res.json(
    UpdateMatchStatusResponse.parse({
      ...match,
      score: Number(match.score),
      createdAt: match.createdAt.toISOString(),
    })
  );
});

export default router;
