import { integer, pgEnum, pgTable, text, timestamp, varchar, numeric } from "drizzle-orm/pg-core";

// Define enums
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const interestPeriodEnum = pgEnum("interestPeriod", ["weekly", "biweekly", "monthly"]);
export const loanStatusEnum = pgEnum("status", ["active", "paid", "overdue", "cancelled"]);
export const paymentTypeEnum = pgEnum("paymentType", ["principal", "interest", "both"]);

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").notNull().default("user"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Clientes que recebem empréstimos
 */
export const clients = pgTable("clients", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  cpf: varchar("cpf", { length: 14 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  createdBy: integer("createdBy").notNull().references(() => users.id),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Empréstimos realizados para clientes
 */
export const loans = pgTable("loans", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  clientId: integer("clientId").notNull().references(() => clients.id, { onDelete: "cascade" }),
  principalAmount: numeric("principalAmount", { precision: 15, scale: 2 }).notNull(),
  interestRate: numeric("interestRate", { precision: 5, scale: 2 }).notNull(), // Taxa de juros em porcentagem
  interestPeriod: interestPeriodEnum("interestPeriod").notNull(),
  startDate: timestamp("startDate").notNull(),
  dueDate: timestamp("dueDate").notNull(),
  status: loanStatusEnum("status").notNull().default("active"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  createdBy: integer("createdBy").notNull().references(() => users.id),
});

export type Loan = typeof loans.$inferSelect;
export type InsertLoan = typeof loans.$inferInsert;

/**
 * Pagamentos realizados para empréstimos
 */
export const payments = pgTable("payments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  loanId: integer("loanId").notNull().references(() => loans.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  paymentDate: timestamp("paymentDate").notNull(),
  paymentType: paymentTypeEnum("paymentType").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: integer("createdBy").notNull().references(() => users.id),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * Configurações do sistema (senha de acesso)
 */
export const settings = pgTable("settings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  key: varchar("key", { length: 50 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;
