import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local", quiet: true });

const databaseUrl = process.env.DATABASE_URL_UNPOOLED?.trim();

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL_UNPOOLED is not set. Add it to the server environment before running migrations.",
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: databaseUrl,
  },
});
