import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
      cookie: () => {},
    } as any,
  };

  return { ctx };
}

describe("Simple Authentication", () => {
  it("should login with correct password (151612)", async () => {
    const { ctx } = createContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.login({ password: "151612" });

    expect(result).toEqual({ success: true });
  });

  it("should reject login with incorrect password", async () => {
    const { ctx } = createContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.login({ password: "wrong-password" })
    ).rejects.toThrow("Senha incorreta");
  });

  it("should check authentication status", async () => {
    const { ctx } = createContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.checkAuth();

    expect(result).toHaveProperty("authenticated");
    expect(typeof result.authenticated).toBe("boolean");
  });

  it("should logout successfully", async () => {
    const { ctx } = createContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
  });

  it("should reject password change with incorrect current password", async () => {
    const { ctx } = createContext();
    // Simular autenticação
    ctx.req.headers.cookie = "simple_auth_session=test-token";
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.changePassword({
        currentPassword: "wrong-password",
        newPassword: "newpass123",
      })
    ).rejects.toThrow();
  });

  it("should reject password change when not authenticated", async () => {
    const { ctx } = createContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.changePassword({
        currentPassword: "151612",
        newPassword: "newpass123",
      })
    ).rejects.toThrow("Não autenticado");
  });
});
