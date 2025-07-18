// src/store/slices/subscriptionsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Subscription, SubscriptionInput, LoadingState } from '../../types';
import { FirestoreService } from '../../services/firebase/firestore.service';

const firestoreService = FirestoreService.getInstance();

export const fetchSubscriptions = createAsyncThunk(
  'subscriptions/fetchSubscriptions',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await firestoreService.getUserSubscriptions(userId);
      if (response.success) {
        return response.data || [];
      } else {
        return rejectWithValue(response.error || 'Erreur lors du chargement');
      }
    } catch (error) {
      return rejectWithValue('Erreur lors du chargement des abonnements');
    }
  }
);

export const addSubscription = createAsyncThunk(
  'subscriptions/addSubscription',
  async ({ userId, subscription }: { userId: string; subscription: SubscriptionInput }, { rejectWithValue }) => {
    try {
      const subscriptionData = {
        ...subscription,
        isActive: true,
        startDate: subscription.startDate || new Date().toISOString(),
        nextBillDate: calculateNextBillDate(subscription.startDate || new Date().toISOString(), subscription.period),
      };

      const response = await firestoreService.createSubscription(userId, subscriptionData);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Erreur lors de l\'ajout');
      }
    } catch (error) {
      return rejectWithValue('Erreur lors de l\'ajout de l\'abonnement');
    }
  }
);

export const updateSubscription = createAsyncThunk(
  'subscriptions/updateSubscription',
  async ({ subscriptionId, userId, updates }: { subscriptionId: string; userId: string; updates: Partial<Subscription> }, { rejectWithValue }) => {
    try {
      const response = await firestoreService.updateSubscription(subscriptionId, userId, updates);
      if (response.success) {
        return { subscriptionId, updates };
      } else {
        return rejectWithValue(response.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      return rejectWithValue('Erreur lors de la mise à jour de l\'abonnement');
    }
  }
);

// Fonction utilitaire pour calculer la prochaine facture
const calculateNextBillDate = (startDate: string, period: string): string => {
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

interface SubscriptionsState extends LoadingState {
  subscriptions: Subscription[];
  monthlyTotal: number;
  yearlyTotal: number;
  activeCount: number;
}

const initialState: SubscriptionsState = {
  subscriptions: [],
  monthlyTotal: 0,
  yearlyTotal: 0,
  activeCount: 0,
  isLoading: false,
  error: null,
};

const calculateSubscriptionStats = (subscriptions: Subscription[]) => {
  const activeSubscriptions = subscriptions.filter(sub => sub.isActive);
  
  const monthlyTotal = activeSubscriptions.reduce((total, sub) => {
    let monthlyPrice = sub.price;
    switch (sub.period) {
      case 'weekly':
        monthlyPrice = sub.price * 4.33;
        break;
      case 'yearly':
        monthlyPrice = sub.price / 12;
        break;
    }
    return total + monthlyPrice;
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