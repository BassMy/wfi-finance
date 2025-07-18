// src/hooks/useFirestore.ts
import { useState, useEffect, useCallback } from 'react';
import { FirestoreService } from '../services/firebase/firestore.service';
import { useAuth } from './useAuth';
import { 
  Expense, 
  Subscription, 
  Budget, 
  ExpenseInput, 
  SubscriptionInput, 
  PaginationParams,
  DateRange,
  ApiResponse 
} from '../types';

interface FirestoreState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface FirestoreListState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  refreshing: boolean;
}

export const useFirestore = () => {
  const { user } = useAuth();
  const firestoreService = FirestoreService.getInstance();

  // ==========================================
  // HOOK POUR LES DÉPENSES
  // ==========================================
  
  const useExpenses = (
    pagination?: PaginationParams,
    dateRange?: DateRange,
    autoLoad = true
  ) => {
    const [state, setState] = useState<FirestoreListState<Expense>>({
      data: [],
      loading: false,
      error: null,
      hasMore: true,
      refreshing: false,
    });

    const loadExpenses = useCallback(async (refresh = false) => {
      if (!user) return;

      setState(prev => ({ 
        ...prev, 
        loading: !refresh, 
        refreshing: refresh,
        error: null 
      }));

      try {
        const result = await firestoreService.getUserExpenses(user.uid, pagination, dateRange);
        
        if (result.success) {
          setState(prev => ({
            ...prev,
            data: result.data || [],
            hasMore: (result.data?.length || 0) >= (pagination?.limit || 50),
            loading: false,
            refreshing: false,
          }));
        } else {
          setState(prev => ({
            ...prev,
            error: result.error || 'Erreur lors du chargement',
            loading: false,
            refreshing: false,
          }));
        }
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: 'Erreur inattendue',
          loading: false,
          refreshing: false,
        }));
      }
    }, [user, pagination, dateRange, firestoreService]);

    const addExpense = useCallback(async (expense: ExpenseInput): Promise<boolean> => {
      if (!user) return false;

      try {
        const result = await firestoreService.createExpense(user.uid, expense);
        
        if (result.success && result.data) {
          setState(prev => ({
            ...prev,
            data: [result.data!, ...prev.data],
          }));
          return true;
        }
        return false;
      } catch (error) {
        return false;
      }
    }, [user, firestoreService]);

    const deleteExpense = useCallback(async (expenseId: string): Promise<boolean> => {
      if (!user) return false;

      try {
        const result = await firestoreService.deleteExpense(expenseId, user.uid);
        
        if (result.success) {
          setState(prev => ({
            ...prev,
            data: prev.data.filter(expense => expense.id !== expenseId),
          }));
          return true;
        }
        return false;
      } catch (error) {
        return false;
      }
    }, [user, firestoreService]);

    const refresh = useCallback(() => {
      loadExpenses(true);
    }, [loadExpenses]);

    useEffect(() => {
      if (autoLoad && user) {
        loadExpenses();
      }
    }, [autoLoad, user, loadExpenses]);

    return {
      ...state,
      refresh,
      loadMore: loadExpenses,
      addExpense,
      deleteExpense,
    };
  };

  // ==========================================
  // HOOK POUR LES ABONNEMENTS
  // ==========================================
  
  const useSubscriptions = (autoLoad = true) => {
    const [state, setState] = useState<FirestoreListState<Subscription>>({
      data: [],
      loading: false,
      error: null,
      hasMore: false,
      refreshing: false,
    });

    const loadSubscriptions = useCallback(async (refresh = false) => {
      if (!user) return;

      setState(prev => ({ 
        ...prev, 
        loading: !refresh, 
        refreshing: refresh,
        error: null 
      }));

      try {
        const result = await firestoreService.getUserSubscriptions(user.uid);
        
        if (result.success) {
          setState(prev => ({
            ...prev,
            data: result.data || [],
            loading: false,
            refreshing: false,
          }));
        } else {
          setState(prev => ({
            ...prev,
            error: result.error || 'Erreur lors du chargement',
            loading: false,
            refreshing: false,
          }));
        }
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: 'Erreur inattendue',
          loading: false,
          refreshing: false,
        }));
      }
    }, [user, firestoreService]);

    const addSubscription = useCallback(async (subscription: SubscriptionInput): Promise<boolean> => {
      if (!user) return false;

      try {
        const result = await firestoreService.createSubscription(user.uid, subscription);
        
        if (result.success && result.data) {
          setState(prev => ({
            ...prev,
            data: [result.data!, ...prev.data],
          }));
          return true;
        }
        return false;
      } catch (error) {
        return false;
      }
    }, [user, firestoreService]);

    const updateSubscription = useCallback(async (
      subscriptionId: string, 
      updates: Partial<Subscription>
    ): Promise<boolean> => {
      if (!user) return false;

      try {
        const result = await firestoreService.updateSubscription(subscriptionId, user.uid, updates);
        
        if (result.success) {
          setState(prev => ({
            ...prev,
            data: prev.data.map(sub => 
              sub.id === subscriptionId 
                ? { ...sub, ...updates }
                : sub
            ),
          }));
          return true;
        }
        return false;
      } catch (error) {
        return false;
      }
    }, [user, firestoreService]);

    const refresh = useCallback(() => {
      loadSubscriptions(true);
    }, [loadSubscriptions]);

    useEffect(() => {
      if (autoLoad && user) {
        loadSubscriptions();
      }
    }, [autoLoad, user, loadSubscriptions]);

    return {
      ...state,
      refresh,
      addSubscription,
      updateSubscription,
    };
  };

  // ==========================================
  // HOOK POUR LE BUDGET
  // ==========================================
  
  const useBudget = (autoLoad = true) => {
    const [state, setState] = useState<FirestoreState<Budget>>({
      data: null,
      loading: false,
      error: null,
    });

    const loadBudget = useCallback(async () => {
      if (!user) return;

      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const result = await firestoreService.getUserBudget(user.uid);
        
        setState(prev => ({
          ...prev,
          data: result.data,
          loading: false,
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: 'Erreur lors du chargement du budget',
          loading: false,
        }));
      }
    }, [user, firestoreService]);

    const saveBudget = useCallback(async (budgetData: any): Promise<boolean> => {
      if (!user) return false;

      try {
        const result = await firestoreService.upsertBudget(user.uid, budgetData);
        
        if (result.success && result.data) {
          setState(prev => ({
            ...prev,
            data: result.data!,
          }));
          return true;
        }
        return false;
      } catch (error) {
        return false;
      }
    }, [user, firestoreService]);

    useEffect(() => {
      if (autoLoad && user) {
        loadBudget();
      }
    }, [autoLoad, user, loadBudget]);

    return {
      ...state,
      refresh: loadBudget,
      saveBudget,
    };
  };

  // ==========================================
  // HOOK POUR LES LISTENERS TEMPS RÉEL
  // ==========================================
  
  const useRealtimeExpenses = () => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      if (!user) return;

      const unsubscribe = firestoreService.onUserExpensesChanged(
        user.uid,
        (newExpenses) => {
          setExpenses(newExpenses);
          setError(null);
        },
        (error) => {
          setError(error.message);
        }
      );

      return unsubscribe;
    }, [user, firestoreService]);

    return { expenses, error };
  };

  const useRealtimeSubscriptions = () => {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      if (!user) return;

      const unsubscribe = firestoreService.onUserSubscriptionsChanged(
        user.uid,
        (newSubscriptions) => {
          setSubscriptions(newSubscriptions);
          setError(null);
        },
        (error) => {
          setError(error.message);
        }
      );

      return unsubscribe;
    }, [user, firestoreService]);

    return { subscriptions, error };
  };

  const useRealtimeBudget = () => {
    const [budget, setBudget] = useState<Budget | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      if (!user) return;

      const unsubscribe = firestoreService.onUserBudgetChanged(
        user.uid,
        (newBudget) => {
          setBudget(newBudget);
          setError(null);
        },
        (error) => {
          setError(error.message);
        }
      );

      return unsubscribe;
    }, [user, firestoreService]);

    return { budget, error };
  };

  // ==========================================
  // HOOK POUR LES OPÉRATIONS BATCH
  // ==========================================
  
  const useBatchOperations = () => {
    const [loading, setLoading] = useState(false);

    const deleteMultipleExpenses = useCallback(async (expenseIds: string[]): Promise<{
      success: number;
      failed: number;
      errors: string[];
    }> => {
      if (!user) return { success: 0, failed: 0, errors: [] };

      setLoading(true);
      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      try {
        for (const expenseId of expenseIds) {
          try {
            const result = await firestoreService.deleteExpense(expenseId, user.uid);
            if (result.success) {
              success++;
            } else {
              failed++;
              errors.push(result.error || 'Erreur inconnue');
            }
          } catch (error) {
            failed++;
            errors.push('Erreur lors de la suppression');
          }
        }
      } finally {
        setLoading(false);
      }

      return { success, failed, errors };
    }, [user, firestoreService]);

    const updateMultipleSubscriptions = useCallback(async (
      updates: Array<{ id: string; data: Partial<Subscription> }>
    ): Promise<{
      success: number;
      failed: number;
      errors: string[];
    }> => {
      if (!user) return { success: 0, failed: 0, errors: [] };

      setLoading(true);
      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      try {
        for (const update of updates) {
          try {
            const result = await firestoreService.updateSubscription(
              update.id, 
              user.uid, 
              update.data
            );
            if (result.success) {
              success++;
            } else {
              failed++;
              errors.push(result.error || 'Erreur inconnue');
            }
          } catch (error) {
            failed++;
            errors.push('Erreur lors de la mise à jour');
          }
        }
      } finally {
        setLoading(false);
      }

      return { success, failed, errors };
    }, [user, firestoreService]);

    return {
      loading,
      deleteMultipleExpenses,
      updateMultipleSubscriptions,
    };
  };

  // ==========================================
  // HOOK POUR LES STATISTIQUES
  // ==========================================
  
  const useFirestoreStats = () => {
    const [stats, setStats] = useState({
      totalExpenses: 0,
      totalSubscriptions: 0,
      activeSubscriptions: 0,
      monthlyExpenses: 0,
      hasBudget: false,
    });

    const { expenses } = useRealtimeExpenses();
    const { subscriptions } = useRealtimeSubscriptions();
    const { budget } = useRealtimeBudget();

    useEffect(() => {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const monthlyExpenses = expenses
        .filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate.getMonth() === currentMonth && 
                 expenseDate.getFullYear() === currentYear;
        })
        .reduce((sum, expense) => sum + expense.amount, 0);

      setStats({
        totalExpenses: expenses.reduce((sum, expense) => sum + expense.amount, 0),
        totalSubscriptions: subscriptions.length,
        activeSubscriptions: subscriptions.filter(sub => sub.isActive).length,
        monthlyExpenses,
        hasBudget: !!budget,
      });
    }, [expenses, subscriptions, budget]);

    return stats;
  };

  // ==========================================
  // HOOK POUR LA RECHERCHE AVANCÉE
  // ==========================================
  
  const useExpenseSearch = () => {
    const [searchResults, setSearchResults] = useState<Expense[]>([]);
    const [searching, setSearching] = useState(false);

    const searchExpenses = useCallback(async (
      query: string,
      filters?: {
        category?: string;
        dateFrom?: string;
        dateTo?: string;
        minAmount?: number;
        maxAmount?: number;
      }
    ) => {
      if (!user || !query.trim()) {
        setSearchResults([]);
        return;
      }

      setSearching(true);

      try {
        // Récupérer toutes les dépenses et filtrer côté client
        // Dans une vraie app, ceci devrait être fait côté serveur
        const result = await firestoreService.getUserExpenses(user.uid);
        
        if (result.success && result.data) {
          let filtered = result.data.filter(expense =>
            expense.description.toLowerCase().includes(query.toLowerCase())
          );

          if (filters) {
            if (filters.category) {
              filtered = filtered.filter(expense => expense.category === filters.category);
            }
            if (filters.dateFrom) {
              filtered = filtered.filter(expense => expense.date >= filters.dateFrom!);
            }
            if (filters.dateTo) {
              filtered = filtered.filter(expense => expense.date <= filters.dateTo!);
            }
            if (filters.minAmount !== undefined) {
              filtered = filtered.filter(expense => expense.amount >= filters.minAmount!);
            }
            if (filters.maxAmount !== undefined) {
              filtered = filtered.filter(expense => expense.amount <= filters.maxAmount!);
            }
          }

          setSearchResults(filtered);
        }
      } catch (error) {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, [user, firestoreService]);

    const clearSearch = useCallback(() => {
      setSearchResults([]);
    }, []);

    return {
      searchResults,
      searching,
      searchExpenses,
      clearSearch,
    };
  };

  return {
    // Hooks principaux
    useExpenses,
    useSubscriptions,
    useBudget,
    
    // Hooks temps réel
    useRealtimeExpenses,
    useRealtimeSubscriptions,
    useRealtimeBudget,
    
    // Hooks utilitaires
    useBatchOperations,
    useFirestoreStats,
    useExpenseSearch,
  };
};

// Hook simplifié pour usage rapide
export const useQuickFirestore = () => {
  const { user } = useAuth();
  const firestoreService = FirestoreService.getInstance();

  const quickAddExpense = useCallback(async (
    description: string,
    amount: number,
    category: 'needs' | 'wants' | 'savings'
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const result = await firestoreService.createExpense(user.uid, {
        description,
        amount,
        category,
        date: new Date().toISOString(),
      });
      return result.success;
    } catch {
      return false;
    }
  }, [user, firestoreService]);

  const quickToggleSubscription = useCallback(async (
    subscriptionId: string,
    isActive: boolean
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const result = await firestoreService.updateSubscription(
        subscriptionId,
        user.uid,
        { isActive }
      );
      return result.success;
    } catch {
      return false;
    }
  }, [user, firestoreService]);

  return {
    quickAddExpense,
    quickToggleSubscription,
  };
};