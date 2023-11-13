ALTER TABLE "loans" RENAME COLUMN "paid_on_time" TO "EMIs_paid_on_time";--> statement-breakpoint
ALTER TABLE "loans" ALTER COLUMN "EMIs_paid_on_time" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "loans" ALTER COLUMN "EMIs_paid_on_time" DROP DEFAULT;