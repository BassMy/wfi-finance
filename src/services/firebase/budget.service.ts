// src/services/firebase/budget.service.ts
import { FirestoreService } from './firestore.service';
import firebaseConfig from './config';
import { 
  Budget, 
  BudgetMethod, 
  BudgetStats, 
  ApiResponse 
} from '../../types';
import { 
  calculateBudgetAllocations, 
  calculateBudgetStats,
  calculateBudgetUsage,
  calculateFinancialProjection
} from '../../utils/calculations';
import { BUDGET_METHODS } from '../../utils/constants';

export class BudgetService {
  private static instance: BudgetService;
  private firestoreService: FirestoreService;

  private constructor() {
    this.firestoreService = FirestoreService.getInstance();
  }

  public static getInstance(): BudgetService {
    if (!BudgetService.instance) {
      BudgetService.instance = new BudgetService();
    }
    return BudgetService.instance;
  }

  /**
   * Créer un nouveau budget
   */
  async createBudget(
    userId: string,
    salary: number,
    method: BudgetMethod
  ): Promise<ApiResponse<Budget>> {
    try {
      console.log('💰 Creating budget for user:', userId);

      // Valider les données
      if (salary <= 0) {
        return {
          success: false,
          error: 'Le salaire doit être supérieur à 0',
        };
      }

      if (!method || !method.needs || !method.wants || !method.savings) {
        return {
          success: false,
          error: 'Méthode budgétaire invalide',
        };
      }

      // Vérifier que les pourcentages totalisent 100%
      const total = method.needs + method.wants + method.savings;
      if (Math.abs(total - 100) > 0.01) {
        return {
          success: false,
          error: 'Les pourcentages doivent totaliser 100%',
        };
      }

      // Calculer les allocations
      const allocations = calculateBudgetAllocations(salary, method);

      const budgetData = {
        salary,
        method,
        allocations,
      };

      const result = await this.firestoreService.upsertBudget(userId, budgetData);

      // Analytics
      if (result.success) {
        await firebaseConfig.analytics.logEvent('budget_created', {
          method_id: method.id,
          salary: salary,
          needs_percentage: method.needs,
          wants_percentage: method.wants,
          savings_percentage: method.savings,
        });
      }

      console.log('✅ Budget created successfully');
      return result;
    } catch (error: any) {
      console.error('❌ Error creating budget:', error);
      await firebaseConfig.crashlytics.recordError(error);
      
      return {
        success: false,
        error: 'Erreur lors de la création du budget',
      };
    }
  }

