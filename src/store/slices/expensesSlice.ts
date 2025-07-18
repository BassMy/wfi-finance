// src/store/slices/expensesSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Expense, ExpenseInput } from '../../types/expense.types';
import { FirestoreService } from '../../services/firebase/firestore.service';

const firestoreService = FirestoreService.getInstance();

export const fetchExpenses = createAsyncThunk<Expense[], string>(
  'expenses/fetchExpenses',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await firestoreService.getUserExpenses(userId);
      if (response.success) {
        return response.data || [];
      } else {
        return rejectWithValue(response.error || 'Erreur lors du chargement');
      }
    } catch (error) {
      return rejectWithValue('Erreur lors du chargement des dépenses');
    }
  }
);

export const addExpense = createAsyncThunk<Expense, { userId: string; expense: ExpenseInput }>(
  'expenses/addExpense',
  async ({ userId, expense }, { rejectWithValue }) => {
    try {
      // Assurer que les champs requis sont présents
      const expenseData = {
        ...expense,
        date: expense.date || new Date().toISOString(),
        description: expense.description || '',
        category: expense.category || 'needs',
        amount: expense.amount || 0,
      };

      const response = await firestoreService.createExpense(userId, expenseData);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Erreur lors de l\'ajout');
      }
    } catch (error) {
      return rejectWithValue('Erreur lors de l\'ajout de la dépense');
    }
  }
);

export const deleteExpense = createAsyncThunk<string, { expenseId: string; userId: string }>(
  'expenses/deleteExpense',
  async ({ expenseId, userId }, { rejectWithValue }) => {
    try {
      const response = await firestoreService.deleteExpense(expenseId, userId);
      if (response.success) {
        return expenseId;
      } else {
        return rejectWithValue(response.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      return rejectWithValue('Erreur lors de la suppression de la dépense');
    }
  }
);

interface ExpensesState {
  expenses: Expense[];
  totals: {
    needs: number;
    wants: number;
    savings: number;
    total: number;
  };
  isLoading: boolean;
  error: string | null;
}

const initialState: ExpensesState = {
  expenses: [],
  totals: {
    needs: 0,
    wants: 0,
    savings: 0,
    total: 0,
  },
  isLoading: false,
  error: null,
};

const calculateTotals = (expenses: Expense[]) => {
  const totals = expenses.reduce(
    (acc, expense) => {
      acc[expense.category] += expense.amount;
      acc.total += expense.amount;
      return acc;
    },
    { needs: 0, wants: 0, savings: 0, total: 0 }
  );
  return totals;
};

const expensesSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    clearExpenses: (state) => {
      state.expenses = [];
      state.totals = {
        needs: 0,
        wants: 0,
        savings: 0,
        total: 0,
      };
      state.error = null;
    },
    
    setExpenses: (state, action: PayloadAction<Expense[]>) => {
      state.expenses = action.payload;
      state.totals = calculateTotals(action.payload);
    },
    
    clearError: (state) => {
      state.error = null;
    },
  },
  
  extraReducers: (builder) => {
    // Fetch expenses
    builder
      .addCase(fetchExpenses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.expenses = action.payload;
        state.totals = calculateTotals(action.payload);
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Erreur lors du chargement';
      });

    // Add expense
    builder
      .addCase(addExpense.pending, (state) => {
        state.error = null;
      })
      .addCase(addExpense.fulfilled, (state, action) => {
        state.expenses.unshift(action.payload);
        state.totals = calculateTotals(state.expenses);
      })
      .addCase(addExpense.rejected, (state, action) => {
        state.error = action.payload as string || 'Erreur lors de l\'ajout';
      });

    // Delete expense
    builder
      .addCase(deleteExpense.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.expenses = state.expenses.filter(expense => expense.id !== action.payload);
        state.totals = calculateTotals(state.expenses);
      })
      .addCase(deleteExpense.rejected, (state, action) => {
        state.error = action.payload as string || 'Erreur lors de la suppression';
      });
  },
});

export const { clearExpenses, setExpenses, clearError } = expensesSlice.actions;
export default expensesSlice.reducer;

// Selectors
export const selectExpenses = (state: { expenses: ExpensesState }) => state.expenses.expenses;
export const selectExpensesTotals = (state: { expenses: ExpensesState }) => state.expenses.totals;
export const selectExpensesLoading = (state: { expenses: ExpensesState }) => state.expenses.isLoading;
export const selectExpensesError = (state: { expenses: ExpensesState }) => state.expenses.error;

// Computed selectors
export const selectExpensesByCategory = (state: { expenses: ExpensesState }) => {
  const expenses = selectExpenses(state);
  return {
    needs: expenses.filter(expense => expense.category === 'needs'),
    wants: expenses.filter(expense => expense.category === 'wants'),
    savings: expenses.filter(expense => expense.category === 'savings'),
  };
};

export const selectRecentExpenses = (state: { expenses: ExpensesState }, limit: number = 10) => {
  const expenses = selectExpenses(state);
  return expenses
    .sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime())
    .slice(0, limit);
};

export const selectExpensesByDateRange = (state: { expenses: ExpensesState }, startDate: string, endDate: string) => {
  const expenses = selectExpenses(state);
  return expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= new Date(startDate) && expenseDate <= new Date(endDate);
  });
};