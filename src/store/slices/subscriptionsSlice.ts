// src/store/slices/subscriptionsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Types simplifiés intégrés
type SubscriptionPeriod = 'weekly' | 'monthly' | 'yearly';
type SubscriptionCategory = 'streaming' | 'music' | 'productivity' | 'fitness' | 'news' | 'other';
type ExpenseCategory = 'needs' | 'wants' | 'savings';

interface Subscription {
  id: string;
  name: string;
  price: number;
  period: SubscriptionPeriod;
  category: SubscriptionCategory;
  budgetCategory: ExpenseCategory;
  description?: string;
  isActive: boolean;
  startDate: string;
  nextBillDate: string;
}

interface SubscriptionInput {
  name: string;
  price: number;
  period: SubscriptionPeriod;
  category: SubscriptionCategory;
  budgetCategory: ExpenseCategory;
  description?: string;
  startDate?: string;
}

// Actions asynchrones simplifiées
export const fetchSubscriptions = createAsyncThunk(
  'subscriptions/fetchSubscriptions',
  async (userId: string, { rejectWithValue }) => {
    try {
      // Simulation de chargement
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Données de test
      const mockSubscriptions: Subscription[] = [
        {
          id: '1',
          name: 'Netflix',
          price: 15.99,
          period: 'monthly',
          category: 'streaming',
          budgetCategory: 'wants',
          description: 'Plateforme de streaming vidéo',
          isActive: true,
          startDate: new Date(Date.now() - 30 * 86400000).toISOString(),
          nextBillDate: new Date(Date.now() + 5 * 86400000).toISOString(),
        },
        {
          id: '2',
          name: 'Spotify Premium',
          price: 9.99,
          period: 'monthly',
          category: 'music',
          budgetCategory: 'wants',
          description: 'Musique en streaming',
          isActive: true,
          startDate: new Date(Date.now() - 60 * 86400000).toISOString(),
          nextBillDate: new Date(Date.now() + 10 * 86400000).toISOString(),
        },
        {
          id: '3',
          name: 'Adobe Creative Cloud',
          price: 59.99,
          period: 'monthly',
          category: 'productivity',
          budgetCategory: 'needs',
          description: 'Suite créative professionnelle',
          isActive: false,
          startDate: new Date(Date.now() - 90 * 86400000).toISOString(),
          nextBillDate: new Date(Date.now() + 15 * 86400000).toISOString(),
        },
      ];
      
      return mockSubscriptions;
    } catch (error) {
      return rejectWithValue('Erreur lors du chargement des abonnements');
    }
  }
);

export const addSubscription = createAsyncThunk(
  'subscriptions/addSubscription',
  async ({ userId, subscription }: { userId: string; subscription: SubscriptionInput }, { rejectWithValue }) => {
    try {
      // Simulation d'ajout
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const calculateNextBillDate = (startDate: string, period: SubscriptionPeriod): string => {
        const date = new Date(startDate);
        switch (period) {
          case 'weekly':
            date.setDate(date.getDate() + 7);
            break;
          case 'monthly':
            date.setMonth(date.getMonth() + 1);
            break;
          case 'yearly':
            date.setFullYear(date.getFullYear() + 1);
            break;
        }
        return date.toISOString();
      };

      const startDate = subscription.startDate || new Date().toISOString();
      
      const newSubscription: Subscription = {
        id: Date.now().toString(),
        name: subscription.name,
        price: subscription.price,
        period: subscription.period,
        category: subscription.category,
        budgetCategory: subscription.budgetCategory,
        description: subscription.description,
        isActive: true,
        startDate,
        nextBillDate: calculateNextBillDate(startDate, subscription.period),
      };
      
      return newSubscription;
    } catch (error) {
      return rejectWithValue('Erreur lors de l\'ajout de l\'abonnement');
    }
  }
);

export const updateSubscription = createAsyncThunk(
  'subscriptions/updateSubscription',
  async ({ subscriptionId, userId, updates }: { subscriptionId: string; userId: string; updates: Partial<Subscription> }, { rejectWithValue }) => {
    try {
      // Simulation de mise à jour
      await new Promise(resolve => setTimeout(resolve, 200));
      return { subscriptionId, updates };
    } catch (error) {
      return rejectWithValue('Erreur lors de la mise à jour de l\'abonnement');
    }
  }
);

interface SubscriptionsState {
  subscriptions: Subscription[];
  monthlyTotal: number;
  yearlyTotal: number;
  activeCount: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: SubscriptionsState = {
  subscriptions: [],
  monthlyTotal: 0,
  yearlyTotal: 0,
  activeCount: 0,
  isLoading: false,
  error: null,
};

const convertSubscriptionToMonthly = (price: number, period: SubscriptionPeriod): number => {
  switch (period) {
    case 'weekly':
      return price * 4.33; // 4.33 semaines par mois en moyenne
    case 'monthly':
      return price;
    case 'yearly':
      return price / 12;
    default:
      return price;
  }
};

const calculateSubscriptionStats = (subscriptions: Subscription[]) => {
  const activeSubscriptions = subscriptions.filter(sub => sub.isActive);
  
  const monthlyTotal = activeSubscriptions.reduce((total, sub) => {
    return total + convertSubscriptionToMonthly(sub.price, sub.period);
  }, 0);

  return {
    monthlyTotal,
    yearlyTotal: monthlyTotal * 12,
    activeCount: activeSubscriptions.length,
  };
};

const subscriptionsSlice = createSlice({
  name: 'subscriptions',
  initialState,
  reducers: {
    clearSubscriptions: (state) => {
      state.subscriptions = [];
      state.monthlyTotal = 0;
      state.yearlyTotal = 0;
      state.activeCount = 0;
    },
    setSubscriptions: (state, action: PayloadAction<Subscription[]>) => {
      state.subscriptions = action.payload;
      const stats = calculateSubscriptionStats(action.payload);
      state.monthlyTotal = stats.monthlyTotal;
      state.yearlyTotal = stats.yearlyTotal;
      state.activeCount = stats.activeCount;
    },
  },
  extraReducers: (builder) => {
    // Fetch subscriptions
    builder
      .addCase(fetchSubscriptions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSubscriptions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.subscriptions = action.payload;
        const stats = calculateSubscriptionStats(action.payload);
        state.monthlyTotal = stats.monthlyTotal;
        state.yearlyTotal = stats.yearlyTotal;
        state.activeCount = stats.activeCount;
      })
      .addCase(fetchSubscriptions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Add subscription
    builder
      .addCase(addSubscription.fulfilled, (state, action) => {
        state.subscriptions.unshift(action.payload);
        const stats = calculateSubscriptionStats(state.subscriptions);
        state.monthlyTotal = stats.monthlyTotal;
        state.yearlyTotal = stats.yearlyTotal;
        state.activeCount = stats.activeCount;
      })
      .addCase(addSubscription.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Update subscription
    builder
      .addCase(updateSubscription.fulfilled, (state, action) => {
        const { subscriptionId, updates } = action.payload;
        const index = state.subscriptions.findIndex(sub => sub.id === subscriptionId);
        if (index !== -1) {
          state.subscriptions[index] = { ...state.subscriptions[index], ...updates };
          const stats = calculateSubscriptionStats(state.subscriptions);
          state.monthlyTotal = stats.monthlyTotal;
          state.yearlyTotal = stats.yearlyTotal;
          state.activeCount = stats.activeCount;
        }
      })
      .addCase(updateSubscription.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearSubscriptions, setSubscriptions } = subscriptionsSlice.actions;
export default subscriptionsSlice.reducer;