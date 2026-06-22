import { pgTable, serial, text, numeric, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const imoveisTable = pgTable("imoveis", {
  id: serial("id").primaryKey(),
  fonte: text("fonte").notNull(),
  codigoExterno: text("codigo_externo"),
  tipo: text("tipo").notNull(),
  cidade: text("cidade").notNull(),
  bairro: text("bairro").notNull(),
  preco: numeric("preco", { precision: 15, scale: 2 }).notNull(),
  area: numeric("area", { precision: 10, scale: 2 }).notNull(),
  quartos: integer("quartos").notNull(),
  banheiros: integer("banheiros").notNull(),
  vagas: integer("vagas").notNull().default(0),
  descricao: text("descricao"),
  urlOriginal: text("url_original"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertImovelSchema = createInsertSchema(imoveisTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertImovel = z.infer<typeof insertImovelSchema>;
export type Imovel = typeof imoveisTable.$inferSelect;
