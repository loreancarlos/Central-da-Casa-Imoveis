import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const historicoImportacoesTable = pgTable("historico_importacoes", {
  id: serial("id").primaryKey(),
  fonte: text("fonte").notNull(),
  inicioExecucao: timestamp("inicio_execucao", { withTimezone: true }).notNull(),
  fimExecucao: timestamp("fim_execucao", { withTimezone: true }),
  totalImportados: integer("total_importados").notNull().default(0),
  totalAtualizados: integer("total_atualizados").notNull().default(0),
  totalIgnorados: integer("total_ignorados").notNull().default(0),
  status: text("status").notNull().default("EXECUTANDO"),
  mensagem: text("mensagem"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type HistoricoImportacao = typeof historicoImportacoesTable.$inferSelect;

export const HistoricoImportacaoSchema = z.object({
  id: z.number(),
  fonte: z.string(),
  inicioExecucao: z.string(),
  fimExecucao: z.string().nullable(),
  totalImportados: z.number(),
  totalAtualizados: z.number(),
  totalIgnorados: z.number(),
  status: z.string(),
  mensagem: z.string().nullable(),
  createdAt: z.string(),
});
