ALTER TABLE "loans" ALTER COLUMN "interest_rate" SET DATA TYPE numeric(5, 2);--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "tenure" numeric(5, 2) NOT NULL;