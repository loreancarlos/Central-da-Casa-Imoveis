import { pgTable, serial, text, numeric, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const clientesTable = pgTable("clientes", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  telefone: text("telefone").notNull(),
  tipoImovelDesejado: text("tipo_imovel_desejado").notNull(),
  cidade: text("cidade").notNull(),
  bairroPreferido: text("bairro_preferido"),
  precoMinimo: numeric("preco_minimo", { precision: 15, scale: 2 }).notNull(),
  precoMaximo: numeric("preco_maximo", { precision: 15, scale: 2 }).notNull(),
  quartosMinimos: integer("quartos_minimos").notNull(),
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertClienteSchema = createInsertSchema(clientesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCliente = z.infer<typeof insertClienteSchema>;
export type Cliente = typeof clientesTable.$inferSelect;
