import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

/**
 * Server-side database client. Do not import this module from client components.
 * DATABASE_URL is read from the server environment and is not a NEXT_PUBLIC_ variable,
 * so Next.js does not bundle it for the browser.
 */
function requireDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Add it to the server environment before connecting.",
    );
  }

  return databaseUrl;
}

export const db = drizzle(neon(requireDatabaseUrl()));
