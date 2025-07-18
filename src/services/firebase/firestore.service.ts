// src/services/firebase/firestore.service.ts
import firebaseConfig from './config';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { 
  User, 
  Expense, 
  Subscription, 
  Budget, 
  ApiResponse, 
  PaginationParams,
  DateRange 
} from '../../types';

export class FirestoreService {
  private static instance: FirestoreService;
  private db: FirebaseFirestoreTypes.Module;

  private constructor() {
    this.db = firebaseConfig.firestore;
  }

  public static getInstance(): FirestoreService {
    if (!FirestoreService.instance) {
      FirestoreService.instance = new FirestoreService();
    }
    return FirestoreService.instance;
  }

  // ==========================================
  // MÉTHODES GÉNÉRIQUES CRUD
  // ==========================================

  /**
   * Créer un document
   */
  async createDocument<T>(
    collection: string, 
    docId: string, 
    data: T
  ): Promise<ApiResponse<T>> {
    try {
      const docData = {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await this.db.collection(collection).doc(docId).set(docData);

      console.log(`✅ Document created in ${collection}:`, docId);
      return {
        success: true,
        data: docData as T,
        message: 'Document créé avec succès',
      };
    } catch (error: any) {
      console.error(`❌ Error creating document in ${collection}:`, error);
      await firebaseConfig.crashlytics.recordError(error);
      
      return {
        success: false,
        error: 'Erreur lors de la création du document',
      };
    }
  }

  /**
   * Obtenir un document
   */
  async getDocument(
    collection: string, 
    docId: string
  ): Promise<FirebaseFirestoreTypes.DocumentSnapshot> {
    try {
      const doc = await this.db.collection(collection).doc(docId).get();
      console.log(`📄 Document retrieved from ${collection}:`, docId);
      return doc;
    } catch (error: any) {
      console.error(`❌ Error getting document from ${collection}:`, error);
      await firebaseConfig.crashlytics.recordError(error);
      throw error;
    }
  }

  /**
   * Mettre à jour un document
   */
  async updateDocument<T>(
    collection: string,
    docId: string,
    updates: Partial<T>
  ): Promise<ApiResponse<null>> {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await this.db.collection(collection).doc(docId).update(updateData);

      console.log(`✅ Document updated in ${collection}:`, docId);
      return {
        success: true,
        message: 'Document mis à jour avec succès',
      };
    } catch (error: any) {
      console.error(`❌ Error updating document in ${collection}:`, error);
      await firebaseConfig.crashlytics.recordError(error);
      
      return {
        success: false,
        error: 'Erreur lors de la mise à jour du document',
      };
    }
  }

  /**
   * Supprimer un document
   */
  async deleteDocument(
    collection: string,
    docId: string
  ): Promise<ApiResponse<null>> {
    try {
      await this.db.collection(collection).doc(docId).delete();

      console.log(`✅ Document deleted from ${collection}:`, docId);
      return {
        success: true,
        message: 'Document supprimé avec succès',
      };
    } catch (error: any) {
      console.error(`❌ Error deleting document from ${collection}:`, error);
      await firebaseConfig.crashlytics.recordError(error);
      
      return {
        success: false,
        error: 'Erreur lors de la suppression du document',
      };
    }
  }

  // ==========================================
  // MÉTHODES SPÉCIFIQUES AUX DÉPENSES
  // ==========================================

