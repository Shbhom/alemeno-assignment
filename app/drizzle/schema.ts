import { relations } from "drizzle-orm";
import { serial, varchar, pgTable, numeric, date, boolean, integer, PgSchema } from "drizzle-orm/pg-core";

export const user = pgTable("customer", {
    id: serial("customer_id").primaryKey(),
    first_name: varchar("first_name").notNull(),
    last_name: varchar("last_name").notNull(),
    phone_number: numeric("phone_no", { precision: 10, scale: 0 }).notNull().unique(),
    age: numeric("age", { precision: 3, scale: 0 }).notNull(),
    monthly_salary: numeric("monthly_salary", { precision: 10, scale: 2 }).notNull(),
    approved_limit: numeric("approved_limit", { precision: 10, scale: 2 }).notNull(),
    current_debts: numeric("current_debts", { precision: 10, scale: 2 }),
})

export const loan = pgTable("loans", {
    id: serial("loan_id").primaryKey(),
    loanAmount: numeric("loan_amount", { precision: 10, scale: 2 }).notNull(),
    tenure: date("tenure", { mode: "string" }).notNull(),
    interestRate: numeric("interest_rate", { precision: 3, scale: 2 }).notNull(),
    emi: numeric("monthly_payments", { precision: 10, scale: 2 }).notNull(),
    emiPayedOnTime: boolean("paid_on_time").default(false),
    bearerId: integer("bearer_Id").notNull().references(() => user.id),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }).notNull(),
})

export const userRelations = relations(user, ({ many }) => ({
    loan: many(loan)
}))


export const loanRelations = relations(loan, ({ one }) => ({
    bearer: one(user, {
        fields: [loan.bearerId],
        references: [user.id]
    })
}))

