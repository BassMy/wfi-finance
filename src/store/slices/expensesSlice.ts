// src/store/slices/expensesSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Types simplifiés intégrés
type ExpenseCategory = 'needs' | 'wants' | 'savings';

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  createdAt?: string;
}

interface ExpenseInput {
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
}

// Actions asynchrones simplifiées
export const fetchExpenses = createAsyncThunk<Expense[], string>(
  'expenses/fetchExpenses',
  async (userId: string, { rejectWithValue }) => {
    try {
      // Simulation de chargement
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Données de test
      const mockExpenses: Expense[] = [
        {
          id: '1',
          description: 'Courses alimentaires',
          amount: 85.50,
          category: 'needs',
          date: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          description: 'Restaurant',
          amount: 45.00,
          category: 'wants',
          date: new Date(Date.now() - 86400000).toISOString(),
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: '3',
          description: 'Épargne mensuelle',
          amount: 200.00,
          category: 'savings',
          date: new Date(Date.now() - 172800000).toISOString(),
          createdAt: new Date(Date.now() - 172800000).toISOString(),
        },
      ];
      
      return mockExpenses;
    } catch (error) {
      return rejectWithValue('Erreur lors du chargement des dépenses');
    }
  }
);

export const addExpense = createAsyncThunk<Expense, { userId: string; expense: ExpenseInput }>(
  'expenses/addExpense',
  async ({ userId, expense }, { rejectWithValue }) => {
    try {
      // Simulation d'ajout
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const newExpense: Expense = {
        id: Date.now().toString(),
        description: expense.description,
        amount: expense.amount,
        category: expense.category,
        date: expense.date,
        createdAt: new Date().toISOString(),
      };
      
      return newExpense;
    } catch (error) {
      return rejectWithValue('Erreur lors de l\'ajout de la dépense');
    }
  }
);

export const deleteExpense = createAsyncThunk<string, { expenseId: string; userId: string }>(
  'expenses/deleteExpense',
  async ({ expenseId, userId }, { rejectWithValue }) => {
    try {
      // Simulation de suppression
      await new Promise(resolve => setTimeout(resolve, 200));
      return expenseId;
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
      .addCase(deleteExpense.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.expenses = state.expenses.filter(expense => expense.id !== action.payload);
        state.totals = calculateTotals(state.expenses);
      })
      .addCase(deleteExpense.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearExpenses, setExpenses, clearError } = expensesSlice.actions;
export default expensesSlice.reducer;