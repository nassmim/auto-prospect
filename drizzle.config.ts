import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schemaFilter: ["public"],
  schema: './src/schema',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.SUPABASE_DATABASE_URL!,
  },
  verbose: true, // We get information about the migration changes
  strict: true, // extra layer of security, with validation question prompted when important changes  
  entities: {
    roles: {
      provider: "supabase",
      exclude: ["supabase_auth_admin", "new_supabase_role"],
    },
  },  
  out: "./supabase/migrations",
});

