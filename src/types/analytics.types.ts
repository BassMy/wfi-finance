import { ExpenseCategory } from "./expense.types";

// src/types/analytics.types.ts
export interface RealHourlyRate {
  theoretical: number;
  real: number;
  efficiency: number;
  totalImpact: number;
  breakdown: {
    expenses: number;
    subscriptions: number;
  };
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
  subscriptions: number;
  savings: number;
}

export interface CategoryTrend {
  category: ExpenseCategory;
  trend: number; // pourcentage de changement
  amount: number;
}