// src/services/offline.service.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export interface OfflineAction {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string; // 'invoice', 'client', 'project', 'timeEntry', etc.
  entityId?: string;
  data: any;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
  priority: 'low' | 'medium' | 'high';
  dependencies?: string[]; // IDs d'autres actions qui doivent être exécutées avant
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt?: Date;
  pendingActionsCount: number;
  failedActionsCount: number;
  totalActionCount: number;
}

export interface ConflictResolution {
  actionId: string;
  resolution: 'local' | 'remote' | 'merge';
  data?: any;
}

export interface OfflineConfig {
  maxRetries: number;
  retryDelay: number; // en millisecondes
  syncInterval: number; // en millisecondes
  autoSync: boolean;
  conflictResolution: 'ask_user' | 'prefer_local' | 'prefer_remote';
  enableOfflineMode: boolean;
}

const STORAGE_KEYS = {
  OFFLINE_ACTIONS: '@offline_actions',
  OFFLINE_CONFIG: '@offline_config',
  LAST_SYNC: '@last_sync',
  CACHED_DATA: '@cached_data',
};

export class OfflineService {
  private static actions: OfflineAction[] = [];
  private static config: OfflineConfig = {
    maxRetries: 3,
    retryDelay: 5000,
    syncInterval: 30000,
    autoSync: true,
    conflictResolution: 'ask_user',
    enableOfflineMode: true,
  };
  private static isOnline: boolean = true;
  private static isSyncing: boolean = false;
  private static lastSyncAt?: Date;
  private static syncInterval?: NodeJS.Timeout;
  private static listeners: ((status: SyncStatus) => void)[] = [];
  private static cachedData: { [key: string]: any } = {};

  /**
   * Initialise le service offline
   */
  static async initialize(): Promise<void> {
    try {
      await this.loadActions();
      await this.loadConfig();
      await this.loadLastSync();
      await this.loadCachedData();
      
      // Écouter les changements de connectivité
      NetInfo.addEventListener(state => {
        const wasOnline = this.isOnline;
        this.isOnline = state.isConnected ?? false;
        
        if (!wasOnline && this.isOnline) {
          // Reconnexion détectée
          this.onConnectionRestored();
        }
        
        this.notifyListeners();
      });

      // Démarrer la synchronisation automatique si activée
      if (this.config.autoSync) {
        this.startAutoSync();
      }

      // Synchroniser au démarrage si en ligne
      const netState = await NetInfo.fetch();
      this.isOnline = netState.isConnected ?? false;
      
      if (this.isOnline && this.actions.length > 0) {
        setTimeout(() => this.syncPendingActions(), 1000);
      }

    } catch (error) {
      console.error('Erreur lors de l\'initialisation du service offline:', error);
    }
  }

  /**
   * Charge les actions depuis le stockage
   */
  private static async loadActions(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_ACTIONS);
      if (data) {
        this.actions = JSON.parse(data).map((action: any) => ({
          ...action,
          timestamp: new Date(action.timestamp),
        }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des actions offline:', error);
    }
  }

  /**
   * Charge la configuration depuis le stockage
   */
  private static async loadConfig(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_CONFIG);
      if (data) {
        this.config = { ...this.config, ...JSON.parse(data) };
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la configuration offline:', error);
    }
  }

