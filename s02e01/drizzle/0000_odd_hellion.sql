CREATE TABLE "reorder_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"sku" text NOT NULL,
	"night" date NOT NULL,
	"qty" integer NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	CONSTRAINT "reorder_jobs_sku_night_unique" UNIQUE("sku","night"),
	CONSTRAINT "reorder_jobs_qty_positive" CHECK ("reorder_jobs"."qty" > 0)
);
