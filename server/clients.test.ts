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

describe("clients API", () => {
  it("should create a new client", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.clients.create({
      name: "João Silva",
      cpf: "123.456.789-00",
      phone: "(11) 98765-4321",
      address: "Rua Teste, 123",
      notes: "Cliente teste",
    });

    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("should list all clients", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const clients = await caller.clients.list();

    expect(Array.isArray(clients)).toBe(true);
  });

  it("should search clients by name", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Criar um cliente para buscar
    await caller.clients.create({
      name: "Maria Santos",
      phone: "(11) 91234-5678",
    });

    const results = await caller.clients.search({ term: "Maria" });

    expect(Array.isArray(results)).toBe(true);
  });

  it("should require name when creating client", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.clients.create({
        name: "",
        phone: "(11) 98765-4321",
      })
    ).rejects.toThrow();
  });
});
