// src/services/firebase/hourlyRate.service.ts
import { FirestoreService } from './firestore.service';
import { BudgetService } from './budget.service';
import firebaseConfig from './config';
import { 
  RealHourlyRate, 
  ApiResponse,
  Expense,
  Subscription,
  Budget
} from '../../types';
import { 
  calculateTheoreticalHourlyRate,
  calculateRealHourlyRate,
  calculateSubscriptionImpact,
  calculateWorkHoursForAmount,
  calculateMonthlySubscriptionCost
} from '../../utils/calculations';
import { WORK_HOURS } from '../../utils/constants';

export class HourlyRateService {
  private static instance: HourlyRateService;
  private firestoreService: FirestoreService;
  private budgetService: BudgetService;

  private constructor() {
    this.firestoreService = FirestoreService.getInstance();
    this.budgetService = BudgetService.getInstance();
  }

  public static getInstance(): HourlyRateService {
    if (!HourlyRateService.instance) {
      HourlyRateService.instance = new HourlyRateService();
    }
    return HourlyRateService.instance;
  }

  /**
   * Calculer le taux horaire réel d'un utilisateur
   */
  async calculateUserRealHourlyRate(
    userId: string,
    options: {
      workHoursPerDay?: number;
      workDaysPerWeek?: number;
      vacationDays?: number;
      sickDays?: number;
    } = {}
  ): Promise<ApiResponse<RealHourlyRate>> {
    try {
      console.log('⏰ Calculating real hourly rate for user:', userId);

      // Récupérer le budget utilisateur
      const budgetResult = await this.budgetService.getBudget(userId);
      if (!budgetResult.success || !budgetResult.data) {
        return {
          success: false,
          error: 'Budget non configuré. Configurez votre budget d\'abord.',
        };
      }

      const budget = budgetResult.data;

      // Récupérer les dépenses du mois courant
      const expensesResult = await this.firestoreService.getUserExpenses(userId, {
        page: 1,
        limit: 1000,
      }, this.getCurrentMonthRange());

      if (!expensesResult.success) {
        return {
          success: false,
          error: 'Erreur lors de la récupération des dépenses',
        };
      }

      // Récupérer les abonnements actifs
      const subscriptionsResult = await this.firestoreService.getUserSubscriptions(userId);
      if (!subscriptionsResult.success) {
        return {
          success: false,
          error: 'Erreur lors de la récupération des abonnements',
        };
      }

      const expenses = expensesResult.data || [];
      const subscriptions = subscriptionsResult.data || [];

      // Calculer le taux horaire théorique
      const theoreticalRate = calculateTheoreticalHourlyRate(budget.salary, {
        hoursPerDay: options.workHoursPerDay || WORK_HOURS.defaultHoursPerDay,
        daysPerWeek: options.workDaysPerWeek || WORK_HOURS.defaultDaysPerWeek,
        weeksPerYear: WORK_HOURS.defaultWeeksPerYear,
        vacationDays: options.vacationDays || WORK_HOURS.defaultVacationDays,
        sickDays: options.sickDays || WORK_HOURS.defaultSickDays,
      });

      // Calculer les dépenses mensuelles
      const monthlyExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const monthlySubscriptions = calculateMonthlySubscriptionCost(subscriptions);

      // Calculer le taux horaire réel
      const realHourlyRate = calculateRealHourlyRate(
        theoreticalRate,
        monthlyExpenses,
        monthlySubscriptions,
        budget.salary
      );

      // Analytics
      await firebaseConfig.analytics.logEvent('hourly_rate_calculated', {
        user_id: userId,
        theoretical_rate: theoreticalRate,
        real_rate: realHourlyRate.real,
        efficiency: realHourlyRate.efficiency,
        total_impact: realHourlyRate.totalImpact,
      });

      console.log('✅ Real hourly rate calculated successfully');
      return {
        success: true,
        data: realHourlyRate,
      };
    } catch (error: any) {
      console.error('❌ Error calculating real hourly rate:', error);
      await firebaseConfig.crashlytics.recordError(error);
      
      return {
        success: false,
        error: 'Erreur lors du calcul du taux horaire réel',
      };
    }
  }

