import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("loans API", () => {
  it("should calculate compound interest correctly for weekly period", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const startDate = new Date("2024-01-01");
    const endDate = new Date("2024-01-29"); // 4 weeks

    const result = await caller.loans.calculateInterest({
      principalAmount: 1000,
      interestRate: 10, // 10% per week
      interestPeriod: "weekly",
      startDate,
      endDate,
    });

    expect(result.periods).toBe(4);
    expect(parseFloat(result.interestAmount)).toBeGreaterThan(0);
    expect(parseFloat(result.totalAmount)).toBeGreaterThan(1000);
  });

  it("should calculate compound interest correctly for monthly period", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const startDate = new Date("2024-01-01");
    const endDate = new Date("2024-04-01"); // 3 months

    const result = await caller.loans.calculateInterest({
      principalAmount: 5000,
      interestRate: 5, // 5% per month
      interestPeriod: "monthly",
      startDate,
      endDate,
    });

    expect(result.periods).toBe(3);
    // Compound interest formula: 5000 * (1.05)^3 = 5788.125
    const expectedTotal = 5000 * Math.pow(1.05, 3);
    expect(Math.abs(parseFloat(result.totalAmount) - expectedTotal)).toBeLessThan(1);
  });

  it("should list all loans", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const loans = await caller.loans.list();

    expect(Array.isArray(loans)).toBe(true);
  });

  it("should get active loans only", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const activeLoans = await caller.loans.getActive();

    expect(Array.isArray(activeLoans)).toBe(true);
  });

  it("should get overdue loans", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const overdueLoans = await caller.loans.getOverdue();

    expect(Array.isArray(overdueLoans)).toBe(true);
  });
});

describe("dashboard stats", () => {
  it("should return dashboard statistics", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.dashboard.stats();

    expect(stats).toHaveProperty("totalClients");
    expect(stats).toHaveProperty("totalActiveLoans");
    expect(stats).toHaveProperty("totalLent");
    expect(stats).toHaveProperty("totalReceived");
    expect(stats).toHaveProperty("totalOverdue");

    expect(typeof stats.totalClients).toBe("number");
    expect(typeof stats.totalActiveLoans).toBe("number");
    expect(typeof stats.totalOverdue).toBe("number");
  });
});
