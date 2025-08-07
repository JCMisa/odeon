ALTER TABLE "song" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "song" ALTER COLUMN "status" SET DEFAULT 'has credits'::text;--> statement-breakpoint
DROP TYPE "public"."songStatus";--> statement-breakpoint
CREATE TYPE "public"."songStatus" AS ENUM('has credits', 'no credits');--> statement-breakpoint
ALTER TABLE "song" ALTER COLUMN "status" SET DEFAULT 'has credits'::"public"."songStatus";--> statement-breakpoint
ALTER TABLE "song" ALTER COLUMN "status" SET DATA TYPE "public"."songStatus" USING "status"::"public"."songStatus";