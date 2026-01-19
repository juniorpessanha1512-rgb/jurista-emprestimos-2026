import { eq, desc, and, sql, or, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, clients, loans, payments, InsertClient, InsertLoan, InsertPayment, Client, Loan, Payment } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
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
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ===== CLIENT QUERIES =====

export async function createClient(client: InsertClient) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    const result = await db.insert(clients).values(client);
    // Drizzle retorna um objeto com a propriedade insertId
    const insertId = (result as any).insertId || (result as any)[0]?.insertId;
    if (!insertId) {
      throw new Error("Failed to get insert ID from database response");
    }
    return insertId;
  } catch (error) {
    console.error("[Database] Failed to create client:", error);
    throw error;
  }
}

export async function getAllClients(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(clients).where(eq(clients.createdBy, userId)).orderBy(desc(clients.createdAt));
}

export async function getClientById(clientId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(clients).where(
    and(eq(clients.id, clientId), eq(clients.createdBy, userId))
  ).limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function updateClient(clientId: number, userId: number, data: Partial<InsertClient>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(clients).set(data).where(
    and(eq(clients.id, clientId), eq(clients.createdBy, userId))
  );
}

export async function deleteClient(clientId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(clients).where(
    and(eq(clients.id, clientId), eq(clients.createdBy, userId))
  );
}

export async function searchClients(userId: number, searchTerm: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(clients).where(
    and(
      eq(clients.createdBy, userId),
      or(
        like(clients.name, `%${searchTerm}%`),
        like(clients.cpf, `%${searchTerm}%`),
        like(clients.phone, `%${searchTerm}%`)
      )
    )
  ).orderBy(desc(clients.createdAt));
}

// ===== LOAN QUERIES =====

export async function createLoan(loan: InsertLoan) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    const result = await db.insert(loans).values(loan);
    const insertId = (result as any).insertId || (result as any)[0]?.insertId;
    if (!insertId) {
      throw new Error("Failed to get insert ID from database response");
    }
    return insertId;
  } catch (error) {
    console.error("[Database] Failed to create loan:", error);
    throw error;
  }
}

export async function getAllLoans(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select({
    loan: loans,
    client: clients,
  }).from(loans)
    .leftJoin(clients, eq(loans.clientId, clients.id))
    .where(eq(loans.createdBy, userId))
    .orderBy(desc(loans.createdAt));
}

export async function getLoanById(loanId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select({
    loan: loans,
    client: clients,
  }).from(loans)
    .leftJoin(clients, eq(loans.clientId, clients.id))
    .where(and(eq(loans.id, loanId), eq(loans.createdBy, userId)))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function getLoansByClientId(clientId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(loans).where(
    and(eq(loans.clientId, clientId), eq(loans.createdBy, userId))
  ).orderBy(desc(loans.createdAt));
}

export async function updateLoan(loanId: number, userId: number, data: Partial<InsertLoan>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(loans).set(data).where(
    and(eq(loans.id, loanId), eq(loans.createdBy, userId))
  );
}

export async function deleteLoan(loanId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(loans).where(
    and(eq(loans.id, loanId), eq(loans.createdBy, userId))
  );
}

export async function getActiveLoans(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select({
    loan: loans,
    client: clients,
  }).from(loans)
    .leftJoin(clients, eq(loans.clientId, clients.id))
    .where(and(eq(loans.createdBy, userId), eq(loans.status, "active")))
    .orderBy(desc(loans.createdAt));
}

export async function getOverdueLoans(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const now = new Date();
  
  return await db.select({
    loan: loans,
    client: clients,
  }).from(loans)
    .leftJoin(clients, eq(loans.clientId, clients.id))
    .where(
      and(
        eq(loans.createdBy, userId),
        eq(loans.status, "active"),
        sql`${loans.dueDate} < ${now}`
      )
    )
    .orderBy(loans.dueDate);
}

// ===== PAYMENT QUERIES =====

export async function createPayment(payment: InsertPayment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    const result = await db.insert(payments).values(payment);
    const insertId = (result as any).insertId || (result as any)[0]?.insertId;
    if (!insertId) {
      throw new Error("Failed to get insert ID from database response");
    }
    return insertId;
  } catch (error) {
    console.error("[Database] Failed to create payment:", error);
    throw error;
  }
}