  /**
   * Calculer l'impact d'une dépense sur le temps de travail
   */
  async calculateExpenseImpact(
    userId: string,
    amount: number
  ): Promise<ApiResponse<{
    workHoursRequired: number;
    workDaysRequired: number;
    theoreticalHourlyRate: number;
    realHourlyRate: number;
    efficiency: number;
  }>> {
    try {
      console.log('💸 Calculating expense impact for user:', userId, 'amount:', amount);

      // Récupérer le taux horaire réel
      const rateResult = await this.calculateUserRealHourlyRate(userId);
      if (!rateResult.success || !rateResult.data) {
        return {
          success: false,
          error: rateResult.error || 'Impossible de calculer le taux horaire',
        };
      }

      const hourlyRate = rateResult.data;

      // Calculer les heures de travail nécessaires
      const workHoursRequired = calculateWorkHoursForAmount(amount, hourlyRate.theoretical);
      const workDaysRequired = workHoursRequired / WORK_HOURS.defaultHoursPerDay;

      console.log('✅ Expense impact calculated successfully');
      return {
        success: true,
        data: {
          workHoursRequired,
          workDaysRequired,
          theoreticalHourlyRate: hourlyRate.theoretical,
          realHourlyRate: hourlyRate.real,
          efficiency: hourlyRate.efficiency,
        },
      };
    } catch (error: any) {
      console.error('❌ Error calculating expense impact:', error);
      await firebaseConfig.crashlytics.recordError(error);
      
      return {
        success: false,
        error: 'Erreur lors du calcul de l\'impact de la dépense',
      };
    }
  }

  /**
   * Calculer l'impact de tous les abonnements
   */
  async calculateSubscriptionsImpact(
    userId: string
  ): Promise<ApiResponse<Array<{
    subscription: Subscription;
    impact: {
      monthlyImpact: number;
      yearlyImpact: number;
      hoursPerMonth: number;
      hoursPerYear: number;
      costPerUse?: number;
    };
  }>>> {
    try {
      console.log('💳 Calculating subscriptions impact for user:', userId);

      // Récupérer le taux horaire
      const rateResult = await this.calculateUserRealHourlyRate(userId);
      if (!rateResult.success || !rateResult.data) {
        return {
          success: false,
          error: 'Impossible de calculer le taux horaire',
        };
      }

      const hourlyRate = rateResult.data.theoretical;

      // Récupérer les abonnements
      const subscriptionsResult = await this.firestoreService.getUserSubscriptions(userId);
      if (!subscriptionsResult.success) {
        return {
          success: false,
          error: 'Erreur lors de la récupération des abonnements',
        };
      }

      const subscriptions = subscriptionsResult.data || [];

      // Calculer l'impact de chaque abonnement
      const impacts = subscriptions.map(subscription => {
        const impact = calculateSubscriptionImpact(subscription, hourlyRate);
        
        return {
          subscription,
          impact,
        };
      });

      // Trier par impact mensuel décroissant
      impacts.sort((a, b) => b.impact.monthlyImpact - a.impact.monthlyImpact);

      console.log('✅ Subscriptions impact calculated successfully');
      return {
        success: true,
        data: impacts,
      };
    } catch (error: any) {
      console.error('❌ Error calculating subscriptions impact:', error);
      await firebaseConfig.crashlytics.recordError(error);
      
      return {
        success: false,
        error: 'Erreur lors du calcul de l\'impact des abonnements',
      };
    }
  }

