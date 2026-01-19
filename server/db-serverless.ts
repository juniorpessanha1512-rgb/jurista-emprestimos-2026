import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../drizzle/schema";

/**
 * Serverless database connection for Vercel
 * Uses connection pooling with minimal connections to avoid exhausting database limits
 */

let connection: mysql.Connection | null = null;

export async function getServerlessDb() {
  // Reuse existing connection if available
  if (connection) {
    try {
      await connection.ping();
      return drizzle(connection, { schema, mode: "default" });
    } catch (error) {
      console.warn("[DB] Connection lost, reconnecting...");
      connection = null;
    }
  }

  // Create new connection
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  try {
    connection = await mysql.createConnection({
      uri: DATABASE_URL,
      ssl: {
        rejectUnauthorized: true,
      },
      // Serverless optimizations
      connectTimeout: 10000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });

    console.log("[DB] Connected successfully");
    return drizzle(connection, { schema, mode: "default" });
  } catch (error) {
    console.error("[DB] Connection failed:", error);
    throw error;
  }
}

/**
 * Close database connection (call at end of serverless function if needed)
 */
export async function closeServerlessDb() {
  if (connection) {
    try {
      await connection.end();
      connection = null;
      console.log("[DB] Connection closed");
    } catch (error) {
      console.warn("[DB] Error closing connection:", error);
    }
  }
}
