import { createHash } from "crypto";
import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { settings } from "./drizzle/schema.js";

const PASSWORD_KEY = "system_password";
const DEFAULT_PASSWORD = "151612";

function hashPassword(password) {
  return createHash("sha256").update(password).digest("hex");
}

async function initializePassword() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not found");
    process.exit(1);
  }

  const db = drizzle(process.env.DATABASE_URL);

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
      console.log("✓ Senha padrão (151612) inicializada com sucesso!");
    } else {
      console.log("✓ Senha já existe no banco de dados");
    }
  } catch (error) {
    console.error("Erro ao inicializar senha:", error);
    process.exit(1);
  }

  process.exit(0);
}

initializePassword();
