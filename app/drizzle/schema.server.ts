import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const test_table = sqliteTable("test_table", {
  id: integer("id").primaryKey(),
  title: text("title").notNull()
});

