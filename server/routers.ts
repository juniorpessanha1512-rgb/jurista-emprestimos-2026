import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import * as simpleAuth from "./simpleAuth";


export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    // Login simples com senha
    login: publicProcedure
      .input(z.object({ password: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const isValid = await simpleAuth.verifyPassword(input.password);
        
        if (!isValid) {
          throw new Error("Senha incorreta");
        }

        // Cria um token de sessão simples
        const sessionToken = simpleAuth.generateSessionToken();
        const cookieOptions = getSessionCookieOptions(ctx.req);
        
        ctx.res.cookie("simple_auth_session", sessionToken, {
          ...cookieOptions,
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias em ms
        });

        return { success: true };
      }),

    // Verifica se está autenticado
    checkAuth: publicProcedure.query(({ ctx }) => {
      const cookies = ctx.req.headers.cookie || "";
      const hasSession = cookies.includes("simple_auth_session=");
      return { authenticated: hasSession };
    }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie("simple_auth_session", cookieOptions);
      return { success: true };
    }),

    // Alterar senha
    changePassword: publicProcedure
      .input(z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(4, "Senha deve ter pelo menos 4 caracteres"),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verifica se está autenticado
        const cookies = ctx.req.headers.cookie || "";
        if (!cookies.includes("simple_auth_session=")) {
          throw new Error("Não autenticado");
        }

        const result = await simpleAuth.changePassword(
          input.currentPassword,
          input.newPassword
        );

        if (!result.success) {
          throw new Error(result.error || "Erro ao alterar senha");
        }

        return { success: true };
      }),
  }),

  clients: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getAllClients(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getClientById(input.id, ctx.user.id);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1, "Nome é obrigatório"),
        cpf: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const clientId = await db.createClient({
          ...input,
          createdBy: ctx.user.id,
        });
        return { id: clientId };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        cpf: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateClient(id, ctx.user.id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteClient(input.id, ctx.user.id);
        return { success: true };
      }),

    search: protectedProcedure
      .input(z.object({ term: z.string() }))
      .query(async ({ ctx, input }) => {
        return await db.searchClients(ctx.user.id, input.term);
      }),
  }),

  loans: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getAllLoans(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getLoanById(input.id, ctx.user.id);
      }),

    getByClientId: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getLoansByClientId(input.clientId, ctx.user.id);
      }),

    getActive: protectedProcedure.query(async ({ ctx }) => {
      return await db.getActiveLoans(ctx.user.id);
    }),

    getOverdue: protectedProcedure.query(async ({ ctx }) => {
      return await db.getOverdueLoans(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        principalAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Valor inválido"),
        interestRate: z.string().regex(/^\d+(\.\d{1,2})?$/, "Taxa inválida"),
        interestPeriod: z.enum(["weekly", "biweekly", "monthly"]),
        startDate: z.string().or(z.date()),
        dueDate: z.string().or(z.date()),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const loanId = await db.createLoan({
          ...input,
          startDate: new Date(input.startDate),
          dueDate: new Date(input.dueDate),
          createdBy: ctx.user.id,
        });
        return { id: loanId };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        principalAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
        interestRate: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
        interestPeriod: z.enum(["weekly", "biweekly", "monthly"]).optional(),
        startDate: z.string().or(z.date()).optional(),
        dueDate: z.string().or(z.date()).optional(),
        status: z.enum(["active", "paid", "overdue", "cancelled"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const updateData: any = { ...data };
        
        if (data.startDate) {
          updateData.startDate = new Date(data.startDate);
        }
        if (data.dueDate) {
          updateData.dueDate = new Date(data.dueDate);
        }
        
        await db.updateLoan(id, ctx.user.id, updateData);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteLoan(input.id, ctx.user.id);
        return { success: true };
      }),

    calculateInterest: protectedProcedure
      .input(z.object({
        principalAmount: z.number(),
        interestRate: z.number(),
        interestPeriod: z.enum(["weekly", "biweekly", "monthly"]),
        startDate: z.string().or(z.date()),
        endDate: z.string().or(z.date()),
      }))
      .query(({ input }) => {
        const start = new Date(input.startDate);
        const end = new Date(input.endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let periods = 0;
        switch (input.interestPeriod) {
          case "weekly":
            periods = Math.floor(diffDays / 7);
            break;
          case "biweekly":
            periods = Math.floor(diffDays / 14);
            break;
          case "monthly":
            periods = Math.floor(diffDays / 30);
            break;
        }
        
        // Juros compostos: M = C * (1 + i)^n
        const rate = input.interestRate / 100;
        const finalAmount = input.principalAmount * Math.pow(1 + rate, periods);
        const interestAmount = finalAmount - input.principalAmount;
        
        return {
          periods,
          finalAmount: finalAmount.toFixed(2),
          interestAmount: interestAmount.toFixed(2),
          totalAmount: finalAmount.toFixed(2),
        };
      }),
  }),

  payments: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getAllPayments(ctx.user.id);
    }),

    getByLoanId: protectedProcedure
      .input(z.object({ loanId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getPaymentsByLoanId(input.loanId, ctx.user.id);
      }),

    create: protectedProcedure
      .input(z.object({
        loanId: z.number(),
        amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Valor inválido"),
        paymentDate: z.string().or(z.date()),
        paymentType: z.enum(["principal", "interest", "both"]),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const paymentId = await db.createPayment({
          ...input,
          paymentDate: new Date(input.paymentDate),
          createdBy: ctx.user.id,
        });
        return { id: paymentId };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deletePayment(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  dashboard: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      return await db.getDashboardStats(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
