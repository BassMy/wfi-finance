// src/types/expense.types.ts
export interface Expense {
  id: string;
  userId: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export type ExpenseCategory = 'needs' | 'wants' | 'savings';

export interface ExpenseInput {
  description: string;
  amount: number;
  category: ExpenseCategory;
  date?: string;
  tags?: string[];
}