  /**
   * Générer un rapport détaillé du taux horaire
   */
  async generateHourlyRateReport(
    userId: string
  ): Promise<ApiResponse<{
    summary: RealHourlyRate;
    breakdown: {
      salaryBreakdown: {
        annual: number;
        monthly: number;
        weekly: number;
        daily: number;
        hourly: number;
      };
      timeWorked: {
        hoursPerDay: number;
        daysPerWeek: number;
        weeksPerYear: number;
        totalHoursPerYear: number;
      };
      impactAnalysis: {
        monthlyExpenses: number;
        monthlySubscriptions: number;
        totalMonthlyImpact: number;
        yearlyImpact: number;
        hoursLostPerMonth: number;
        daysLostPerMonth: number;
      };
    };
    recommendations: string[];
  }>> {
    try {
      console.log('📊 Generating hourly rate report for user:', userId);

      // Calculer le taux horaire réel
      const rateResult = await this.calculateUserRealHourlyRate(userId);
      if (!rateResult.success || !rateResult.data) {
        return {
          success: false,
          error: 'Impossible de calculer le taux horaire',
        };
      }

      const hourlyRate = rateResult.data;

      // Récupérer le budget
      const budgetResult = await this.budgetService.getBudget(userId);
      if (!budgetResult.success || !budgetResult.data) {
        return {
          success: false,
          error: 'Budget non configuré',
        };
      }

      const budget = budgetResult.data;

      // Calculer les détails
      const totalHoursPerYear = WORK_HOURS.defaultDaysPerWeek * 
                               WORK_HOURS.defaultWeeksPerYear * 
                               WORK_HOURS.defaultHoursPerDay;

      const hoursLostPerMonth = calculateWorkHoursForAmount(
        hourlyRate.totalImpact,
        hourlyRate.theoretical
      );

      const breakdown = {
        salaryBreakdown: {
          annual: budget.salary,
          monthly: budget.salary / 12,
          weekly: budget.salary / 52,
          daily: budget.salary / (WORK_HOURS.defaultDaysPerWeek * WORK_HOURS.defaultWeeksPerYear),
          hourly: hourlyRate.theoretical,
        },
        timeWorked: {
          hoursPerDay: WORK_HOURS.defaultHoursPerDay,
          daysPerWeek: WORK_HOURS.defaultDaysPerWeek,
          weeksPerYear: WORK_HOURS.defaultWeeksPerYear,
          totalHoursPerYear,
        },
        impactAnalysis: {
          monthlyExpenses: hourlyRate.breakdown.expenses,
          monthlySubscriptions: hourlyRate.breakdown.subscriptions,
          totalMonthlyImpact: hourlyRate.totalImpact,
          yearlyImpact: hourlyRate.totalImpact * 12,
          hoursLostPerMonth,
          daysLostPerMonth: hoursLostPerMonth / WORK_HOURS.defaultHoursPerDay,
        },
      };

      // Générer des recommandations
      const recommendations = this.generateRecommendations(hourlyRate, breakdown);

      // Analytics
      await firebaseConfig.analytics.logEvent('hourly_rate_report_generated', {
        user_id: userId,
        efficiency: hourlyRate.efficiency,
        monthly_impact: hourlyRate.totalImpact,
        hours_lost_per_month: hoursLostPerMonth,
      });

      console.log('✅ Hourly rate report generated successfully');
      return {
        success: true,
        data: {
          summary: hourlyRate,
          breakdown,
          recommendations,
        },
      };
    } catch (error: any) {
      console.error('❌ Error generating hourly rate report:', error);
      await firebaseConfig.crashlytics.recordError(error);
      
      return {
        success: false,
        error: 'Erreur lors de la génération du rapport',
      };
    }
  }

  /**
   * Comparer le taux horaire avec des moyennes sectorielles
   */
  async compareWithIndustryAverage(
    userId: string,
    industry?: string
  ): Promise<ApiResponse<{
    userRate: number;
    industryAverage: number;
    percentile: number;
    comparison: 'above' | 'below' | 'average';
    message: string;
  }>> {
    try {
      console.log('📈 Comparing hourly rate with industry average for user:', userId);

      const rateResult = await this.calculateUserRealHourlyRate(userId);
      if (!rateResult.success || !rateResult.data) {
        return {
          success: false,
          error: 'Impossible de calculer le taux horaire',
        };
      }

      const userRate = rateResult.data.theoretical;

      // Moyennes sectorielles simplifiées (à remplacer par de vraies données)
      const industryAverages: Record<string, number> = {
        tech: 45,
        finance: 40,
        healthcare: 35,
        education: 25,
        retail: 20,
        default: 30,
      };

      const industryAverage = industryAverages[industry || 'default'] || industryAverages.default;
      const percentile = Math.min(100, Math.max(0, (userRate / industryAverage) * 50));

      let comparison: 'above' | 'below' | 'average';
      let message: string;

      if (userRate > industryAverage * 1.1) {
        comparison = 'above';
        message = `Excellent! Votre taux horaire est ${Math.round(((userRate / industryAverage) - 1) * 100)}% au-dessus de la moyenne sectorielle.`;
      } else if (userRate < industryAverage * 0.9) {
        comparison = 'below';
        message = `Votre taux horaire est ${Math.round((1 - (userRate / industryAverage)) * 100)}% en dessous de la moyenne sectorielle. Considérez négocier une augmentation.`;
      } else {
        comparison = 'average';
        message = 'Votre taux horaire est dans la moyenne sectorielle.';
      }

      console.log('✅ Industry comparison completed successfully');
      return {
        success: true,
        data: {
          userRate,
          industryAverage,
          percentile,
          comparison,
          message,
        },
      };
    } catch (error: any) {
      console.error('❌ Error comparing with industry average:', error);
      await firebaseConfig.crashlytics.recordError(error);
      
      return {
        success: false,
        error: 'Erreur lors de la comparaison sectorielle',
      };
    }
  }

