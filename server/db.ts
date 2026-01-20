import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { InsertUser, users, clients, loans, payments, InsertClient, InsertLoan, InsertPayment, Client, Loan, Payment } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _client = postgres(process.env.DATABASE_URL);
      _db = drizzle(_client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
      _client = null;
    }
  }
  return _db;
}

export async function getUserByOpenId(openId: string): Promise<any> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(users)
      .where((u) => u.openId === openId)
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get user by openId:", error);
    return null;
  }
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }

    // Tenta inserir ou atualizar
    await db
      .insert(users)
      .values(values)
      .onConflictDoUpdate({
        target: users.openId,
        set: updateSet,
      });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

// ============= CLIENTS =============

export async function getAllClients(userId: number): Promise<Client[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(clients).where((c) => c.createdBy === userId);
  } catch (error) {
    console.error("[Database] Failed to get clients:", error);
    return [];
  }
}

export async function getClientById(id: number, userId: number): Promise<Client | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(clients)
      .where((c) => c.id === id && c.createdBy === userId)
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get client:", error);
    return null;
  }
}

export async function createClient(data: {
  name: string;
  cpf?: string;
  phone?: string;
  address?: string;
  notes?: string;
  createdBy: number;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db
      .insert(clients)
      .values(data)
      .returning({ id: clients.id });
    return result[0]?.id || 0;
  } catch (error) {
    console.error("[Database] Failed to create client:", error);
    throw error;
  }
}

export async function updateClient(
  id: number,
  userId: number,
  data: Partial<Omit<Client, "id" | "createdAt" | "createdBy">>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db
      .update(clients)
      .set({ ...data, updatedAt: new Date() })
      .where((c) => c.id === id && c.createdBy === userId);
  } catch (error) {
    console.error("[Database] Failed to update client:", error);
    throw error;
  }
}

export async function deleteClient(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db
      .delete(clients)
      .where((c) => c.id === id && c.createdBy === userId);
  } catch (error) {
    console.error("[Database] Failed to delete client:", error);
    throw error;
  }
}

export async function searchClients(userId: number, term: string): Promise<Client[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(clients)
      .where((c) => c.createdBy === userId);
    // Filtragem em memória por simplicidade
  } catch (error) {
    console.error("[Database] Failed to search clients:", error);
    return [];
  }
}

// ============= LOANS =============

export async function getAllLoans(userId: number): Promise<Loan[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(loans)
      .where((l) => l.createdBy === userId);
  } catch (error) {
    console.error("[Database] Failed to get loans:", error);
    return [];
  }
}

export async function getLoanById(id: number, userId: number): Promise<Loan | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(loans)
      .where((l) => l.id === id && l.createdBy === userId)
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get loan:", error);
    return null;
  }
}

export async function getLoansByClientId(clientId: number, userId: number): Promise<Loan[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(loans)
      .where((l) => l.clientId === clientId && l.createdBy === userId);
  } catch (error) {
    console.error("[Database] Failed to get loans by client:", error);
    return [];
  }
}

export async function getActiveLoans(userId: number): Promise<Loan[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(loans)
      .where((l) => l.createdBy === userId && l.status === "active");
  } catch (error) {
    console.error("[Database] Failed to get active loans:", error);
    return [];
  }
}

export async function getOverdueLoans(userId: number): Promise<Loan[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(loans)
      .where((l) => l.createdBy === userId && l.status === "overdue");
  } catch (error) {
    console.error("[Database] Failed to get overdue loans:", error);
    return [];
  }
}

export async function createLoan(data: {
  clientId: number;
  principalAmount: string;
  interestRate: string;
  interestPeriod: "weekly" | "biweekly" | "monthly";
  startDate: Date;
  dueDate: Date;
  notes?: string;
  createdBy: number;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db
      .insert(loans)
      .values({
        ...data,
        principalAmount: data.principalAmount,
        interestRate: data.interestRate,
      })
      .returning({ id: loans.id });
    return result[0]?.id || 0;
  } catch (error) {
    console.error("[Database] Failed to create loan:", error);
    throw error;
  }
}

export async function updateLoan(
  id: number,
  userId: number,
  data: Partial<Omit<Loan, "id" | "createdAt" | "createdBy">>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db
      .update(loans)
      .set({ ...data, updatedAt: new Date() })
      .where((l) => l.id === id && l.createdBy === userId);
  } catch (error) {
    console.error("[Database] Failed to update loan:", error);
    throw error;
  }
}

export async function deleteLoan(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db
      .delete(loans)
      .where((l) => l.id === id && l.createdBy === userId);
  } catch (error) {
    console.error("[Database] Failed to delete loan:", error);
    throw error;
  }
}

// ============= PAYMENTS =============

export async function getAllPayments(userId: number): Promise<Payment[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(payments)
      .where((p) => p.createdBy === userId);
  } catch (error) {
    console.error("[Database] Failed to get payments:", error);
    return [];
  }
}

export async function getPaymentsByLoanId(loanId: number, userId: number): Promise<Payment[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(payments)
      .where((p) => p.loanId === loanId && p.createdBy === userId);
  } catch (error) {
    console.error("[Database] Failed to get payments by loan:", error);
    return [];
  }
}

export async function createPayment(data: {
  loanId: number;
  amount: string;
  paymentDate: Date;
  paymentType: "principal" | "interest" | "both";
  notes?: string;
  createdBy: number;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db
      .insert(payments)
      .values({
        ...data,
        amount: data.amount,
      })
      .returning({ id: payments.id });
    return result[0]?.id || 0;
  } catch (error) {
    console.error("[Database] Failed to create payment:", error);
    throw error;
  }
}

export async function deletePayment(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db
      .delete(payments)
      .where((p) => p.id === id && p.createdBy === userId);
  } catch (error) {
    console.error("[Database] Failed to delete payment:", error);
    throw error;
  }
}

// ============= DASHBOARD =============

export async function getDashboardStats(userId: number): Promise<any> {
  const db = await getDb();
  if (!db) return {};

  try {
    const allLoans = await db
      .select()
      .from(loans)
      .where((l) => l.createdBy === userId);

    const totalClients = await db
      .select()
      .from(clients)
      .where((c) => c.createdBy === userId);

    const activeLoans = allLoans.filter((l) => l.status === "active");
    const overdueLoans = allLoans.filter((l) => l.status === "overdue");

    return {
      totalClients: totalClients.length,
      totalLoans: allLoans.length,
      activeLoans: activeLoans.length,
      overdueLoans: overdueLoans.length,
    };
  } catch (error) {
    console.error("[Database] Failed to get dashboard stats:", error);
    return {};
  }
}
