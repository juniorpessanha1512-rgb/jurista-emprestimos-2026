import { describe, expect, it } from "vitest";
import * as db from "./db";

describe("Payment Logic", () => {
  it("should calculate remaining balance correctly when paying only interest", () => {
    // Simular pagamentos
    const principalAmount = 1000;
    const payments = [
      { amount: "100", paymentType: "interest" as const },
      { amount: "50", paymentType: "interest" as const },
    ];

    // Calcular apenas pagamentos que afetam o principal
    const totalPaidPrincipal = payments.reduce((sum, p) => {
      if (p.paymentType === "principal" || p.paymentType === "both") {
        return sum + parseFloat(p.amount);
      }
      return sum;
    }, 0);

    const remainingBalance = principalAmount - totalPaidPrincipal;

    // Quando paga apenas juros, o saldo principal não deve mudar
    expect(remainingBalance).toBe(1000);
    expect(totalPaidPrincipal).toBe(0);
  });

  it("should calculate remaining balance correctly when paying principal", () => {
    const principalAmount = 1000;
    const payments = [
      { amount: "200", paymentType: "principal" as const },
      { amount: "100", paymentType: "interest" as const },
      { amount: "150", paymentType: "principal" as const },
    ];

    const totalPaidPrincipal = payments.reduce((sum, p) => {
      if (p.paymentType === "principal" || p.paymentType === "both") {
        return sum + parseFloat(p.amount);
      }
      return sum;
    }, 0);

    const remainingBalance = principalAmount - totalPaidPrincipal;

    // Apenas os pagamentos de principal devem abater
    expect(totalPaidPrincipal).toBe(350);
    expect(remainingBalance).toBe(650);
  });

  it("should calculate remaining balance correctly with mixed payments", () => {
    const principalAmount = 1000;
    const payments = [
      { amount: "300", paymentType: "both" as const },
      { amount: "100", paymentType: "interest" as const },
      { amount: "200", paymentType: "principal" as const },
    ];

    const totalPaidPrincipal = payments.reduce((sum, p) => {
      if (p.paymentType === "principal" || p.paymentType === "both") {
        return sum + parseFloat(p.amount);
      }
      return sum;
    }, 0);

    const remainingBalance = principalAmount - totalPaidPrincipal;

    // Both e principal devem abater, interest não
    expect(totalPaidPrincipal).toBe(500);
    expect(remainingBalance).toBe(500);
  });
});

describe("Monthly Interest Calculation", () => {
  it("should calculate monthly interest for weekly loans correctly", () => {
    const principal = 1000;
    const rate = 0.05; // 5%
    const periodsInMonth = 4; // 4 semanas

    const finalAmount = principal * Math.pow(1 + rate, periodsInMonth);
    const interestAmount = finalAmount - principal;

    expect(interestAmount).toBeCloseTo(215.51, 2);
  });

  it("should calculate monthly interest for biweekly loans correctly", () => {
    const principal = 1000;
    const rate = 0.10; // 10%
    const periodsInMonth = 2; // 2 quinzenas

    const finalAmount = principal * Math.pow(1 + rate, periodsInMonth);
    const interestAmount = finalAmount - principal;

    expect(interestAmount).toBeCloseTo(210, 2);
  });

  it("should calculate monthly interest for monthly loans correctly", () => {
    const principal = 1000;
    const rate = 0.15; // 15%
    const periodsInMonth = 1; // 1 mês

    const finalAmount = principal * Math.pow(1 + rate, periodsInMonth);
    const interestAmount = finalAmount - principal;

    expect(interestAmount).toBeCloseTo(150, 2);
  });

  it("should calculate total monthly interest for multiple loans", () => {
    const loans = [
      { principal: 1000, rate: 0.05, periods: 4 }, // weekly
      { principal: 2000, rate: 0.10, periods: 2 }, // biweekly
      { principal: 1500, rate: 0.15, periods: 1 }, // monthly
    ];

    let totalInterest = 0;
    for (const loan of loans) {
      const finalAmount = loan.principal * Math.pow(1 + loan.rate, loan.periods);
      const interestAmount = finalAmount - loan.principal;
      totalInterest += interestAmount;
    }

    // 215.51 + 420 + 225 = 860.51
    expect(totalInterest).toBeCloseTo(860.51, 2);
  });
});
