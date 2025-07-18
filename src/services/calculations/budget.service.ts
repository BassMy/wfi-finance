// src/services/budget.service.ts

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BudgetCategory {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface BudgetItem {
  id: string;
  categoryId: string;
  amount: number;
  allocated: number;
  spent: number;
  description?: string;
  period: 'monthly' | 'weekly' | 'yearly';
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  budgetItemId: string;
  amount: number;
  description: string;
  date: Date;
  type: 'income' | 'expense';
  categoryId: string;
}

export interface BudgetSummary {
  totalAllocated: number;
  totalSpent: number;
  totalRemaining: number;
  categories: {
    [categoryId: string]: {
      allocated: number;
      spent: number;
      remaining: number;
      percentage: number;
    };
  };
}

const STORAGE_KEYS = {
  BUDGET_ITEMS: '@budget_items',
  BUDGET_CATEGORIES: '@budget_categories',
  TRANSACTIONS: '@transactions',
};

export class BudgetService {
  private static budgetItems: BudgetItem[] = [];
  private static categories: BudgetCategory[] = [];
  private static transactions: Transaction[] = [];

  /**
   * Initialise le service avec les données stockées
   */
  static async initialize(): Promise<void> {
    try {
      await this.loadBudgetItems();
      await this.loadCategories();
      await this.loadTransactions();
      
      // Créer des catégories par défaut si aucune n'existe
      if (this.categories.length === 0) {
        await this.createDefaultCategories();
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du service budget:', error);
    }
  }

  /**
   * Crée les catégories par défaut
   */
  private static async createDefaultCategories(): Promise<void> {
    const defaultCategories: Omit<BudgetCategory, 'id'>[] = [
      { name: 'Logement', color: '#e74c3c', icon: 'home' },
      { name: 'Transport', color: '#3498db', icon: 'car' },
      { name: 'Alimentation', color: '#2ecc71', icon: 'utensils' },
      { name: 'Loisirs', color: '#f39c12', icon: 'gamepad' },
      { name: 'Santé', color: '#9b59b6', icon: 'heart' },
      { name: 'Éducation', color: '#1abc9c', icon: 'book' },
      { name: 'Épargne', color: '#34495e', icon: 'piggy-bank' },
      { name: 'Autres', color: '#95a5a6', icon: 'ellipsis-h' },
    ];

    for (const category of defaultCategories) {
      await this.createCategory(category);
    }
  }

  /**
   * Charge les éléments du budget depuis le stockage
   */
  private static async loadBudgetItems(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.BUDGET_ITEMS);
      if (data) {
        this.budgetItems = JSON.parse(data).map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des éléments du budget:', error);
    }
  }

  /**
   * Charge les catégories depuis le stockage
   */
  private static async loadCategories(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.BUDGET_CATEGORIES);
      if (data) {
        this.categories = JSON.parse(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
    }
  }

  /**
   * Charge les transactions depuis le stockage
   */
  private static async loadTransactions(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (data) {
        this.transactions = JSON.parse(data).map((transaction: any) => ({
          ...transaction,
          date: new Date(transaction.date),
        }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des transactions:', error);
    }
  }

  /**
   * Sauvegarde les éléments du budget
   */
  private static async saveBudgetItems(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BUDGET_ITEMS, JSON.stringify(this.budgetItems));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des éléments du budget:', error);
    }
  }

  /**
   * Sauvegarde les catégories
   */
  private static async saveCategories(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BUDGET_CATEGORIES, JSON.stringify(this.categories));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des catégories:', error);
    }
  }

  /**
   * Sauvegarde les transactions
   */
  private static async saveTransactions(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(this.transactions));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des transactions:', error);
    }
  }

  /**
   * Crée une nouvelle catégorie
   */
  static async createCategory(categoryData: Omit<BudgetCategory, 'id'>): Promise<BudgetCategory> {
    const category: BudgetCategory = {
      id: Date.now().toString(),
      ...categoryData,
    };

    this.categories.push(category);
    await this.saveCategories();
    return category;
  }

  /**
   * Obtient toutes les catégories
   */
  static getCategories(): BudgetCategory[] {
    return [...this.categories];
  }

  /**
   * Crée un nouvel élément de budget
   */
  static async createBudgetItem(itemData: Omit<BudgetItem, 'id' | 'spent' | 'createdAt' | 'updatedAt'>): Promise<BudgetItem> {
    const item: BudgetItem = {
      id: Date.now().toString(),
      spent: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...itemData,
    };

    this.budgetItems.push(item);
    await this.saveBudgetItems();
    return item;
  }

  /**
   * Met à jour un élément de budget
   */
  static async updateBudgetItem(id: string, updates: Partial<Omit<BudgetItem, 'id' | 'createdAt'>>): Promise<BudgetItem | null> {
    const index = this.budgetItems.findIndex(item => item.id === id);
    if (index === -1) return null;

    this.budgetItems[index] = {
      ...this.budgetItems[index],
      ...updates,
      updatedAt: new Date(),
    };

    await this.saveBudgetItems();
    return this.budgetItems[index];
  }

  /**
   * Supprime un élément de budget
   */
  static async deleteBudgetItem(id: string): Promise<boolean> {
    const index = this.budgetItems.findIndex(item => item.id === id);
    if (index === -1) return false;

    this.budgetItems.splice(index, 1);
    await this.saveBudgetItems();
    return true;
  }

  /**
   * Obtient tous les éléments de budget
   */
  static getBudgetItems(): BudgetItem[] {
    return [...this.budgetItems];
  }

  /**
   * Obtient les éléments de budget par catégorie
   */
  static getBudgetItemsByCategory(categoryId: string): BudgetItem[] {
    return this.budgetItems.filter(item => item.categoryId === categoryId);
  }

  /**
   * Ajoute une transaction
   */
  static async addTransaction(transactionData: Omit<Transaction, 'id'>): Promise<Transaction> {
    const transaction: Transaction = {
      id: Date.now().toString(),
      ...transactionData,
    };

    this.transactions.push(transaction);
    await this.saveTransactions();

    // Mettre à jour le montant dépensé pour l'élément de budget correspondant
    if (transaction.type === 'expense') {
      await this.updateBudgetItemSpent(transaction.budgetItemId);
    }

    return transaction;
  }

  /**
   * Met à jour le montant dépensé pour un élément de budget
   */
  private static async updateBudgetItemSpent(budgetItemId: string): Promise<void> {
    const relatedTransactions = this.transactions.filter(
      t => t.budgetItemId === budgetItemId && t.type === 'expense'
    );
    
    const totalSpent = relatedTransactions.reduce((sum, t) => sum + t.amount, 0);
    await this.updateBudgetItem(budgetItemId, { spent: totalSpent });
  }

  /**
   * Obtient les transactions pour une période donnée
   */
  static getTransactionsByPeriod(startDate: Date, endDate: Date): Transaction[] {
    return this.transactions.filter(
      transaction => transaction.date >= startDate && transaction.date <= endDate
    );
  }

  /**
   * Calcule le résumé du budget
   */
  static getBudgetSummary(period?: { start: Date; end: Date }): BudgetSummary {
    let relevantItems = this.budgetItems;
    let relevantTransactions = this.transactions;

    if (period) {
      relevantTransactions = this.getTransactionsByPeriod(period.start, period.end);
    }

    const summary: BudgetSummary = {
      totalAllocated: 0,
      totalSpent: 0,
      totalRemaining: 0,
      categories: {},
    };

    // Calculer les totaux par catégorie
    for (const category of this.categories) {
      const categoryItems = relevantItems.filter(item => item.categoryId === category.id);
      const categoryTransactions = relevantTransactions.filter(t => t.categoryId === category.id && t.type === 'expense');

      const allocated = categoryItems.reduce((sum, item) => sum + item.allocated, 0);
      const spent = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
      const remaining = allocated - spent;

      summary.categories[category.id] = {
        allocated,
        spent,
        remaining,
        percentage: allocated > 0 ? (spent / allocated) * 100 : 0,
      };

      summary.totalAllocated += allocated;
      summary.totalSpent += spent;
    }

    summary.totalRemaining = summary.totalAllocated - summary.totalSpent;

    return summary;
  }

  /**
   * Obtient les statistiques de dépenses par catégorie
   */
  static getSpendingStatsByCategory(period?: { start: Date; end: Date }): Array<{
    category: BudgetCategory;
    amount: number;
    percentage: number;
  }> {
    let relevantTransactions = this.transactions.filter(t => t.type === 'expense');

    if (period) {
      relevantTransactions = relevantTransactions.filter(
        t => t.date >= period.start && t.date <= period.end
      );
    }

    const totalSpent = relevantTransactions.reduce((sum, t) => sum + t.amount, 0);
    const categoryStats: { [categoryId: string]: number } = {};

    // Calculer les dépenses par catégorie
    relevantTransactions.forEach(transaction => {
      categoryStats[transaction.categoryId] = (categoryStats[transaction.categoryId] || 0) + transaction.amount;
    });

    // Convertir en format de sortie
    return Object.entries(categoryStats).map(([categoryId, amount]) => {
      const category = this.categories.find(c => c.id === categoryId);
      return {
        category: category!,
        amount,
        percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
      };
    }).sort((a, b) => b.amount - a.amount);
  }

  /**
   * Exporte les données du budget
   */
  static exportBudgetData(): {
    budgetItems: BudgetItem[];
    categories: BudgetCategory[];
    transactions: Transaction[];
  } {
    return {
      budgetItems: [...this.budgetItems],
      categories: [...this.categories],
      transactions: [...this.transactions],
    };
  }

  /**
   * Importe les données du budget
   */
  static async importBudgetData(data: {
    budgetItems?: BudgetItem[];
    categories?: BudgetCategory[];
    transactions?: Transaction[];
  }): Promise<void> {
    if (data.categories) {
      this.categories = data.categories;
      await this.saveCategories();
    }

    if (data.budgetItems) {
      this.budgetItems = data.budgetItems;
      await this.saveBudgetItems();
    }

    if (data.transactions) {
      this.transactions = data.transactions;
      await this.saveTransactions();
    }
  }
}