  /**
   * Créer une dépense
   */
  async createExpense(userId: string, expense: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Expense>> {
    try {
      const expenseRef = this.db.collection('expenses').doc();
      const expenseData: Expense = {
        id: expenseRef.id,
        userId,
        ...expense,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await expenseRef.set(expenseData);

      // Analytics
      await firebaseConfig.analytics.logEvent('expense_created', {
        category: expense.category,
        amount: expense.amount,
      });

      console.log('✅ Expense created:', expenseData.id);
      return {
        success: true,
        data: expenseData,
        message: 'Dépense ajoutée avec succès',
      };
    } catch (error: any) {
      console.error('❌ Error creating expense:', error);
      await firebaseConfig.crashlytics.recordError(error);
      
      return {
        success: false,
        error: 'Erreur lors de l\'ajout de la dépense',
      };
    }
  }

  /**
   * Obtenir les dépenses d'un utilisateur
   */
  async getUserExpenses(
    userId: string,
    pagination?: PaginationParams,
    dateRange?: DateRange
  ): Promise<ApiResponse<Expense[]>> {
    try {
      let query = this.db
        .collection('expenses')
        .where('userId', '==', userId);

      // Filtrer par date si fourni
      if (dateRange) {
        query = query
          .where('date', '>=', dateRange.startDate)
          .where('date', '<=', dateRange.endDate);
      }

      // Tri et pagination
      if (pagination) {
        query = query
          .orderBy(pagination.orderBy || 'createdAt', pagination.orderDirection || 'desc')
          .limit(pagination.limit);
      } else {
        query = query.orderBy('createdAt', 'desc');
      }

      const snapshot = await query.get();
      const expenses = snapshot.docs.map(doc => doc.data() as Expense);

      console.log(`✅ Retrieved ${expenses.length} expenses for user:`, userId);
      return {
        success: true,
        data: expenses,
      };
    } catch (error: any) {
      console.error('❌ Error getting user expenses:', error);
      await firebaseConfig.crashlytics.recordError(error);
      
      return {
        success: false,
        error: 'Erreur lors de la récupération des dépenses',
        data: [],
      };
    }
  }

  /**
   * Supprimer une dépense
   */
  async deleteExpense(expenseId: string, userId: string): Promise<ApiResponse<null>> {
    try {
      // Vérifier que la dépense appartient à l'utilisateur
      const expenseDoc = await this.getDocument('expenses', expenseId);
      
      if (!expenseDoc.exists) {
        return {
          success: false,
          error: 'Dépense non trouvée',
        };
      }

      const expense = expenseDoc.data() as Expense;
      if (expense.userId !== userId) {
        return {
          success: false,
          error: 'Accès non autorisé',
        };
      }

      await this.deleteDocument('expenses', expenseId);

      // Analytics
      await firebaseConfig.analytics.logEvent('expense_deleted', {
        category: expense.category,
      });

      return {
        success: true,
        message: 'Dépense supprimée avec succès',
      };
    } catch (error: any) {
      console.error('❌ Error deleting expense:', error);
      await firebaseConfig.crashlytics.recordError(error);
      
      return {
        success: false,
        error: 'Erreur lors de la suppression de la dépense',
      };
    }
  }

  // ==========================================
  // MÉTHODES SPÉCIFIQUES AUX ABONNEMENTS
  // ==========================================

  /**
   * Créer un abonnement
   */
  async createSubscription(userId: string, subscription: Omit<Subscription, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Subscription>> {
    try {
      const subscriptionRef = this.db.collection('subscriptions').doc();
      const subscriptionData: Subscription = {
        id: subscriptionRef.id,
        userId,
        ...subscription,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await subscriptionRef.set(subscriptionData);

      // Analytics
      await firebaseConfig.analytics.logEvent('subscription_created', {
        category: subscription.category,
        period: subscription.period,
        amount: subscription.price,
      });

      console.log('✅ Subscription created:', subscriptionData.id);
      return {
        success: true,
        data: subscriptionData,
        message: 'Abonnement ajouté avec succès',
      };
    } catch (error: any) {
      console.error('❌ Error creating subscription:', error);
      await firebaseConfig.crashlytics.recordError(error);
      
      return {
        success: false,
        error: 'Erreur lors de l\'ajout de l\'abonnement',
      };
    }
  }

  /**
   * Obtenir les abonnements d'un utilisateur
   */
  async getUserSubscriptions(userId: string): Promise<ApiResponse<Subscription[]>> {
    try {
      const snapshot = await this.db
        .collection('subscriptions')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      const subscriptions = snapshot.docs.map(doc => doc.data() as Subscription);

      console.log(`✅ Retrieved ${subscriptions.length} subscriptions for user:`, userId);
      return {
        success: true,
        data: subscriptions,
      };
    } catch (error: any) {
      console.error('❌ Error getting user subscriptions:', error);
      await firebaseConfig.crashlytics.recordError(error);
      
      return {
        success: false,
        error: 'Erreur lors de la récupération des abonnements',
        data: [],
      };
    }
  }

  /**
   * Mettre à jour un abonnement
   */
  async updateSubscription(subscriptionId: string, userId: string, updates: Partial<Subscription>): Promise<ApiResponse<null>> {
    try {
      // Vérifier que l'abonnement appartient à l'utilisateur
      const subscriptionDoc = await this.getDocument('subscriptions', subscriptionId);
      
      if (!subscriptionDoc.exists) {
        return {
          success: false,
          error: 'Abonnement non trouvé',
        };
      }

      const subscription = subscriptionDoc.data() as Subscription;
      if (subscription.userId !== userId) {
        return {
          success: false,
          error: 'Accès non autorisé',
        };
      }

      await this.updateDocument('subscriptions', subscriptionId, updates);

      // Analytics
      await firebaseConfig.analytics.logEvent('subscription_updated', {
        category: subscription.category,
      });

      return {
        success: true,
        message: 'Abonnement mis à jour avec succès',
      };
    } catch (error: any) {
      console.error('❌ Error updating subscription:', error);
      await firebaseConfig.crashlytics.recordError(error);
      
      return {
        success: false,
        error: 'Erreur lors de la mise à jour de l\'abonnement',
      };
    }
  }

  // ==========================================
  // MÉTHODES POUR LE BUDGET
  // ==========================================

  /**
   * Créer ou mettre à jour le budget d'un utilisateur
   */
  async upsertBudget(userId: string, budget: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Budget>> {
    try {
      const budgetData: Budget = {
        id: userId, // Le budget utilise l'ID utilisateur comme ID
        userId,
        ...budget,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await this.db.collection('budgets').doc(userId).set(budgetData, { merge: true });

      // Analytics
      await firebaseConfig.analytics.logEvent('budget_updated', {
        method: budget.method.id,
        salary: budget.salary,
      });

      console.log('✅ Budget updated for user:', userId);
      return {
        success: true,
        data: budgetData,
        message: 'Budget mis à jour avec succès',
      };
    } catch (error: any) {
      console.error('❌ Error updating budget:', error);
      await firebaseConfig.crashlytics.recordError(error);
      
      return {
        success: false,
        error: 'Erreur lors de la mise à jour du budget',
      };
    }
  }

  /**
   * Obtenir le budget d'un utilisateur
   */
  async getUserBudget(userId: string): Promise<ApiResponse<Budget | null>> {
    try {
      const budgetDoc = await this.getDocument('budgets', userId);
      
      if (!budgetDoc.exists) {
        return {
          success: true,
          data: null,
        };
      }

      const budget = budgetDoc.data() as Budget;

      console.log('✅ Budget retrieved for user:', userId);
      return {
        success: true,
        data: budget,
      };
    } catch (error: any) {
      console.error('❌ Error getting user budget:', error);
      await firebaseConfig.crashlytics.recordError(error);
      
      return {
        success: false,
        error: 'Erreur lors de la récupération du budget',
        data: null,
      };
    }
  }

  // ==========================================
  // MÉTHODES DE NETTOYAGE
  // ==========================================

  /**
   * Supprimer toutes les données d'un utilisateur
   */
  async deleteUserData(userId: string): Promise<ApiResponse<null>> {
    try {
      console.log('🗑️ Deleting all data for user:', userId);

      // Supprimer les dépenses
      const expensesSnapshot = await this.db
        .collection('expenses')
        .where('userId', '==', userId)
        .get();

      const expensesDeletePromises = expensesSnapshot.docs.map(doc => doc.ref.delete());

      // Supprimer les abonnements
      const subscriptionsSnapshot = await this.db
        .collection('subscriptions')
        .where('userId', '==', userId)
        .get();

      const subscriptionsDeletePromises = subscriptionsSnapshot.docs.map(doc => doc.ref.delete());

      // Supprimer le budget
      const budgetDeletePromise = this.db.collection('budgets').doc(userId).delete();

      // Supprimer le profil utilisateur
      const userDeletePromise = this.db.collection('users').doc(userId).delete();

      // Exécuter toutes les suppressions en parallèle
      await Promise.all([
        ...expensesDeletePromises,
        ...subscriptionsDeletePromises,
        budgetDeletePromise,
        userDeletePromise,
      ]);

      console.log('✅ All user data deleted successfully');
      return {
        success: true,
        message: 'Toutes les données utilisateur supprimées',
      };
    } catch (error: any) {
      console.error('❌ Error deleting user data:', error);
      await firebaseConfig.crashlytics.recordError(error);
      
      return {
        success: false,
        error: 'Erreur lors de la suppression des données',
      };
    }
  }

  // ==========================================
  // MÉTHODES D'ÉCOUTE TEMPS RÉEL
  // ==========================================

  /**
   * Écouter les changements des dépenses d'un utilisateur
   */
  onUserExpensesChanged(
    userId: string,
    callback: (expenses: Expense[]) => void,
    errorCallback?: (error: Error) => void
  ) {
    return this.db
      .collection('expenses')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        (snapshot) => {
          const expenses = snapshot.docs.map(doc => doc.data() as Expense);
          callback(expenses);
        },
        (error) => {
          console.error('❌ Error listening to expenses changes:', error);
          if (errorCallback) {
            errorCallback(error);
          }
        }
      );
  }

  /**
   * Écouter les changements des abonnements d'un utilisateur
   */
  onUserSubscriptionsChanged(
    userId: string,
    callback: (subscriptions: Subscription[]) => void,
    errorCallback?: (error: Error) => void
  ) {
    return this.db
      .collection('subscriptions')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        (snapshot) => {
          const subscriptions = snapshot.docs.map(doc => doc.data() as Subscription);
          callback(subscriptions);
        },
        (error) => {
          console.error('❌ Error listening to subscriptions changes:', error);
          if (errorCallback) {
            errorCallback(error);
          }
        }
      );
  }

  /**
   * Écouter les changements du budget d'un utilisateur
   */
  onUserBudgetChanged(
    userId: string,
    callback: (budget: Budget | null) => void,
    errorCallback?: (error: Error) => void
  ) {
    return this.db
      .collection('budgets')
      .doc(userId)
      .onSnapshot(
        (doc) => {
          const budget = doc.exists() ? doc.data() as Budget : null;
          callback(budget);
        },
        (error) => {
          console.error('❌ Error listening to budget changes:', error);
          if (errorCallback) {
            errorCallback(error);
          }
        }
      );
  }
}

export default FirestoreService.getInstance();