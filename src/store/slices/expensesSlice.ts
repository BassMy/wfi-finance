// src/store/slices/expensesSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Expense, ExpenseInput, LoadingState } from '../../types';
import { FirestoreService } from '../../services/firebase/firestore.service';

const firestoreService = FirestoreService.getInstance();

export const fetchExpenses = createAsyncThunk(
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

export const addExpense = createAsyncThunk(
  'expenses/addExpense',
  async ({ userId, expense }: { userId: string; expense: ExpenseInput }, { rejectWithValue }) => {
    try {
      const response = await firestoreService.createExpense(userId, expense);
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

export const deleteExpense = createAsyncThunk(
  'expenses/deleteExpense',
  async ({ expenseId, userId }: { expenseId: string; userId: string }, { rejectWithValue }) => {
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

interface ExpensesState extends LoadingState {
  expenses: Expense[];
  totals: {
    needs: number;
    wants: number;
    savings: number;
    total: number;
  };
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
    },
    setExpenses: (state, action: PayloadAction<Expense[]>) => {
      state.expenses = action.payload;
      state.totals = calculateTotals(action.payload);
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
        state.error = action.payload as string;
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
        state.error = action.payload as string;
      });

    // Delete expense
    builder
      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.expenses = state.expenses.filter(expense => expense.id !== action.payload);
        state.totals = calculateTotals(state.expenses);
      })
      .addCase(deleteExpense.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearExpenses, setExpenses } = expensesSlice.actions;
export default expensesSlice.reducer;