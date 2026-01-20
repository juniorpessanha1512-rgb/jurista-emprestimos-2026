/**
 * Autenticação Simplificada
 * Usa apenas uma senha hardcoded para acesso
 * Sem dependência de banco de dados
 */

const ADMIN_PASSWORD = "151612";

export function validatePassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export function createSessionToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function isValidSession(token: string | undefined): boolean {
  // Validação simples - em produção, usar JWT ou similar
  return !!token && token.length > 20;
}