  /**
   * Charge la date de dernière synchronisation
   */
  private static async loadLastSync(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      if (data) {
        this.lastSyncAt = new Date(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la dernière sync:', error);
    }
  }

  /**
   * Charge les données mises en cache
   */
  private static async loadCachedData(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_DATA);
      if (data) {
        this.cachedData = JSON.parse(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données en cache:', error);
    }
  }

  /**
   * Sauvegarde les actions
   */
  private static async saveActions(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_ACTIONS, JSON.stringify(this.actions));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des actions offline:', error);
    }
  }

  /**
   * Sauvegarde la configuration
   */
  private static async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_CONFIG, JSON.stringify(this.config));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la configuration offline:', error);
    }
  }

  /**
   * Sauvegarde la date de dernière synchronisation
   */
  private static async saveLastSync(): Promise<void> {
    try {
      if (this.lastSyncAt) {
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, this.lastSyncAt.toISOString());
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la dernière sync:', error);
    }
  }

  /**
   * Sauvegarde les données en cache
   */
  private static async saveCachedData(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CACHED_DATA, JSON.stringify(this.cachedData));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données en cache:', error);
    }
  }

  /**
   * Ajoute une action à la queue offline
   */
  static async addAction(
    type: OfflineAction['type'],
    entity: string,
    data: any,
    options: {
      entityId?: string;
      priority?: OfflineAction['priority'];
      dependencies?: string[];
      maxRetries?: number;
    } = {}
  ): Promise<string> {
    const action: OfflineAction = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      entity,
      entityId: options.entityId,
      data,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: options.maxRetries ?? this.config.maxRetries,
      priority: options.priority ?? 'medium',
      dependencies: options.dependencies,
    };

    this.actions.push(action);
    await this.saveActions();
    this.notifyListeners();

    // Essayer de synchroniser immédiatement si en ligne
    if (this.isOnline && !this.isSyncing) {
      setTimeout(() => this.syncPendingActions(), 100);
    }

    return action.id;
  }

  /**
   * Supprime une action de la queue
   */
  static async removeAction(actionId: string): Promise<void> {
    this.actions = this.actions.filter(action => action.id !== actionId);
    await this.saveActions();
    this.notifyListeners();
  }

  /**
   * Met à jour une action
   */
  static async updateAction(actionId: string, updates: Partial<OfflineAction>): Promise<void> {
    const index = this.actions.findIndex(action => action.id === actionId);
    if (index !== -1) {
      this.actions[index] = { ...this.actions[index], ...updates };
      await this.saveActions();
      this.notifyListeners();
    }
  }

  /**
   * Synchronise les actions en attente
   */
  static async syncPendingActions(): Promise<void> {
    if (!this.isOnline || this.isSyncing || this.actions.length === 0) {
      return;
    }

    this.isSyncing = true;
    this.notifyListeners();

    try {
      // Trier les actions par priorité et dépendances
      const sortedActions = this.getSortedActions();
      
      for (const action of sortedActions) {
        try {
          await this.executeAction(action);
          await this.removeAction(action.id);
        } catch (error) {
          console.error(`Erreur lors de l'exécution de l'action ${action.id}:`, error);
          
          action.retryCount++;
          if (action.retryCount >= action.maxRetries) {
            console.error(`Action ${action.id} a échoué après ${action.maxRetries} tentatives`);
            // Optionnel: marquer l'action comme échouée plutôt que de la supprimer
          }
          
          await this.updateAction(action.id, { retryCount: action.retryCount });
          
          // Attendre avant la prochaine action en cas d'erreur
          await this.delay(this.config.retryDelay);
        }
      }

      this.lastSyncAt = new Date();
      await this.saveLastSync();

    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  /**
   * Trie les actions par priorité et dépendances
   */
  private static getSortedActions(): OfflineAction[] {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    
    return [...this.actions]
      .sort((a, b) => {
        // D'abord par priorité
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        // Puis par timestamp
        return a.timestamp.getTime() - b.timestamp.getTime();
      })
      .filter(action => {
        // Vérifier que toutes les dépendances sont résolues
        if (!action.dependencies || action.dependencies.length === 0) {
          return true;
        }
        
        return action.dependencies.every(depId => 
          !this.actions.find(a => a.id === depId)
        );
      });
  }

  /**
   * Exécute une action spécifique
   */
  private static async executeAction(action: OfflineAction): Promise<void> {
    // Cette méthode devrait être implémentée pour faire appel aux APIs appropriées
    // selon le type d'entité et d'action
    
    console.log(`Exécution de l'action ${action.id}: ${action.type} ${action.entity}`);
    
    // Simuler un appel API
    await this.delay(1000);
    
    // En production, vous feriez quelque chose comme:
    // switch (action.entity) {
    //   case 'invoice':
    //     return await InvoiceAPI.handleOfflineAction(action);
    //   case 'client':
    //     return await ClientAPI.handleOfflineAction(action);
    //   // etc.
    // }
    
    // Pour la démo, on simule le succès
    if (Math.random() > 0.1) { // 90% de chance de succès
      return Promise.resolve();
    } else {
      throw new Error('Échec simulé de l\'API');
    }
  }

  /**
   * Démarre la synchronisation automatique
   */
  static startAutoSync(): Promise<void> {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.actions.length > 0) {
        this.syncPendingActions();
      }
    }, this.config.syncInterval);

    return Promise.resolve();
  }

  /**
   * Arrête la synchronisation automatique
   */
  static stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
    }
  }

  /**
   * Gestionnaire pour la restauration de connexion
   */
  private static async onConnectionRestored(): Promise<void> {
    console.log('Connexion restaurée, synchronisation des actions en attente...');
    
    if (this.actions.length > 0) {
      // Attendre un peu avant de synchroniser pour laisser la connexion se stabiliser
      setTimeout(() => this.syncPendingActions(), 2000);
    }
  }

  /**
   * Met en cache des données pour un accès hors ligne
   */
  static async cacheData(key: string, data: any): Promise<void> {
    this.cachedData[key] = {
      data,
      timestamp: new Date(),
    };
    await this.saveCachedData();
  }

  /**
   * Récupère des données du cache
   */
  static getCachedData(key: string, maxAge?: number): any | null {
    const cached = this.cachedData[key];
    if (!cached) return null;

    if (maxAge) {
      const age = Date.now() - new Date(cached.timestamp).getTime();
      if (age > maxAge) {
        return null;
      }
    }

    return cached.data;
  }

  /**
   * Vide le cache
   */
  static async clearCache(key?: string): Promise<void> {
    if (key) {
      delete this.cachedData[key];
    } else {
      this.cachedData = {};
    }
    await this.saveCachedData();
  }

  /**
   * Met à jour la configuration
   */
  static async updateConfig(newConfig: Partial<OfflineConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    await this.saveConfig();

    // Redémarrer la synchronisation automatique si l'intervalle a changé
    if (newConfig.syncInterval || newConfig.autoSync !== undefined) {
      this.stopAutoSync();
      if (this.config.autoSync) {
        this.startAutoSync();
      }
    }
  }

  /**
   * Obtient la configuration actuelle
   */
  static getConfig(): OfflineConfig {
    return { ...this.config };
  }

  /**
   * Obtient le statut de synchronisation
   */
  static getStatus(): SyncStatus {
    const failedActions = this.actions.filter(action => action.retryCount >= action.maxRetries);
    
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      lastSyncAt: this.lastSyncAt,
      pendingActionsCount: this.actions.length - failedActions.length,
      failedActionsCount: failedActions.length,
      totalActionCount: this.actions.length,
    };
  }

  /**
   * Obtient toutes les actions en attente
   */
  static getPendingActions(): OfflineAction[] {
    return [...this.actions];
  }

  /**
   * Ajoute un listener pour les changements de statut
   */
  static addStatusListener(listener: (status: SyncStatus) => void): () => void {
    this.listeners.push(listener);
    
    // Retourner une fonction pour supprimer le listener
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notifie tous les listeners des changements de statut
   */
  private static notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Erreur lors de la notification du listener:', error);
      }
    });
  }

  /**
   * Force une synchronisation manuelle
   */
  static async forcSync(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Aucune connexion internet disponible');
    }
    
    return this.syncPendingActions();
  }

  /**
   * Remet à zéro toutes les actions échouées
   */
  static async retryFailedActions(): Promise<void> {
    const failedActions = this.actions.filter(action => action.retryCount >= action.maxRetries);
    
    for (const action of failedActions) {
      await this.updateAction(action.id, { retryCount: 0 });
    }

    if (this.isOnline && failedActions.length > 0) {
      setTimeout(() => this.syncPendingActions(), 100);
    }
  }

  /**
   * Supprime toutes les actions échouées
   */
  static async clearFailedActions(): Promise<void> {
    this.actions = this.actions.filter(action => action.retryCount < action.maxRetries);
    await this.saveActions();
    this.notifyListeners();
  }

  /**
   * Utilitaire pour créer un délai
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Exporte toutes les données offline
   */
  static exportData(): {
    actions: OfflineAction[];
    config: OfflineConfig;
    cachedData: { [key: string]: any };
    lastSyncAt?: Date;
  } {
    return {
      actions: [...this.actions],
      config: { ...this.config },
      cachedData: { ...this.cachedData },
      lastSyncAt: this.lastSyncAt,
    };
  }

  /**
   * Importe des données offline
   */
  static async importData(data: {
    actions?: OfflineAction[];
    config?: OfflineConfig;
    cachedData?: { [key: string]: any };
  }): Promise<void> {
    if (data.actions) {
      this.actions = data.actions;
      await this.saveActions();
    }

    if (data.config) {
      await this.updateConfig(data.config);
    }

    if (data.cachedData) {
      this.cachedData = data.cachedData;
      await this.saveCachedData();
    }

    this.notifyListeners();
  }

  /**
   * Nettoie le service et libère les ressources
   */
  static cleanup(): void {
    this.stopAutoSync();
    this.listeners = [];
  }
}