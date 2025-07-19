// src/store/slices/budgetSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Types simplifiés intégrés
interface BudgetMethod {
  id: string;
  name: string;
  description: string;
  allocations: {
    needs: number;
    wants: number;
    savings: number;
  };
  isCustom?: boolean;
}

interface Budget {
  id: string;
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

interface BudgetStats {
  totalIncome: number;
  totalExpenses: number;
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

// Méthodes budgétaires par défaut
const BUDGET_METHODS: BudgetMethod[] = [
  {
    id: 'classic_50_30_20',
    name: '50/30/20 Classique',
    description: '50% besoins, 30% envies, 20% épargne',
    allocations: { needs: 50, wants: 30, savings: 20 },
  },
  {
    id: 'conservative_60_20_20',
    name: '60/20/20 Conservateur',
    description: '60% besoins, 20% envies, 20% épargne',
    allocations: { needs: 60, wants: 20, savings: 20 },
  },
  {
    id: 'aggressive_40_30_30',
    name: '40/30/30 Agressif',
    description: '40% besoins, 30% envies, 30% épargne',
    allocations: { needs: 40, wants: 30, savings: 30 },
  },
];

// Actions asynchrones simplifiées
export const fetchBudget = createAsyncThunk<Budget | null, string>(
  'budget/fetchBudget',
  async (userId: string, { rejectWithValue }) => {
    try {
      // Simulation de chargement
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Budget de test
      const mockBudget: Budget = {
        id: 'budget-1',
        salary: 3000,
        method: BUDGET_METHODS[0],
        allocations: {
          needs: 1500,  // 50% de 3000
          wants: 900,   // 30% de 3000
          savings: 600, // 20% de 3000
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      return mockBudget;
    } catch (error) {
      return rejectWithValue('Erreur lors du chargement du budget');
    }
  }
);

export const saveBudget = createAsyncThunk<Budget, { 
  userId: string; 
  salary: number; 
  method: BudgetMethod 
}>(
  'budget/saveBudget',
  async ({ userId, salary, method }, { rejectWithValue }) => {
    try {
      // Simulation de sauvegarde
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const allocations = {
        needs: (salary * method.allocations.needs) / 100,
        wants: (salary * method.allocations.wants) / 100,
        savings: (salary * method.allocations.savings) / 100,
      };
      
      const budget: Budget = {
        id: 'budget-' + Date.now(),
        salary,
        method,
        allocations,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      return budget;
    } catch (error) {
      return rejectWithValue('Erreur lors de la sauvegarde du budget');
    }
  }
);

export const calculateCurrentStats = createAsyncThunk<BudgetStats, void>(
  'budget/calculateCurrentStats',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const { budget } = state.budget;
      const { expenses } = state.expenses;
      const { subscriptions } = state.subscriptions;
      
      if (!budget) {
        return rejectWithValue('Aucun budget configuré');
      }

      // Calculer les dépenses par catégorie
      const categorySpending = {
        needs: expenses?.totals?.needs || 0,
        wants: expenses?.totals?.wants || 0,
        savings: expenses?.totals?.savings || 0,
      };

      // Ajouter les abonnements
      const subscriptionCost = subscriptions?.monthlyTotal || 0;
      categorySpending.wants += subscriptionCost;

      const totalExpenses = categorySpending.needs + categorySpending.wants + categorySpending.savings;
      const remaining = budget.salary - totalExpenses;

      // Calculer les pourcentages utilisés
      const percentageUsed = {
        needs: budget.allocations.needs > 0 ? (categorySpending.needs / budget.allocations.needs) * 100 : 0,
        wants: budget.allocations.wants > 0 ? (categorySpending.wants / budget.allocations.wants) * 100 : 0,
        savings: budget.allocations.savings > 0 ? (categorySpending.savings / budget.allocations.savings) * 100 : 0,
      };

      const stats: BudgetStats = {
        totalIncome: budget.salary,
        totalExpenses,
        remaining,
        categorySpending,
        percentageUsed,
      };

      return stats;
    } catch (error) {
      return rejectWithValue('Erreur lors du calcul des statistiques');
    }
  }
);

interface BudgetState {
  budget: Budget | null;
  stats: BudgetStats | null;
  availableMethods: BudgetMethod[];
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: BudgetState = {
  budget: null,
  stats: null,
  availableMethods: BUDGET_METHODS,
  isInitialized: false,
  isLoading: false,
  error: null,
};

const budgetSlice = createSlice({
  name: 'budget',
  initialState,
  reducers: {
    clearBudget: (state) => {
      state.budget = null;
      state.stats = null;
      state.isInitialized = false;
      state.error = null;
    },
    
    setBudget: (state, action: PayloadAction<Budget | null>) => {
      state.budget = action.payload;
      state.isInitialized = true;
    },
    
    setStats: (state, action: PayloadAction<BudgetStats>) => {
      state.stats = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
  },
  
  extraReducers: (builder) => {
    // Fetch budget
    builder
      .addCase(fetchBudget.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBudget.fulfilled, (state, action) => {
        state.isLoading = false;
        state.budget = action.payload;
        state.isInitialized = true;
      })
      .addCase(fetchBudget.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isInitialized = true;
      });

    // Save budget
    builder
      .addCase(saveBudget.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveBudget.fulfilled, (state, action) => {
        state.isLoading = false;
        state.budget = action.payload;
        state.error = null;
      })
      .addCase(saveBudget.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Calculate current stats
    builder
      .addCase(calculateCurrentStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      .addCase(calculateCurrentStats.rejected, (state, action) => {
        console.warn('Failed to calculate budget stats:', action.payload);
      });
  },
});

export const {
  clearBudget,
  setBudget,
  setStats,
  clearError,
} = budgetSlice.actions;

export default budgetSlice.reducer;