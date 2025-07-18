// src/store/slices/budgetSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Budget, BudgetMethod, BudgetStats, LoadingState } from '../../types';
import { FirestoreService } from '../../services/firebase/firestore.service';
import { calculateBudgetAllocations, calculateBudgetStats } from '../../utils/calculations';
import { BUDGET_METHODS } from '../../utils/constants';

const firestoreService = FirestoreService.getInstance();

// Actions asynchrones
export const fetchBudget = createAsyncThunk(
  'budget/fetchBudget',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await firestoreService.getUserBudget(userId);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Erreur lors du chargement du budget');
      }
    } catch (error) {
      return rejectWithValue('Erreur lors du chargement du budget');
    }
  }
);

export const saveBudget = createAsyncThunk(
  'budget/saveBudget',
  async ({ 
    userId, 
    salary, 
    method 
  }: { 
    userId: string; 
    salary: number; 
    method: BudgetMethod 
  }, { rejectWithValue }) => {
    try {
      const allocations = calculateBudgetAllocations(salary, method);
      
      const budgetData = {
        salary,
        method,
        allocations,
      };

      const response = await firestoreService.upsertBudget(userId, budgetData);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      return rejectWithValue('Erreur lors de la sauvegarde du budget');
    }
  }
);

export const updateBudgetMethod = createAsyncThunk(
  'budget/updateBudgetMethod',
  async ({ 
    userId, 
    method 
  }: { 
    userId: string; 
    method: BudgetMethod 
  }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const currentBudget = state.budget.budget;
      
      if (!currentBudget) {
        return rejectWithValue('Aucun budget existant');
      }

      const allocations = calculateBudgetAllocations(currentBudget.salary, method);
      
      const budgetData = {
        salary: currentBudget.salary,
        method,
        allocations,
      };

      const response = await firestoreService.upsertBudget(userId, budgetData);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      return rejectWithValue('Erreur lors de la mise à jour de la méthode');
    }
  }
);

export const updateBudgetSalary = createAsyncThunk(
  'budget/updateBudgetSalary',
  async ({ 
    userId, 
    salary 
  }: { 
    userId: string; 
    salary: number 
  }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const currentBudget = state.budget.budget;
      
      if (!currentBudget) {
        return rejectWithValue('Aucun budget existant');
      }

      const allocations = calculateBudgetAllocations(salary, currentBudget.method);
      
      const budgetData = {
        salary,
        method: currentBudget.method,
        allocations,
      };

      const response = await firestoreService.upsertBudget(userId, budgetData);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      return rejectWithValue('Erreur lors de la mise à jour du salaire');
    }
  }
);

export const calculateCurrentStats = createAsyncThunk(
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

      const stats = calculateBudgetStats(budget, expenses, subscriptions);
      return stats;
    } catch (error) {
      return rejectWithValue('Erreur lors du calcul des statistiques');
    }
  }
);

interface BudgetState extends LoadingState {
  budget: Budget | null;
  stats: BudgetStats | null;
  availableMethods: BudgetMethod[];
  isInitialized: boolean;
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
    
    addCustomMethod: (state, action: PayloadAction<BudgetMethod>) => {
      const existingIndex = state.availableMethods.findIndex(
        (        method: { id: any; }) => method.id === action.payload.id
      );
      
      if (existingIndex >= 0) {
        state.availableMethods[existingIndex] = action.payload;
      } else {
        state.availableMethods.push(action.payload);
      }
    },
    
    removeCustomMethod: (state, action: PayloadAction<string>) => {
      state.availableMethods = state.availableMethods.filter(
        (        method: { id: string; isCustom: any; }) => method.id !== action.payload || !method.isCustom
      );
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    updateAllocations: (state, action: PayloadAction<{
      needs: number;
      wants: number;
      savings: number;
    }>) => {
      if (state.budget) {
        state.budget.allocations = action.payload;
      }
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

    // Update budget method
    builder
      .addCase(updateBudgetMethod.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateBudgetMethod.fulfilled, (state, action) => {
        state.isLoading = false;
        state.budget = action.payload;
        state.error = null;
      })
      .addCase(updateBudgetMethod.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update budget salary
    builder
      .addCase(updateBudgetSalary.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateBudgetSalary.fulfilled, (state, action) => {
        state.isLoading = false;
        state.budget = action.payload;
        state.error = null;
      })
      .addCase(updateBudgetSalary.rejected, (state, action) => {
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
  addCustomMethod,
  removeCustomMethod,
  clearError,
  updateAllocations,
} = budgetSlice.actions;

export default budgetSlice.reducer;

// Selectors
export const selectBudget = (state: { budget: BudgetState }) => state.budget.budget;
export const selectBudgetStats = (state: { budget: BudgetState }) => state.budget.stats;
export const selectBudgetMethods = (state: { budget: BudgetState }) => state.budget.availableMethods;
export const selectBudgetLoading = (state: { budget: BudgetState }) => state.budget.isLoading;
export const selectBudgetError = (state: { budget: BudgetState }) => state.budget.error;
export const selectBudgetInitialized = (state: { budget: BudgetState }) => state.budget.isInitialized;

// Computed selectors
export const selectCurrentBudgetMethod = (state: { budget: BudgetState }) => {
  const budget = selectBudget(state);
  return budget?.method || null;
};

export const selectBudgetUsageStatus = (state: { budget: BudgetState }) => {
  const stats = selectBudgetStats(state);
  if (!stats) return null;
  
  const overallUsage = (stats.totalExpenses / stats.totalIncome) * 100;
  
  if (overallUsage <= 80) return 'safe';
  if (overallUsage <= 100) return 'warning';
  return 'danger';
};

export const selectCategoryUsage = (state: { budget: BudgetState }) => {
  const stats = selectBudgetStats(state);
  const budget = selectBudget(state);
  
  if (!stats || !budget) return null;
  
  return {
    needs: {
      spent: stats.categorySpending.needs,
      allocated: budget.allocations.needs,
      percentage: stats.percentageUsed.needs,
    },
    wants: {
      spent: stats.categorySpending.wants,
      allocated: budget.allocations.wants,
      percentage: stats.percentageUsed.wants,
    },
    savings: {
      spent: stats.categorySpending.savings,
      allocated: budget.allocations.savings,
      percentage: stats.percentageUsed.savings,
    },
  };
};