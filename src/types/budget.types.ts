// src/types/budget.types.ts
export interface BudgetMethod {
  id: string;
  name: string;
  description: string;
  needs: number;
  wants: number;
  savings: number;
  isCustom: boolean;
}

export interface Budget {
  id: string;
  userId: string;
  salary: number;
  method: BudgetMethod;
  allocations: {
    needs: number;
    wants: number;
    savings: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BudgetStats {
  totalIncome: number;
  totalExpenses: number;
  totalSubscriptions: number;
  remaining: number;
  categorySpending: {
    needs: number;
    wants: number;
    savings: number;
  };
  percentageUsed: {
    needs: number;
    wants: number;
    savings: number;
  };
}