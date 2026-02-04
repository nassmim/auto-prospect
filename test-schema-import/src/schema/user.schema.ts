// Simulating a Drizzle schema file with server-only code
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

// Server-only: actual schema definition
export const userTable = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Type exported from schema
export type TUser = typeof userTable.$inferSelect;
export type TUserInsert = typeof userTable.$inferInsert;

// Some server-only function
export const getUserById = async (id: string) => {
  // This would fail in browser
  const db = await import('./db-connection');
  return db.default.select().from(userTable).where(eq(userTable.id, id));
};
