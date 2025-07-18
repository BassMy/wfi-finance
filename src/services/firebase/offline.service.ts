// src/services/firebase/offline.service.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { FirestoreService } from './firestore.service';
import firebaseConfig from './config';
import { 
  Expense, 
  Subscription, 
  Budget, 
  ApiResponse 
} from '../../types';
import { STORAGE_KEYS } from '../../utils/constants';

interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: 'expenses' | 'subscriptions' | 'budgets';
  data: any;
  timestamp: string;
  userId: string;
}

interface OfflineData {
  expenses: Expense[];
  subscriptions: Subscription[];
  budget: Budget | null;
  lastSync: string;
  pendingActions: OfflineAction[];
}

export class OfflineService {
  private static instance: OfflineService;
  private firestoreService: FirestoreService;
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;

  private constructor() {
    this.firestoreService = FirestoreService.getInstance();
    this.initializeNetworkListener();
  }

  public static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }

  /**
   * Initialiser l'écoute du statut réseau
   */
  private async initializeNetworkListener() {
    try {
      // Vérifier le statut initial
      const state = await NetInfo.fetch();
      this.isOnline = state.isConnected ?? false;

      // Écouter les changements de connectivité
      NetInfo.addEventListener(state => {
        const wasOffline = !this.isOnline;
        this.isOnline = state.isConnected ?? false;

        console.log('📶 Network status changed:', this.isOnline ? 'ONLINE' : 'OFFLINE');

        // Si on revient en ligne, synchroniser automatiquement
        if (wasOffline && this.isOnline) {
          this.autoSync();
        }

        // Analytics
        firebaseConfig.analytics.logEvent('network_status_changed', {
          is_online: this.isOnline,
          connection_type: state.type,
        });
      });
    } catch (error) {
      console.warn('Failed to initialize network listener:', error);
    }
  }

  /**
   * Vérifier si l'appareil est en ligne
   */
  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Sauvegarder les données localement
   */
  async saveOfflineData(userId: string, data: Partial<OfflineData>): Promise<void> {
    try {
      const key = `${STORAGE_KEYS.offlineData}_${userId}`;
      const existingData = await this.getOfflineData(userId);
      
      const updatedData: OfflineData = {
        ...existingData,
        ...data,
        lastSync: new Date().toISOString(),
      };

      await AsyncStorage.setItem(key, JSON.stringify(updatedData));
      console.log('💾 Offline data saved successfully');
    } catch (error) {
      console.error('❌ Error saving offline data:', error);
    }
  }

  /**
   * Récupérer les données locales
   */
  async getOfflineData(userId: string): Promise<OfflineData> {
    try {
      const key = `${STORAGE_KEYS.offlineData}_${userId}`;
      const storedData = await AsyncStorage.getItem(key);
      
      if (storedData) {
        return JSON.parse(storedData);
      }
    } catch (error) {
      console.error('❌ Error getting offline data:', error);
    }

    // Retourner des données par défaut
    return {
      expenses: [],
      subscriptions: [],
      budget: null,
      lastSync: new Date().toISOString(),
      pendingActions: [],
    };
  }

  /**
   * Ajouter une action à la file d'attente hors-ligne
   */
  async addPendingAction(
    userId: string,
    type: OfflineAction['type'],
    collection: OfflineAction['collection'],
    data: any
  ): Promise<void> {
    try {
      const offlineData = await this.getOfflineData(userId);
      
      const action: OfflineAction = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        collection,
        data,
        timestamp: new Date().toISOString(),
        userId,
      };

      offlineData.pendingActions.push(action);
      await this.saveOfflineData(userId, { pendingActions: offlineData.pendingActions });

      console.log('📝 Pending action added:', action.type, action.collection);
    } catch (error) {
      console.error('❌ Error adding pending action:', error);
    }
  }

  /**
   * Créer une dépense hors-ligne
   */
  async createExpenseOffline(
    userId: string,
    expense: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<ApiResponse<Expense>> {
    try {
      const expenseData: Expense = {
        id: `offline_${Date.now()}`,
        userId,
        ...expense,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Sauvegarder localement
      const offlineData = await this.getOfflineData(userId);
      offlineData.expenses.unshift(expenseData);
      
      // Ajouter à la file d'attente de synchronisation
      await this.addPendingAction(userId, 'create', 'expenses', expenseData);
      await this.saveOfflineData(userId, { expenses: offlineData.expenses });

      console.log('📱 Expense created offline:', expenseData.id);
      return {
        success: true,
        data: expenseData,
        message: 'Dépense sauvegardée localement (sera synchronisée)',
      };
    } catch (error) {
      console.error('❌ Error creating expense offline:', error);
      return {
        success: false,
        error: 'Erreur lors de la création hors-ligne',
      };
    }
  }

  /**
   * Synchroniser les données avec le serveur
   */
  async syncWithServer(userId: string): Promise<ApiResponse<{
    synced: number;
    failed: number;
    details: Array<{ action: string; status: 'success' | 'failed'; error?: string }>;
  }>> {
    if (this.syncInProgress) {
      return {
        success: false,
        error: 'Synchronisation déjà en cours',
      };
    }

    if (!this.isOnline) {
      return {
        success: false,
        error: 'Pas de connexion internet',
      };
    }

    this.syncInProgress = true;

    try {
      console.log('🔄 Starting sync with server for user:', userId);

      const offlineData = await this.getOfflineData(userId);
      const results = [];
      let synced = 0;
      let failed = 0;

      // Synchroniser les actions en attente
      for (const action of offlineData.pendingActions) {
        try {
          let result;

          switch (`${action.collection}_${action.type}`) {
            case 'expenses_create':
              // Remplacer l'ID temporaire par un vrai ID
              const expenseData = { ...action.data };
              delete expenseData.id; // Supprimer l'ID temporaire
              result = await this.firestoreService.createExpense(userId, expenseData);
              break;

            case 'subscriptions_create':
              const subscriptionData = { ...action.data };
              delete subscriptionData.id;
              result = await this.firestoreService.createSubscription(userId, subscriptionData);
              break;

            case 'expenses_update':
              result = await this.firestoreService.updateDocument('expenses', action.data.id, action.data);
              break;

            case 'subscriptions_update':
              result = await this.firestoreService.updateDocument('subscriptions', action.data.id, action.data);
              break;

            case 'expenses_delete':
              result = await this.firestoreService.deleteExpense(action.data.id, userId);
              break;

            default:
              result = { success: false, error: 'Action non supportée' };
          }

          if (result.success) {
            synced++;
            results.push({
              action: `${action.type} ${action.collection}`,
              status: 'success' as const,
            });

            // Mettre à jour les données locales avec les vraies données du serveur
            if (action.type === 'create' && result.data) {
              await this.updateLocalDataAfterSync(userId, action, result.data);
            }
          } else {
            failed++;
            results.push({
              action: `${action.type} ${action.collection}`,
              status: 'failed' as const,
              error: result.error,
            });
          }
        } catch (error) {
          failed++;
          results.push({
            action: `${action.type} ${action.collection}`,
            status: 'failed' as const,
            error: (error as Error).message,
          });
        }
      }

      // Supprimer les actions synchronisées avec succès
      const remainingActions = offlineData.pendingActions.filter((_, index) => 
        results[index]?.status === 'failed'
      );

      // Récupérer les données fraîches du serveur
      await this.refreshDataFromServer(userId);

      // Mettre à jour les données locales
      await this.saveOfflineData(userId, {
        pendingActions: remainingActions,
        lastSync: new Date().toISOString(),
      });

      // Analytics
      await firebaseConfig.analytics.logEvent('offline_sync_completed', {
        user_id: userId,
        synced_count: synced,
        failed_count: failed,
      });

      console.log('✅ Sync completed:', { synced, failed });
      return {
        success: true,
        data: { synced, failed, details: results },
      };
    } catch (error) {
      console.error('❌ Error during sync:', error);
      await firebaseConfig.crashlytics.recordError(error as Error);
      
      return {
        success: false,
        error: 'Erreur lors de la synchronisation',
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Synchronisation automatique en arrière-plan
   */
  private async autoSync() {
    try {
      // Récupérer l'utilisateur actuel (simplifié)
      const currentUser = firebaseConfig.auth.currentUser;
      if (currentUser) {
        await this.syncWithServer(currentUser.uid);
      }
    } catch (error) {
      console.warn('Auto-sync failed:', error);
    }
  }

  /**
   * Mettre à jour les données locales après synchronisation
   */
  private async updateLocalDataAfterSync(
    userId: string,
    action: OfflineAction,
    serverData: any
  ): Promise<void> {
    try {
      const offlineData = await this.getOfflineData(userId);

      if (action.collection === 'expenses') {
        // Remplacer la dépense avec l'ID temporaire par celle du serveur
        const index = offlineData.expenses.findIndex(e => e.id === action.data.id);
        if (index >= 0) {
          offlineData.expenses[index] = serverData;
        }
      } else if (action.collection === 'subscriptions') {
        const index = offlineData.subscriptions.findIndex(s => s.id === action.data.id);
        if (index >= 0) {
          offlineData.subscriptions[index] = serverData;
        }
      }

      await this.saveOfflineData(userId, offlineData);
    } catch (error) {
      console.warn('Failed to update local data after sync:', error);
    }
  }

  /**
   * Rafraîchir les données depuis le serveur
   */
  private async refreshDataFromServer(userId: string): Promise<void> {
    try {
      const [expensesResult, subscriptionsResult, budgetResult] = await Promise.all([
        this.firestoreService.getUserExpenses(userId),
        this.firestoreService.getUserSubscriptions(userId),
        this.firestoreService.getUserBudget(userId),
      ]);

      const updateData: Partial<OfflineData> = {};

      if (expensesResult.success && expensesResult.data) {
        updateData.expenses = expensesResult.data;
      }

      if (subscriptionsResult.success && subscriptionsResult.data) {
        updateData.subscriptions = subscriptionsResult.data;
      }

      if (budgetResult.success && budgetResult.data) {
        updateData.budget = budgetResult.data;
      }

      await this.saveOfflineData(userId, updateData);
    } catch (error) {
      console.warn('Failed to refresh data from server:', error);
    }
  }

  /**
   * Vérifier s'il y a des actions en attente
   */
  async hasPendingActions(userId: string): Promise<boolean> {
    try {
      const offlineData = await this.getOfflineData(userId);
      return offlineData.pendingActions.length > 0;
    } catch (error) {
      console.error('Error checking pending actions:', error);
      return false;
    }
  }

  /**
   * Obtenir le nombre d'actions en attente
   */
  async getPendingActionsCount(userId: string): Promise<number> {
    try {
      const offlineData = await this.getOfflineData(userId);
      return offlineData.pendingActions.length;
    } catch (error) {
      console.error('Error getting pending actions count:', error);
      return 0;
    }
  }

  /**
   * Nettoyer les données hors-ligne
   */
  async clearOfflineData(userId: string): Promise<void> {
    try {
      const key = `${STORAGE_KEYS.offlineData}_${userId}`;
      await AsyncStorage.removeItem(key);
      console.log('🧹 Offline data cleared');
    } catch (error) {
      console.error('Error clearing offline data:', error);
    }
  }

  /**
   * Obtenir des statistiques sur l'utilisation hors-ligne
   */
  async getOfflineStats(userId: string): Promise<{
    lastSync: string;
    pendingActionsCount: number;
    offlineDataSize: number;
    isOnline: boolean;
  }> {
    try {
      const offlineData = await this.getOfflineData(userId);
      const dataSize = JSON.stringify(offlineData).length;

      return {
        lastSync: offlineData.lastSync,
        pendingActionsCount: offlineData.pendingActions.length,
        offlineDataSize: dataSize,
        isOnline: this.isOnline,
      };
    } catch (error) {
      console.error('Error getting offline stats:', error);
      return {
        lastSync: 'Unknown',
        pendingActionsCount: 0,
        offlineDataSize: 0,
        isOnline: this.isOnline,
      };
    }
  }

  /**
   * Forcer une synchronisation manuelle
   */
  async forcSync(userId: string): Promise<ApiResponse<any>> {
    console.log('🔄 Force sync requested by user');
    return await this.syncWithServer(userId);
  }
}

export default OfflineService.getInstance();