  /**
   * Calculer l'optimisation possible du taux horaire
   */
  async calculateOptimization(
    userId: string
  ): Promise<ApiResponse<{
    currentEfficiency: number;
    optimizedEfficiency: number;
    potentialGain: number;
    recommendations: Array<{
      action: string;
      impact: number;
      difficulty: 'easy' | 'medium' | 'hard';
      description: string;
    }>;
  }>> {
    try {
      console.log('🎯 Calculating hourly rate optimization for user:', userId);

      const subscriptionsResult = await this.calculateSubscriptionsImpact(userId);
      if (!subscriptionsResult.success) {
        return {
          success: false,
          error: 'Impossible d\'analyser les abonnements',
        };
      }

      const rateResult = await this.calculateUserRealHourlyRate(userId);
      if (!rateResult.success || !rateResult.data) {
        return {
          success: false,
          error: 'Impossible de calculer le taux horaire',
        };
      }

      const currentRate = rateResult.data;
      const subscriptionImpacts = subscriptionsResult.data || [];

      // Identifier les optimisations possibles
      const recommendations = [];
      let potentialSavings = 0;

      // Abonnements inutilisés ou coûteux
      const expensiveSubscriptions = subscriptionImpacts
        .filter(item => item.impact.monthlyImpact > 20)
        .slice(0, 3);

      for (const item of expensiveSubscriptions) {
        recommendations.push({
          action: `Revoir l'abonnement ${item.subscription.name}`,
          impact: item.impact.monthlyImpact,
          difficulty: 'easy' as const,
          description: `Cet abonnement représente ${item.impact.hoursPerMonth.toFixed(1)} heures de travail par mois.`,
        });
        potentialSavings += item.impact.monthlyImpact * 0.5; // Estimation 50% d'économie possible
      }

      // Calculer l'efficacité optimisée
      const optimizedTotalImpact = currentRate.totalImpact - potentialSavings;
      const optimizedEfficiency = currentRate.theoretical > 0 
        ? ((currentRate.theoretical - (optimizedTotalImpact / 160)) / currentRate.theoretical) * 100
        : 0;

      const potentialGain = optimizedEfficiency - currentRate.efficiency;

      console.log('✅ Optimization calculated successfully');
      return {
        success: true,
        data: {
          currentEfficiency: currentRate.efficiency,
          optimizedEfficiency: Math.min(100, optimizedEfficiency),
          potentialGain: Math.max(0, potentialGain),
          recommendations,
        },
      };
    } catch (error: any) {
      console.error('❌ Error calculating optimization:', error);
      await firebaseConfig.crashlytics.recordError(error);
      
      return {
        success: false,
        error: 'Erreur lors du calcul de l\'optimisation',
      };
    }
  }

  /**
   * Utilitaires privées
   */
  private getCurrentMonthRange() {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
    
    return { startDate, endDate };
  }

  private generateRecommendations(
    hourlyRate: RealHourlyRate,
    breakdown: any
  ): string[] {
    const recommendations: string[] = [];

    if (hourlyRate.efficiency < 60) {
      recommendations.push(
        '🔴 Votre efficacité est faible. Réduisez vos dépenses ou négociez une augmentation.'
      );
    } else if (hourlyRate.efficiency < 80) {
      recommendations.push(
        '🟡 Votre efficacité est correcte mais peut être améliorée.'
      );
    } else {
      recommendations.push(
        '🟢 Excellente efficacité! Vous optimisez bien votre temps de travail.'
      );
    }

    if (breakdown.impactAnalysis.hoursLostPerMonth > 40) {
      recommendations.push(
        `⏰ Vous "perdez" ${breakdown.impactAnalysis.hoursLostPerMonth.toFixed(1)} heures de travail par mois à cause de vos dépenses.`
      );
    }

    if (breakdown.impactAnalysis.monthlySubscriptions > breakdown.impactAnalysis.monthlyExpenses) {
      recommendations.push(
        '💳 Vos abonnements représentent plus que vos autres dépenses. Révisez-les.'
      );
    }

    return recommendations;
  }
}

export default HourlyRateService.getInstance();