ALTER TABLE "loans" RENAME COLUMN "bearer_Id" TO "bearer_id";--> statement-breakpoint
ALTER TABLE "loans" DROP CONSTRAINT "loans_bearer_Id_customer_customer_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "loans" ADD CONSTRAINT "loans_bearer_id_customer_customer_id_fk" FOREIGN KEY ("bearer_id") REFERENCES "customer"("customer_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
