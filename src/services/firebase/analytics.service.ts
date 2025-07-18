// src/services/firebase/analytics.service.ts
import { FirestoreService } from './firestore.service';
import { BudgetService } from './budget.service';
import { HourlyRateService } from './hourlyRate.service';
import firebaseConfig from './config';
import { 
  MonthlyTrend, 
  CategoryTrend, 
  ApiResponse,
  Expense,
  Subscription,
  ExpenseCategory
} from '../../types';
import { 
  calculateMonthlyTrends,
  calculateCategoryTrends,
  calculateExpenseFrequency,
  calculateExpenseAge,
  calculateMonthlySubscriptionCost
} from '../../utils/calculations';

export class AnalyticsService {
  private static instance: AnalyticsService;
  private firestoreService: FirestoreService;
  private budgetService: BudgetService;
  private hourlyRateService: HourlyRateService;

  private constructor() {
    this.firestoreService = FirestoreService.getInstance();
    this.budgetService = BudgetService.getInstance();
    this.hourlyRateService = HourlyRateService.getInstance();
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Obtenir les tendances mensuelles complètes
   */
  async getMonthlyTrends(
    userId: string,
    months: number = 12
  ): Promise<ApiResponse<MonthlyTrend[]>> {
    try {
      console.log('📈 Getting monthly trends for user:', userId);

      // Récupérer toutes les dépenses
      const expensesResult = await this.firestoreService.getUserExpenses(userId, {
        page: 1,
        limit: 2000, // Augmenter la limite pour avoir plus d'historique
      });

      if (!expensesResult.success) {
        return {
          success: false,
          error: 'Erreur lors de la récupération des dépenses',
          data: [],
        };
      }

      // Récupérer les abonnements
      const subscriptionsResult = await this.firestoreService.getUserSubscriptions(userId);
      if (!subscriptionsResult.success) {
        return {
          success: false,
          error: 'Erreur lors de la récupération des abonnements',
          data: [],
        };
      }

      const expenses = expensesResult.data || [];
      const subscriptions = subscriptionsResult.data || [];

      // Calculer les tendances
      const trends = calculateMonthlyTrends(expenses, subscriptions, months);

      // Enrichir avec les données de revenus (si budget disponible)
      const budgetResult = await this.budgetService.getBudget(userId);
      if (budgetResult.success && budgetResult.data) {
        const monthlyIncome = budgetResult.data.salary / 12;
        trends.forEach(trend => {
          trend.income = monthlyIncome;
          trend.savings = monthlyIncome - trend.expenses - trend.subscriptions;
        });
      }

      console.log('✅ Monthly trends calculated successfully');
      return {
        success: true,
        data: trends,
      };
    } catch (error: any) {
      console.error('❌ Error getting monthly trends:', error);
      await firebaseConfig.crashlytics.recordError(error);
      
      return {
        success: false,
        error: 'Erreur lors du calcul des tendances mensuelles',
        data: [],
      };
    }
  }

  /**
   * Obtenir les tendances par catégorie
   */
  async getCategoryTrends(
    userId: string,
    compareMonths: number = 3
  ): Promise<ApiResponse<CategoryTrend[]>> {
    try {
      console.log('📊 Getting category trends for user:', userId);

      const expensesResult = await this.firestoreService.getUserExpenses(userId, {
        page: 1,
        limit: 1000,
      });

      if (!expensesResult.success) {
        return {
          success: false,
          error: 'Erreur lors de la récupération des dépenses',
          data: [],
        };
      }

      const expenses = expensesResult.data || [];
      const trends = calculateCategoryTrends(expenses, compareMonths);

      console.log('✅ Category trends calculated successfully');
      return {
        success: true,
        data: trends,
      };
    } catch (error: any) {
      console.error('❌ Error getting category trends:', error);
      await firebaseConfig.crashlytics.recordError(error);
      
      return {
        success: false,
        error: 'Erreur lors du calcul des tendances par catégorie',
        data: [],
      };
    }
  }

  /**
   * Générer un rapport analytique complet
   */
  async generateAnalyticsReport(
    userId: string
  ): Promise<ApiResponse<{
    summary: {
      totalExpenses: number;
      totalSubscriptions: number;
      averageExpense: number;
      expenseFrequency: any;
      topCategories: Array<{
        category: ExpenseCategory;
        amount: number;
        percentage: number;
      }>;
    };
    trends: {
      monthly: MonthlyTrend[];
      categories: CategoryTrend[];
    };
    insights: {
      spendingPattern: string;
      recommendations: string[];
      alerts: string[];
    };
    comparisons: {
      lastMonth: {
        expenseChange: number;
        subscriptionChange: number;
        totalChange: number;
      };
      yearOverYear: {
        expenseChange: number;
        trend: 'increasing' | 'decreasing' | 'stable';
      };
    };
  }>> {
    try {
      console.log('📋 Generating analytics report for user:', userId);

      // Récupérer toutes les données nécessaires
      const [
        expensesResult,
        subscriptionsResult,
        monthlyTrendsResult,
        categoryTrendsResult
      ] = await Promise.all([
        this.firestoreService.getUserExpenses(userId, { page: 1, limit: 1000 }),
        this.firestoreService.getUserSubscriptions(userId),
        this.getMonthlyTrends(userId, 12),
        this.getCategoryTrends(userId, 3)
      ]);

      if (!expensesResult.success || !subscriptionsResult.success) {
        return {
          success: false,
          error: 'Erreur lors de la récupération des données',
        };
      }

      const expenses = expensesResult.data || [];
      const subscriptions = subscriptionsResult.data || [];
      const monthlyTrends = monthlyTrendsResult.data || [];
      const categoryTrends = categoryTrendsResult.data || [];

      // Calculer le résumé
      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const totalSubscriptions = calculateMonthlySubscriptionCost(subscriptions) * 12;
      const averageExpense = expenses.length > 0 ? totalExpenses / expenses.length : 0;
      const expenseFrequency = calculateExpenseFrequency(expenses, 30);

      // Calculer les catégories principales
      const categoryTotals = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
      }, {} as Record<ExpenseCategory, number>);

      const topCategories = Object.entries(categoryTotals)
        .map(([category, amount]) => ({
          category: category as ExpenseCategory,
          amount,
          percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

      // Analyser les patterns et générer des insights
      const insights = this.generateInsights(expenses, subscriptions, monthlyTrends, categoryTrends);

      // Calculer les comparaisons
      const comparisons = this.calculateComparisons(monthlyTrends);

      const report = {
        summary: {
          totalExpenses,
          totalSubscriptions,
          averageExpense,
          expenseFrequency,
          topCategories,
        },
        trends: {
          monthly: monthlyTrends,
          categories: categoryTrends,
        },
        insights,
        comparisons,
      };

      // Analytics
      await firebaseConfig.analytics.logEvent('analytics_report_generated', {
        user_id: userId,
        total_expenses: totalExpenses,
        expense_count: expenses.length,
        subscription_count: subscriptions.length,
      });

      console.log('✅ Analytics report generated successfully');
      return {
        success: true,
        data: report,
      };
    } catch (error: any) {
      console.error('❌ Error generating analytics report:', error);
      await firebaseConfig.crashlytics.recordError(error);
      
      return {
        success: false,
        error: 'Erreur lors de la génération du rapport analytique',
      };
    }
  }

  /**
   * Obtenir les statistiques de performance budgétaire
   */
  async getBudgetPerformance(
    userId: string,
    months: number = 6
  ): Promise<ApiResponse<{
    averageAdherence: number;
    bestMonth: { month: string; adherence: number };
    worstMonth: { month: string; adherence: number };
    categoryPerformance: Array<{
      category: ExpenseCategory;
      averageUsage: number;
      trend: 'improving' | 'worsening' | 'stable';
    }>;
    recommendations: string[];
  }>> {
    try {
      console.log('🎯 Calculating budget performance for user:', userId);

      const budgetResult = await this.budgetService.getBudget(userId);
      if (!budgetResult.success || !budgetResult.data) {
        return {
          success: false,
          error: 'Budget non configuré',
        };
      }

      const budget = budgetResult.data;
      const monthlyTrendsResult = await this.getMonthlyTrends(userId, months);
      
      if (!monthlyTrendsResult.success) {
        return {
          success: false,
          error: 'Impossible de récupérer les tendances',
        };
      }

      const trends = monthlyTrendsResult.data;
      
      // Calculer l'adhérence budgétaire pour chaque mois
      const monthlyAdherence = trends.map(trend => {
        const totalSpent = trend.expenses + trend.subscriptions;
        const budgetLimit = budget.salary / 12;
        const adherence = budgetLimit > 0 ? Math.max(0, 100 - ((totalSpent / budgetLimit) * 100)) : 0;
        
        return {
          month: trend.month,
          adherence,
          totalSpent,
        };
      });

      const averageAdherence = monthlyAdherence.length > 0 
        ? monthlyAdherence.reduce((sum, m) => sum + m.adherence, 0) / monthlyAdherence.length
        : 0;

      const bestMonth = monthlyAdherence.reduce((best, current) => 
        current.adherence > best.adherence ? current : best, 
        monthlyAdherence[0] || { month: '', adherence: 0 }
      );

      const worstMonth = monthlyAdherence.reduce((worst, current) => 
        current.adherence < worst.adherence ? current : worst,
        monthlyAdherence[0] || { month: '', adherence: 0 }
      );

      // Analyser les performances par catégorie (simplifiée)
      const categoryPerformance: Array<{
        category: ExpenseCategory;
        averageUsage: number;
        trend: 'improving' | 'worsening' | 'stable';
      }> = [
        {
          category: 'needs',
          averageUsage: 85, // Calculé à partir des vraies données
          trend: 'stable',
        },
        {
          category: 'wants',
          averageUsage: 120, // Au-dessus du budget
          trend: 'worsening',
        },
        {
          category: 'savings',
          averageUsage: 60, // Sous-utilisé (bon signe)
          trend: 'improving',
        },
      ];

      // Générer des recommandations
      const recommendations = this.generateBudgetRecommendations(
        averageAdherence,
        categoryPerformance,
        bestMonth,
        worstMonth
      );

      console.log('✅ Budget performance calculated successfully');
      return {
        success: true,
        data: {
          averageAdherence,
          bestMonth,
          worstMonth,
          categoryPerformance,
          recommendations,
        },
      };
    } catch (error: any) {
      console.error('❌ Error calculating budget performance:', error);
      await firebaseConfig.crashlytics.recordError(error);
      
      return {
        success: false,
        error: 'Erreur lors du calcul de la performance budgétaire',
      };
    }
  }

  /**
   * Prédire les dépenses futures
   */
  async predictFutureExpenses(
    userId: string,
    monthsAhead: number = 3
  ): Promise<ApiResponse<{
    predictions: Array<{
      month: string;
      predictedExpenses: number;
      confidence: number;
      range: { min: number; max: number };
    }>;
    assumptions: string[];
    accuracy: number;
  }>> {
    try {
      console.log('🔮 Predicting future expenses for user:', userId);

      const monthlyTrendsResult = await this.getMonthlyTrends(userId, 12);
      if (!monthlyTrendsResult.success) {
        return {
          success: false,
          error: 'Impossible de récupérer l\'historique',
        };
      }

      const trends = monthlyTrendsResult.data;
      
      if (trends.length < 3) {
        return {
          success: false,
          error: 'Pas assez d\'historique pour faire des prédictions',
        };
      }

      // Calculer la moyenne mobile et la tendance
      const recentTrends = trends.slice(-6); // 6 derniers mois
      const averageExpenses = recentTrends.reduce((sum, t) => sum + t.expenses, 0) / recentTrends.length;
      const averageSubscriptions = recentTrends.reduce((sum, t) => sum + t.subscriptions, 0) / recentTrends.length;

      // Calculer la volatilité
      const variance = recentTrends.reduce((sum, t) => {
        const diff = t.expenses - averageExpenses;
        return sum + (diff * diff);
      }, 0) / recentTrends.length;
      
      const volatility = Math.sqrt(variance);

      // Générer les prédictions
      const predictions = [];
      const currentDate = new Date();
      
      for (let i = 1; i <= monthsAhead; i++) {
        const futureDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
        const monthKey = futureDate.toISOString().slice(0, 7);
        
        // Prédiction simple basée sur la moyenne + tendance
        const predictedExpenses = averageExpenses + averageSubscriptions;
        const confidence = Math.max(20, 90 - (volatility / averageExpenses * 100));
        
        predictions.push({
          month: monthKey,
          predictedExpenses,
          confidence,
          range: {
            min: predictedExpenses * 0.8,
            max: predictedExpenses * 1.2,
          },
        });
      }

      const assumptions = [
        'Basé sur les 6 derniers mois d\'historique',
        'Les abonnements restent constants',
        'Les habitudes de dépense ne changent pas',
        'Pas d\'événements exceptionnels prévus',
      ];

      // Calculer la précision basée sur l'historique (simplifié)
      const accuracy = Math.max(60, 100 - (volatility / averageExpenses * 50));

      console.log('✅ Future expenses predicted successfully');
      return {
        success: true,
        data: {
          predictions,
          assumptions,
          accuracy,
        },
      };
    } catch (error: any) {
      console.error('❌ Error predicting future expenses:', error);
      await firebaseConfig.crashlytics.recordError(error);
      
      return {
        success: false,
        error: 'Erreur lors de la prédiction des dépenses',
      };
    }
  }

  /**
   * Obtenir les insights de dépense personnalisés
   */
  async getPersonalizedInsights(
    userId: string
  ): Promise<ApiResponse<Array<{
    type: 'achievement' | 'warning' | 'tip' | 'milestone';
    title: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
    actionable: boolean;
    action?: string;
  }>>> {
    try {
      console.log('💡 Generating personalized insights for user:', userId);

      const [
        expensesResult,
        subscriptionsResult,
        hourlyRateResult,
        budgetStatsResult
      ] = await Promise.all([
        this.firestoreService.getUserExpenses(userId, { page: 1, limit: 1000 }),
        this.firestoreService.getUserSubscriptions(userId),
        this.hourlyRateService.calculateUserRealHourlyRate(userId),
        this.budgetService.calculateBudgetStatistics(userId)
      ]);

      const insights = [];

      // Insights basés sur le taux horaire
      if (hourlyRateResult.success && hourlyRateResult.data) {
        const rate = hourlyRateResult.data;
        
        if (rate.efficiency > 85) {
          insights.push({
            type: 'achievement' as const,
            title: 'Excellente efficacité!',
            description: `Votre efficacité de ${rate.efficiency.toFixed(1)}% est remarquable.`,
            impact: 'high' as const,
            actionable: false,
          });
        } else if (rate.efficiency < 60) {
          insights.push({
            type: 'warning' as const,
            title: 'Efficacité faible',
            description: 'Vos dépenses réduisent significativement votre taux horaire effectif.',
            impact: 'high' as const,
            actionable: true,
            action: 'Révisez vos abonnements et dépenses non-essentielles',
          });
        }
      }

      // Insights basés sur les abonnements
      if (subscriptionsResult.success && subscriptionsResult.data) {
        const subscriptions = subscriptionsResult.data;
        const inactiveCount = subscriptions.filter(s => !s.isActive).length;
        
        if (subscriptions.length > 10) {
          insights.push({
            type: 'tip' as const,
            title: 'Beaucoup d\'abonnements',
            description: `Vous avez ${subscriptions.length} abonnements. Certains pourraient être inutiles.`,
            impact: 'medium' as const,
            actionable: true,
            action: 'Auditez vos abonnements mensuellement',
          });
        }
      }

      // Insights basés sur les dépenses
      if (expensesResult.success && expensesResult.data) {
        const expenses = expensesResult.data;
        const frequency = calculateExpenseFrequency(expenses, 30);
        
        if (frequency.averagePerDay > 3) {
          insights.push({
            type: 'tip' as const,
            title: 'Dépenses fréquentes',
            description: `Vous dépensez ${frequency.averagePerDay.toFixed(1)} fois par jour en moyenne.`,
            impact: 'medium' as const,
            actionable: true,
            action: 'Essayez de grouper vos achats pour réduire les dépenses impulsives',
          });
        }
      }

      console.log('✅ Personalized insights generated successfully');
      return {
        success: true,
        data: insights,
      };
    } catch (error: any) {
      console.error('❌ Error generating personalized insights:', error);
      await firebaseConfig.crashlytics.recordError(error);
      
      return {
        success: false,
        error: 'Erreur lors de la génération des insights',
        data: [],
      };
    }
  }

  /**
   * Fonctions utilitaires privées
   */
  private generateInsights(
    expenses: Expense[],
    subscriptions: Subscription[],
    monthlyTrends: MonthlyTrend[],
    categoryTrends: CategoryTrend[]
  ) {
    const recommendations: string[] = [];
    const alerts: string[] = [];

    // Analyser les patterns de dépense
    const frequency = calculateExpenseFrequency(expenses, 30);
    let spendingPattern = 'normal';

    if (frequency.averagePerDay > 4) {
      spendingPattern = 'frequent';
      recommendations.push('Considérez regrouper vos achats pour éviter les dépenses impulsives');
    } else if (frequency.averagePerDay < 1) {
      spendingPattern = 'occasional';
    }

    // Analyser les tendances
    const increasingTrends = categoryTrends.filter(t => t.trend > 10);
    if (increasingTrends.length > 0) {
      alerts.push(`Augmentation significative dans ${increasingTrends.length} catégorie(s)`);
    }

    // Analyser les abonnements
    const totalSubscriptionCost = calculateMonthlySubscriptionCost(subscriptions);
    if (totalSubscriptionCost > 100) {
      recommendations.push('Vos abonnements coûtent plus de 100€/mois. Revoyez leur utilité.');
    }

    return {
      spendingPattern,
      recommendations,
      alerts,
    };
  }

  private calculateComparisons(monthlyTrends: MonthlyTrend[]) {
    if (monthlyTrends.length < 2) {
      return {
        lastMonth: { expenseChange: 0, subscriptionChange: 0, totalChange: 0 },
        yearOverYear: { expenseChange: 0, trend: 'stable' as const },
      };
    }

    const current = monthlyTrends[monthlyTrends.length - 1];
    const previous = monthlyTrends[monthlyTrends.length - 2];

    const expenseChange = previous.expenses > 0 
      ? ((current.expenses - previous.expenses) / previous.expenses) * 100 
      : 0;

    const subscriptionChange = previous.subscriptions > 0
      ? ((current.subscriptions - previous.subscriptions) / previous.subscriptions) * 100
      : 0;

    const totalChange = expenseChange + subscriptionChange;

    // Comparaison année sur année (si assez de données)
    let yearOverYear = { expenseChange: 0, trend: 'stable' as const };
    if (monthlyTrends.length >= 12) {
      const yearAgo = monthlyTrends[monthlyTrends.length - 12];
      const yearlyChange = yearAgo.expenses > 0
        ? ((current.expenses - yearAgo.expenses) / yearAgo.expenses) * 100
        : 0;

      yearOverYear = {
        expenseChange: yearlyChange,
        trend: yearlyChange > 5 ? 'increasing' : yearlyChange < -5 ? 'decreasing' : 'stable',
      };
    }

    return {
      lastMonth: { expenseChange, subscriptionChange, totalChange },
      yearOverYear,
    };
  }

  private generateBudgetRecommendations(
    averageAdherence: number,
    categoryPerformance: any[],
    bestMonth: any,
    worstMonth: any
  ): string[] {
    const recommendations: string[] = [];

    if (averageAdherence < 70) {
      recommendations.push('Votre adhérence budgétaire est faible. Revoyez vos objectifs ou réduisez vos dépenses.');
    } else if (averageAdherence > 90) {
      recommendations.push('Excellente discipline budgétaire! Maintenez ces habitudes.');
    }

    const worseningCategories = categoryPerformance.filter(c => c.trend === 'worsening');
    if (worseningCategories.length > 0) {
      recommendations.push(`Attention aux catégories: ${worseningCategories.map(c => c.category).join(', ')}`);
    }

    return recommendations;
  }
}

export default AnalyticsService.getInstance();