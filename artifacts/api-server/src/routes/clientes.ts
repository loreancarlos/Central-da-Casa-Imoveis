import { Router, type IRouter } from "express";
import { eq, ilike, sql, and } from "drizzle-orm";
import { db, clientesTable } from "@workspace/db";
import {
  ListClientesQueryParams,
  CreateClienteBody,
  GetClienteParams,
  GetClienteResponse,
  UpdateClienteParams,
  UpdateClienteBody,
  UpdateClienteResponse,
  DeleteClienteParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/clientes", async (req, res): Promise<void> => {
  const query = ListClientesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { page, limit, search } = query.data;
  const offset = (page - 1) * limit;

  const whereClause = search
    ? ilike(clientesTable.nome, `%${search}%`)
    : undefined;

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(clientesTable)
      .where(whereClause)
      .orderBy(clientesTable.createdAt)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(clientesTable)
      .where(whereClause),
  ]);

  res.json({
    data: data.map(clienteToResponse),
    total: countResult[0]?.count ?? 0,
    page,
    limit,
  });
});

router.post("/clientes", async (req, res): Promise<void> => {
  const parsed = CreateClienteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [cliente] = await db
    .insert(clientesTable)
    .values({
      nome: parsed.data.nome,
      telefone: parsed.data.telefone,
      tipoImovelDesejado: parsed.data.tipoImovelDesejado,
      cidade: parsed.data.cidade,
      bairroPreferido: parsed.data.bairroPreferido ?? null,
      precoMinimo: String(parsed.data.precoMinimo),
      precoMaximo: String(parsed.data.precoMaximo),
      quartosMinimos: parsed.data.quartosMinimos,
      observacoes: parsed.data.observacoes ?? null,
    })
    .returning();

  res.status(201).json(GetClienteResponse.parse(clienteToResponse(cliente)));
});

router.get("/clientes/:id", async (req, res): Promise<void> => {
  const params = GetClienteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [cliente] = await db
    .select()
    .from(clientesTable)
    .where(eq(clientesTable.id, params.data.id));

  if (!cliente) {
    res.status(404).json({ error: "Cliente não encontrado" });
    return;
  }

  res.json(GetClienteResponse.parse(clienteToResponse(cliente)));
});

router.put("/clientes/:id", async (req, res): Promise<void> => {
  const params = UpdateClienteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateClienteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [cliente] = await db
    .update(clientesTable)
    .set({
      nome: parsed.data.nome,
      telefone: parsed.data.telefone,
      tipoImovelDesejado: parsed.data.tipoImovelDesejado,
      cidade: parsed.data.cidade,
      bairroPreferido: parsed.data.bairroPreferido ?? null,
      precoMinimo: String(parsed.data.precoMinimo),
      precoMaximo: String(parsed.data.precoMaximo),
      quartosMinimos: parsed.data.quartosMinimos,
      observacoes: parsed.data.observacoes ?? null,
      updatedAt: new Date(),
    })
    .where(eq(clientesTable.id, params.data.id))
    .returning();

  if (!cliente) {
    res.status(404).json({ error: "Cliente não encontrado" });
    return;
  }

  res.json(UpdateClienteResponse.parse(clienteToResponse(cliente)));
});

router.delete("/clientes/:id", async (req, res): Promise<void> => {
  const params = DeleteClienteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(clientesTable)
    .where(eq(clientesTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Cliente não encontrado" });
    return;
  }

  res.sendStatus(204);
});

function clienteToResponse(c: typeof clientesTable.$inferSelect) {
  return {
    ...c,
    precoMinimo: Number(c.precoMinimo),
    precoMaximo: Number(c.precoMaximo),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

export default router;
