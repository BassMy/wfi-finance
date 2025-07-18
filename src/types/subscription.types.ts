import { ExpenseCategory } from "./expense.types";

// src/types/subscription.types.ts
export interface Subscription {
  id: string;
  userId: string;
  name: string;
  price: number;
  period: SubscriptionPeriod;
  category: SubscriptionCategory;
  budgetCategory: ExpenseCategory;
  description?: string;
  icon?: string;
  isActive: boolean;
  startDate: string;
  nextBillDate: string;
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionPeriod = 'weekly' | 'monthly' | 'yearly';
export type SubscriptionCategory = 'streaming' | 'music' | 'software' | 'fitness' | 'news' | 'gaming' | 'cloud' | 'other';

export interface SubscriptionInput {
  name: string;
  price: number;
  period: SubscriptionPeriod;
  category: SubscriptionCategory;
  budgetCategory: ExpenseCategory;
  description?: string;
  startDate?: string;
}

export type { ExpenseCategory };
