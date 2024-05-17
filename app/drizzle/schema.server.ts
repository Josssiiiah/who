import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const resources = sqliteTable("resources", {
  id: integer("id").primaryKey(),
  title: text("title").notNull(),
  href: text("href").notNull(),
});

export const Users = sqliteTable("Users", {
  id: text("id").primaryKey(),
  username: text("username").notNull(),
  password: text("password").notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  user_id: text("user_id").notNull(),
  expires_at: integer("expires_at").notNull(),
});