export async function getPaymentsByLoanId(loanId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verificar se o empréstimo pertence ao usuário
  const loan = await db.select().from(loans).where(
    and(eq(loans.id, loanId), eq(loans.createdBy, userId))
  ).limit(1);
  
  if (loan.length === 0) return [];
  
  return await db.select().from(payments)
    .where(eq(payments.loanId, loanId))
    .orderBy(desc(payments.paymentDate));
}

export async function getAllPayments(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select({
    payment: payments,
    loan: loans,
    client: clients,
  }).from(payments)
    .leftJoin(loans, eq(payments.loanId, loans.id))
    .leftJoin(clients, eq(loans.clientId, clients.id))
    .where(eq(loans.createdBy, userId))
    .orderBy(desc(payments.paymentDate));
}

export async function deletePayment(paymentId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verificar se o pagamento pertence a um empréstimo do usuário
  const result = await db.select({
    payment: payments,
    loan: loans,
  }).from(payments)
    .leftJoin(loans, eq(payments.loanId, loans.id))
    .where(and(eq(payments.id, paymentId), eq(loans.createdBy, userId)))
    .limit(1);
  
  if (result.length === 0) throw new Error("Payment not found");
  
  await db.delete(payments).where(eq(payments.id, paymentId));
}

// ===== DASHBOARD QUERIES =====

export async function getDashboardStats(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Total de clientes
  const clientCount = await db.select({ count: sql<number>`count(*)` })
    .from(clients)
    .where(eq(clients.createdBy, userId));
  
  // Total de empréstimos ativos
  const activeLoanCount = await db.select({ count: sql<number>`count(*)` })
    .from(loans)
    .where(and(eq(loans.createdBy, userId), eq(loans.status, "active")));
  
  // Total emprestado (soma dos valores principais dos empréstimos ativos)
  const totalLent = await db.select({ 
    total: sql<string>`COALESCE(SUM(${loans.principalAmount}), 0)` 
  })
    .from(loans)
    .where(and(eq(loans.createdBy, userId), eq(loans.status, "active")));
  
  // Total de pagamentos recebidos
  const totalReceived = await db.select({ 
    total: sql<string>`COALESCE(SUM(${payments.amount}), 0)` 
  })
    .from(payments)
    .leftJoin(loans, eq(payments.loanId, loans.id))
    .where(eq(loans.createdBy, userId));
  
  // Empréstimos em atraso
  const now = new Date();
  const overdueCount = await db.select({ count: sql<number>`count(*)` })
    .from(loans)
    .where(
      and(
        eq(loans.createdBy, userId),
        eq(loans.status, "active"),
        sql`${loans.dueDate} < ${now}`
      )
    );
  
  // Calcular juros previstos para o mês atual
  const currentDate = new Date();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  // Buscar todos os empréstimos ativos
  const activeLoansData = await db.select()
    .from(loans)
    .where(and(eq(loans.createdBy, userId), eq(loans.status, "active")));
  
  // Calcular juros de cada empréstimo para o mês
  let monthlyInterest = 0;
  for (const loan of activeLoansData) {
    const principal = parseFloat(loan.principalAmount);
    const rate = parseFloat(loan.interestRate) / 100;
    
    // Calcular quantos períodos de juros cabem no mês
    let periodsInMonth = 0;
    switch (loan.interestPeriod) {
      case "weekly":
        periodsInMonth = 4; // Aproximadamente 4 semanas por mês
        break;
      case "biweekly":
        periodsInMonth = 2; // Aproximadamente 2 quinzenas por mês
        break;
      case "monthly":
        periodsInMonth = 1; // 1 período mensal
        break;
    }
    
    // Juros compostos para o período
    const finalAmount = principal * Math.pow(1 + rate, periodsInMonth);
    const interestAmount = finalAmount - principal;
    monthlyInterest += interestAmount;
  }
  
  return {
    totalClients: Number(clientCount[0]?.count || 0),
    totalActiveLoans: Number(activeLoanCount[0]?.count || 0),
    totalLent: totalLent[0]?.total || "0",
    totalReceived: totalReceived[0]?.total || "0",
    totalOverdue: Number(overdueCount[0]?.count || 0),
    monthlyInterest: monthlyInterest.toFixed(2),
  };
}
