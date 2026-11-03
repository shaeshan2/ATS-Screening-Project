import { config } from "dotenv";

function sanitizeDatabaseError(error: unknown): string {
  const raw = error instanceof Error ? error.message : "Unknown database error";
  const sanitized = raw
    .replace(/postgres(?:ql)?:\/\/\S+/gi, "[redacted]")
    .replace(/\b[A-Za-z0-9._%+-]*:[^@\s/]+@[A-Za-z0-9.-]+/g, "[redacted]")
    .replace(/\b[\w.-]+\.neon\.tech\b\S*/gi, "[redacted-host]")
    .replace(
      /(password|pwd|secret|token|database_url)\s*[=:]\s*\S+/gi,
      "$1=[redacted]",
    );

  if (
    /postgres(?:ql)?:\/\//i.test(sanitized) ||
    sanitized.includes("://") ||
    sanitized.includes("@")
  ) {
    return "The database request failed. Connection details were omitted.";
  }

  const trimmed = sanitized.trim();
  return trimmed.length > 0
    ? trimmed
    : "The database request failed. Connection details were omitted.";
}

function fail(message: string): never {
  console.error(`Database check failed: ${message}`);
  process.exit(1);
}

const loaded = config({ path: ".env.local", quiet: true });

if (loaded.error && !process.env.DATABASE_URL?.trim()) {
  fail(".env.local could not be loaded and DATABASE_URL is not set.");
}

async function main(): Promise<void> {
  const { db } = await import("../src/db/client");
  const { sql } = await import("drizzle-orm");
  const result = await db.execute<{ ok: number | string }>(
    sql`SELECT 1 AS ok`,
  );
  const value = result.rows[0]?.ok;

  if (value !== 1 && value !== "1") {
    fail("SELECT 1 did not return the expected result.");
  }

  console.log("Database connection succeeded.");
}

main().catch((error: unknown) => {
  fail(sanitizeDatabaseError(error));
});
