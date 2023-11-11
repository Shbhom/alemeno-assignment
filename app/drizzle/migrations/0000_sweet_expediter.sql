CREATE TABLE IF NOT EXISTS "loans" (
	"loan_id" serial PRIMARY KEY NOT NULL,
	"loan_amount" numeric(10, 2) NOT NULL,
	"tenure" date NOT NULL,
	"interest_rate" numeric(3, 2) NOT NULL,
	"monthly_payments" numeric(10, 2) NOT NULL,
	"paid_on_time" boolean DEFAULT false,
	"bearer_Id" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customer" (
	"customer_id" serial PRIMARY KEY NOT NULL,
	"first_name" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"phone_no" numeric(10, 0) NOT NULL,
	"monthly_salary" numeric(10, 2) NOT NULL,
	"approved_limit" numeric(10, 2) NOT NULL,
	"current_debts" numeric(10, 2),
	CONSTRAINT "customer_phone_no_unique" UNIQUE("phone_no")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "loans" ADD CONSTRAINT "loans_bearer_Id_customer_customer_id_fk" FOREIGN KEY ("bearer_Id") REFERENCES "customer"("customer_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
