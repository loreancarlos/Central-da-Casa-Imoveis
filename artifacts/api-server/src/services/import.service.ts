import { eq, and } from "drizzle-orm";
import { db, imoveisTable, historicoImportacoesTable, fontesImportacaoTable } from "@workspace/db";
import type { PropertyConnector, ImportResult } from "../connectors/types";

export class PropertyImportService {
  async runImport(connector: PropertyConnector): Promise<ImportResult> {
    const fonte = connector.getName();
    const inicio = new Date();

    const [historico] = await db
      .insert(historicoImportacoesTable)
      .values({
        fonte,
        inicioExecucao: inicio,
        status: "EXECUTANDO",
      })
      .returning();

    let importados = 0;
    let atualizados = 0;
    let ignorados = 0;
    let status = "CONCLUIDO";
    let mensagem: string | null = null;

    try {
      const properties = await connector.importProperties();

      for (const prop of properties) {
        const existing = await db
          .select({ id: imoveisTable.id })
          .from(imoveisTable)
          .where(
            and(
              eq(imoveisTable.fonte, prop.fonte),
              eq(imoveisTable.identificadorOrigem, prop.identificadorOrigem)
            )
          )
          .limit(1);

        const values = {
          fonte: prop.fonte,
          identificadorOrigem: prop.identificadorOrigem,
          tipo: prop.tipo,
          cidade: prop.cidade,
          bairro: prop.bairro,
          preco: String(prop.preco),
          area: String(prop.area),
          quartos: prop.quartos,
          banheiros: prop.banheiros,
          vagas: prop.vagas ?? 0,
          descricao: prop.descricao ?? null,
          urlOriginal: prop.urlOriginal ?? null,
        };

        if (existing.length > 0) {
          await db
            .update(imoveisTable)
            .set({ ...values, updatedAt: new Date() })
            .where(eq(imoveisTable.id, existing[0].id));
          atualizados++;
        } else {
          await db.insert(imoveisTable).values(values);
          importados++;
        }
      }
    } catch (err) {
      status = "ERRO";
      mensagem = err instanceof Error ? err.message : "Erro desconhecido";
    }

    const fim = new Date();

    await db
      .update(historicoImportacoesTable)
      .set({
        fimExecucao: fim,
        totalImportados: importados,
        totalAtualizados: atualizados,
        totalIgnorados: ignorados,
        status,
        mensagem,
      })
      .where(eq(historicoImportacoesTable.id, historico.id));

    await db
      .update(fontesImportacaoTable)
      .set({
        ultimaExecucao: fim,
        ultimoStatus: status,
        updatedAt: fim,
      })
      .where(eq(fontesImportacaoTable.nome, fonte));

    return { importados, atualizados, ignorados };
  }
}

export const propertyImportService = new PropertyImportService();
