import { createHash } from "crypto";

// Senha padrão hardcoded - sem necessidade de banco de dados
const DEFAULT_PASSWORD = "151612";

/**
 * Verifica se a senha fornecida está correta
 * Sem dependência de banco de dados
 */
export async function verifyPassword(password: string): Promise<boolean> {
  const isValid = password === DEFAULT_PASSWORD;
  console.log(`[SimpleAuth] Password verification result: ${isValid}`);
  return isValid;
}

/**
 * Gera um token de sessão simples
 */
export function generateSessionToken(): string {
  return createHash("sha256")
    .update(`${Date.now()}-${Math.random()}`)
    .digest("hex");
}

/**
 * Altera a senha do sistema (não implementado nesta versão simplificada)
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  // Nesta versão simplificada, a senha é hardcoded
  // Para alterar, editar o arquivo e fazer redeploy
  return { 
    success: false, 
    error: "Alteração de senha não disponível nesta versão. Contate o administrador." 
  };
}
