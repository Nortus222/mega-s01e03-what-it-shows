import { sql } from 'drizzle-orm';
import { check, date, integer, pgTable, serial, text, unique } from 'drizzle-orm/pg-core';

export const reorderJobs = pgTable('reorder_jobs', {
  id: serial('id').primaryKey(),
  sku: text('sku').notNull(),
  night: date('night', { mode: 'string' }).notNull(),
  qty: integer('qty').notNull(),
  status: text('status').notNull().default('queued'),
}, (table) => [
  unique('reorder_jobs_sku_night_unique').on(table.sku, table.night),
  check('reorder_jobs_qty_positive', sql`${table.qty} > 0`),
]);
