// src/types/analytics.types.ts
export interface MonthlyTrend {
  month: string;
  expenses: number;
  subscriptions: number;
  income?: number;
  savings?: number;
}

export interface CategoryTrend {
  category: string;
  amount: number;
  trend: number;
  percentage: number; // Cette propriété était manquante
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// src/types/expense.types.ts
export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  description: string;
  userId: string;
  createdAt: string; // Ces propriétés étaient manquantes
  updatedAt: string;
}

export type ExpenseCategory = 'needs' | 'wants' | 'savings' | 'transport' | 'food' | 'entertainment' | 'health' | 'other';

// src/types/subscription.types.ts
export interface Subscription {
  id: string;
  name: string;
  amount: number;
  price: number; // Ces propriétés étaient manquantes
  period: 'monthly' | 'yearly';
  category: string;
  budgetCategory: string;
  isActive: boolean;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

// src/types/budget.types.ts
export interface Budget {
  id: string;
  userId: string;
  salary: number;
  categories: {
    needs: number;
    wants: number;
    savings: number;
    transport: number;
    food: number;
    entertainment: number;
    health: number;
    other: number;
  };
  createdAt: string;
  updatedAt: string;
}

// src/types/hourlyRate.types.ts
export interface HourlyRate {
  efficiency: number;
  realHourlyRate: number;
  nominalHourlyRate: number;
  workingHours: number;
  monthlyExpenses: number;
}