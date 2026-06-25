import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const fontesImportacaoTable = pgTable("fontes_importacao", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  url: text("url").notNull(),
  ativo: boolean("ativo").notNull().default(true),
  ultimaExecucao: timestamp("ultima_execucao", { withTimezone: true }),
  ultimoStatus: text("ultimo_status"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertFonteImportacaoSchema = createInsertSchema(fontesImportacaoTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFonteImportacao = z.infer<typeof insertFonteImportacaoSchema>;
export type FonteImportacao = typeof fontesImportacaoTable.$inferSelect;
