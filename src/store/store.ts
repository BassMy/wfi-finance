// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import expensesSlice from './slices/expensesSlice';
import subscriptionsSlice from './slices/subscriptionsSlice';
import budgetSlice from './slices/budgetSlice';
import settingsSlice from './slices/settingsSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    expenses: expensesSlice,
    subscriptions: subscriptionsSlice,
    budget: budgetSlice,
    settings: settingsSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;