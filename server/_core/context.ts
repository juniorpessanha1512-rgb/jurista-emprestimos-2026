import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  // Se não há usuário OAuth, verificar se está autenticado com senha simples
  if (!user) {
    const cookies = opts.req.headers.cookie || "";
    const hasSimpleAuthSession = cookies.includes("simple_auth_session=");
    
    if (hasSimpleAuthSession) {
      // Criar um usuário padrão para autenticação simples
      user = {
        id: 1,
        openId: "simple_auth_user",
        name: "Sistema",
        email: null,
        loginMethod: "simple",
        role: "admin",
        lastSignedIn: new Date(),
      } as User;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
