import { relations } from "drizzle-orm";
import { decimal, serial, varchar, pgTable, numeric, date, boolean, integer, PgSchema, text } from "drizzle-orm/pg-core";

export const user = pgTable("customer", {
    id: serial("customer_id").primaryKey(),
    first_name: varchar("first_name").notNull(),
    last_name: varchar("last_name").notNull(),
    phone_number: numeric("phone_no", { precision: 10, scale: 0 }).notNull().unique(),
    age: decimal("age", { precision: 3, scale: 0 }).notNull(),
    monthly_salary: decimal("monthly_salary", { precision: 12, scale: 2 }).notNull(),
    approved_limit: decimal("approved_limit", { precision: 12, scale: 2 }).notNull(),
    current_debts: decimal("current_debts", { precision: 12, scale: 2 }),
})

export const loan = pgTable("loans", {
    id: serial("loan_id").primaryKey(),
    loanAmount: decimal("loan_amount", { precision: 10, scale: 2 }).notNull(),
    tenure: decimal("tenure", { precision: 5, scale: 2 }).notNull(),
    interestRate: decimal("interest_rate", { precision: 5, scale: 2 }).notNull(),
    emi: decimal("monthly_payments", { precision: 10, scale: 2 }).notNull(),
    EMIs_paid: integer("EMIs_paid").default(0),
    EMIs_paid_on_time: integer("EMIs_paid_on_time").default(0),
    bearer_id: integer("bearer_id").notNull().references(() => user.id),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }).notNull(),
})

export const userRelations = relations(user, ({ many }) => ({
    loan: many(loan)
}))


export const loanRelations = relations(loan, ({ one }) => ({
    bearer: one(user, {
        fields: [loan.bearer_id],
        references: [user.id]
    })
}))

