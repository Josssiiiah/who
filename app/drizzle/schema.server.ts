import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const test_table = sqliteTable("test_table", {
  id: integer("id").primaryKey(),
  title: text("title").notNull(),
});

export const name_to_route = sqliteTable("name_to_route", {
  name: text("name").primaryKey(),
  route: text("route").notNull(),
});

export const students = sqliteTable("students", {
  id: integer("id").primaryKey(),
  name: text("name"),
  category: text("category"),
  description: text("description"),
  image_url: text("image_url"),
  insta: text("insta"),
  // need to add optional field for instagram tag
});

export const signups = sqliteTable("signups", {
  id: integer("id").primaryKey(),
  email: text("email").notNull(),
});
