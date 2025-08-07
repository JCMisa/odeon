ALTER TABLE "song" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "song" ALTER COLUMN "status" SET DEFAULT 'queued'::text;--> statement-breakpoint
DROP TYPE "public"."songStatus";--> statement-breakpoint
CREATE TYPE "public"."songStatus" AS ENUM('queued', 'processed', 'processing', 'no credits', 'failed');--> statement-breakpoint
ALTER TABLE "song" ALTER COLUMN "status" SET DEFAULT 'queued'::"public"."songStatus";--> statement-breakpoint
ALTER TABLE "song" ALTER COLUMN "status" SET DATA TYPE "public"."songStatus" USING "status"::"public"."songStatus";