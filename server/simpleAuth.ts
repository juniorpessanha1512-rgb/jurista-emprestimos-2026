import { eq } from "drizzle-orm";
import { settings } from "../drizzle/schema";
import { getDb } from "./db";
import { createHash } from "crypto";

const PASSWORD_KEY = "system_password";
const DEFAULT_PASSWORD = "151612";

/**
 * Hash de senha usando SHA-256
 */
function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

/**
 * Inicializa a senha padrão no banco se não existir
 */
export async function initializeDefaultPassword(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[SimpleAuth] Cannot initialize password: database not available");
    return;
  }

  try {
    const existing = await db
      .select()
      .from(settings)
      .where(eq(settings.key, PASSWORD_KEY))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(settings).values({
        key: PASSWORD_KEY,
        value: hashPassword(DEFAULT_PASSWORD),
      });
      console.log("[SimpleAuth] Default password initialized");
    }
  } catch (error) {
    console.error("[SimpleAuth] Failed to initialize password:", error);
  }
}

/**
 * Verifica se a senha fornecida está correta
 */
export async function verifyPassword(password: string): Promise<boolean> {
  const db = await getDb();
  
  // Se o banco não está disponível, usar fallback com a senha padrão
  if (!db) {
    console.warn("[SimpleAuth] Database not available, using fallback authentication");
    const isValid = password === DEFAULT_PASSWORD;
    console.log(`[SimpleAuth] Fallback auth result: ${isValid}`);
    return isValid;
  }

  try {
    const result = await db
      .select()
      .from(settings)
      .where(eq(settings.key, PASSWORD_KEY))
      .limit(1);

    if (result.length === 0) {
      // Se não existe senha, inicializa e verifica contra a padrão
      await initializeDefaultPassword();
      return password === DEFAULT_PASSWORD;
    }

    const storedHash = result[0].value;
    const inputHash = hashPassword(password);
    const isValid = storedHash === inputHash;
    console.log(`[SimpleAuth] Password verification result: ${isValid}`);
    return isValid;
  } catch (error) {
    console.error("[SimpleAuth] Failed to verify password:", error);
    // Fallback para senha padrão se houver erro
    console.log("[SimpleAuth] Using fallback due to error");
    return password === DEFAULT_PASSWORD;
  }
}

/**
 * Altera a senha do sistema
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const db = await getDb();
  if (!db) {
    return { success: false, error: "Database not available" };
  }

  // Verifica se a senha atual está correta
  const isValid = await verifyPassword(currentPassword);
  if (!isValid) {
    return { success: false, error: "Senha atual incorreta" };
  }

  // Valida nova senha
  if (!newPassword || newPassword.length < 4) {
    return { success: false, error: "Nova senha deve ter pelo menos 4 caracteres" };
  }

  try {
    const newHash = hashPassword(newPassword);
    await db
      .update(settings)
      .set({ value: newHash })
      .where(eq(settings.key, PASSWORD_KEY));

    return { success: true };
  } catch (error) {
    console.error("[SimpleAuth] Failed to change password:", error);
    return { success: false, error: "Erro ao alterar senha" };
  }
}

/**
 * Gera um token de sessão simples
 */
export function generateSessionToken(): string {
  return createHash("sha256")
    .update(`${Date.now()}-${Math.random()}`)
    .digest("hex");
}
