ALTER TABLE "loans" ALTER COLUMN "EMIs_paid_on_time" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "loans" ALTER COLUMN "EMIs_paid_on_time" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "customer" ALTER COLUMN "phone_no" SET DATA TYPE integer;