  /**
   * Mettre à jour un budget existant
   */
  async updateBudget(
    userId: string,
    updates: Partial<Pick<Budget, 'salary' | 'method'>>
  ): Promise<ApiResponse<Budget>> {
    try {
      console.log('💰 Updating budget for user:', userId);

      const currentBudget = await this.getBudget(userId);
      if (!currentBudget.success || !currentBudget.data) {
        return {
          success: false,
          error: 'Budget non trouvé',
        };
      }

      const budget = currentBudget.data;
      const newSalary = updates.salary || budget.salary;
      const newMethod = updates.method || budget.method;

      // Recalculer les allocations
      const allocations = calculateBudgetAllocations(newSalary, newMethod);

      const budgetData = {
        salary: newSalary,
        method: newMethod,
        allocations,
      };

      const result = await this.firestoreService.upsertBudget(userId, budgetData);

      // Analytics
      if (result.success) {
        const eventData: any = {
          method_id: newMethod.id,
        };

        if (updates.salary) {
          eventData.salary_updated = true;
          eventData.new_salary = newSalary;
        }

        if (updates.method) {
          eventData.method_updated = true;
          eventData.new_method = newMethod.id;
        }

        await firebaseConfig.analytics.logEvent('budget_updated', eventData);
      }

      console.log('✅ Budget updated successfully');
      return result;
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
  async getBudget(userId: string): Promise<ApiResponse<Budget | null>> {
    try {
      console.log('📖 Getting budget for user:', userId);

      const result = await this.firestoreService.getUserBudget(userId);
      
      if (result.success) {
        console.log('✅ Budget retrieved successfully');
      }

      return result;
    } catch (error: any) {
      console.error('❌ Error getting budget:', error);
      await firebaseConfig.crashlytics.recordError(error);
      
      return {
        success: false,
        error: 'Erreur lors de la récupération du budget',
        data: null,
      };
    }
  }

  /**
   * Calculer les statistiques budgétaires actuelles
   */
  async calculateBudgetStatistics(
    userId: string,
    expenses: any[] = [],
    subscriptions: any[] = []
  ): Promise<ApiResponse<BudgetStats | null>> {
    try {
      console.log('📊 Calculating budget statistics for user:', userId);

      const budgetResult = await this.getBudget(userId);
      if (!budgetResult.success || !budgetResult.data) {
        return {
          success: false,
          error: 'Budget non configuré',
          data: null,
        };
      }

      const budget = budgetResult.data;
      const stats = calculateBudgetStats(budget, expenses, subscriptions);

      console.log('✅ Budget statistics calculated successfully');
      return {
        success: true,
        data: stats,
      };
    } catch (error: any) {
      console.error('❌ Error calculating budget statistics:', error);
      await firebaseConfig.crashlytics.recordError(error);
      
      return {
        success: false,
        error: 'Erreur lors du calcul des statistiques',
        data: null,
      };
    }
  }

  /**
   * Obtenir les méthodes budgétaires disponibles
   */
  getBudgetMethods(): BudgetMethod[] {
    return [...BUDGET_METHODS];
  }

  /**
   * Créer une méthode budgétaire personnalisée
   */
  createCustomBudgetMethod(
    name: string,
    description: string,
    needs: number,
    wants: number,
    savings: number
  ): ApiResponse<BudgetMethod> {
    try {
      // Validation
      if (!name || !description) {
        return {
          success: false,
          error: 'Nom et description requis',
        };
      }

      if (needs < 0 || wants < 0 || savings < 0) {
        return {
          success: false,
          error: 'Les pourcentages ne peuvent pas être négatifs',
        };
      }

      const total = needs + wants + savings;
      if (Math.abs(total - 100) > 0.01) {
        return {
          success: false,
          error: 'Les pourcentages doivent totaliser 100%',
        };
      }

      const customMethod: BudgetMethod = {
        id: `custom_${Date.now()}`,
        name,
        description,
        needs,
        wants,
        savings,
        isCustom: true,
      };

      console.log('✅ Custom budget method created:', customMethod.id);
      return {
        success: true,
        data: customMethod,
      };
    } catch (error: any) {
      console.error('❌ Error creating custom budget method:', error);
      
      return {
        success: false,
        error: 'Erreur lors de la création de la méthode personnalisée',
      };
    }
  }

  /**
   * Analyser l'utilisation du budget par catégorie
   */
  async analyzeBudgetUsage(
    userId: string,
    expenses: any[] = [],
    subscriptions: any[] = []
  ): Promise<ApiResponse<{
    needs: any;
    wants: any;
    savings: any;
    overall: any;
  }>> {
    try {
      console.log('🔍 Analyzing budget usage for user:', userId);

      const statsResult = await this.calculateBudgetStatistics(userId, expenses, subscriptions);
      if (!statsResult.success || !statsResult.data) {
        return {
          success: false,
          error: statsResult.error || 'Impossible de calculer les statistiques',
        };
      }

      const stats = statsResult.data;

      const budgetResult = await this.getBudget(userId);
      if (!budgetResult.success || !budgetResult.data) {
        return {
          success: false,
          error: 'Budget non trouvé',
        };
      }

      const budget = budgetResult.data;

      // Analyser chaque catégorie
      const needsUsage = calculateBudgetUsage(
        budget.allocations.needs,
        stats.categorySpending.needs
      );

      const wantsUsage = calculateBudgetUsage(
        budget.allocations.wants,
        stats.categorySpending.wants
      );

      const savingsUsage = calculateBudgetUsage(
        budget.allocations.savings,
        stats.categorySpending.savings
      );

      const overallUsage = calculateBudgetUsage(
        stats.totalIncome,
        stats.totalExpenses
      );

      console.log('✅ Budget usage analyzed successfully');
      return {
        success: true,
        data: {
          needs: needsUsage,
          wants: wantsUsage,
          savings: savingsUsage,
          overall: overallUsage,
        },
      };
    } catch (error: any) {
      console.error('❌ Error analyzing budget usage:', error);
      await firebaseConfig.crashlytics.recordError(error);
      
      return {
        success: false,
        error: 'Erreur lors de l\'analyse du budget',
      };
    }
  }

  /**
   * Générer des recommandations budgétaires
   */
  async generateBudgetRecommendations(
    userId: string,
    expenses: any[] = [],
    subscriptions: any[] = []
  ): Promise<ApiResponse<string[]>> {
    try {
      console.log('💡 Generating budget recommendations for user:', userId);

      const usageResult = await this.analyzeBudgetUsage(userId, expenses, subscriptions);
      if (!usageResult.success || !usageResult.data) {
        return {
          success: false,
          error: 'Impossible d\'analyser l\'utilisation du budget',
        };
      }

      const usage = usageResult.data;
      const recommendations: string[] = [];

      // Recommandations basées sur l'utilisation
      if (usage.needs.status === 'danger') {
        recommendations.push(
          '🔴 Attention: Vous dépassez votre budget "Besoins". Révisez vos dépenses essentielles.'
        );
      }

      if (usage.wants.status === 'danger') {
        recommendations.push(
          '🟡 Vous dépassez votre budget "Envies". Réduisez les dépenses plaisir temporairement.'
        );
      }

      if (usage.savings.percentage < 50) {
        recommendations.push(
          '💰 Excellent! Vous économisez bien. Continuez sur cette lancée.'
        );
      } else if (usage.savings.status === 'danger') {
        recommendations.push(
          '📉 Vous puisez dans votre épargne. Réduisez vos autres dépenses.'
        );
      }

      if (usage.overall.percentage > 90) {
        recommendations.push(
          '⚠️ Vous utilisez la majorité de vos revenus. Envisagez d\'augmenter vos revenus ou réduire vos dépenses.'
        );
      }

      // Recommandations générales
      if (recommendations.length === 0) {
        recommendations.push(
          '✅ Votre budget est bien équilibré! Continuez comme ça.'
        );
      }

      // Analytics
      await firebaseConfig.analytics.logEvent('budget_recommendations_generated', {
        user_id: userId,
        recommendations_count: recommendations.length,
        needs_status: usage.needs.status,
        wants_status: usage.wants.status,
        savings_status: usage.savings.status,
      });

      console.log('✅ Budget recommendations generated successfully');
      return {
        success: true,
        data: recommendations,
      };
    } catch (error: any) {
      console.error('❌ Error generating budget recommendations:', error);
      await firebaseConfig.crashlytics.recordError(error);
      
      return {
        success: false,
        error: 'Erreur lors de la génération des recommandations',
        data: [],
      };
    }
  }

  /**
   * Calculer les projections budgétaires
   */
  async calculateBudgetProjections(
    userId: string,
    months: number = 12
  ): Promise<ApiResponse<{
    projectedSavings: number;
    monthlySurplus: number;
    savingsRate: number;
    projections: Array<{
      month: string;
      expectedIncome: number;
      projectedExpenses: number;
      projectedSavings: number;
    }>;
  }>> {
    try {
      console.log('🔮 Calculating budget projections for user:', userId);

      const budgetResult = await this.getBudget(userId);
      if (!budgetResult.success || !budgetResult.data) {
        return {
          success: false,
          error: 'Budget non configuré',
        };
      }

      const budget = budgetResult.data;
      
      // Calculer les moyennes actuelles (simplifiées pour l'exemple)
      const monthlyIncome = budget.salary;
      const monthlyExpenses = budget.allocations.needs + budget.allocations.wants;
      const currentSavings = budget.allocations.savings;

      const projection = calculateFinancialProjection(
        currentSavings,
        monthlyIncome,
        monthlyExpenses,
        months
      );

      // Générer les projections mois par mois
      const projections = [];
      for (let i = 0; i < months; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() + i);
        
        projections.push({
          month: date.toISOString().slice(0, 7),
          expectedIncome: monthlyIncome,
          projectedExpenses: monthlyExpenses,
          projectedSavings: currentSavings + (projection.monthlySurplus * (i + 1)),
        });
      }

      console.log('✅ Budget projections calculated successfully');
      return {
        success: true,
        data: {
          ...projection,
          projections,
        },
      };
    } catch (error: any) {
      console.error('❌ Error calculating budget projections:', error);
      await firebaseConfig.crashlytics.recordError(error);
      
      return {
        success: false,
        error: 'Erreur lors du calcul des projections',
      };
    }
  }

  /**
   * Supprimer le budget d'un utilisateur
   */
  async deleteBudget(userId: string): Promise<ApiResponse<null>> {
    try {
      console.log('🗑️ Deleting budget for user:', userId);

      const result = await this.firestoreService.deleteDocument('budgets', userId);

      // Analytics
      if (result.success) {
        await firebaseConfig.analytics.logEvent('budget_deleted', {
          user_id: userId,
        });
      }

      console.log('✅ Budget deleted successfully');
      return result;
    } catch (error: any) {
      console.error('❌ Error deleting budget:', error);
      await firebaseConfig.crashlytics.recordError(error);
      
      return {
        success: false,
        error: 'Erreur lors de la suppression du budget',
      };
    }
  }
}

export default BudgetService.getInstance();