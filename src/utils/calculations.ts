// src/utils/calculations.ts
import { BudgetMethod, Budget, BudgetStats } from '../types/budget.types';
import { Expense, ExpenseCategory } from '../types/expense.types';
import { Subscription, SubscriptionPeriod } from '../types/subscription.types';
import { RealHourlyRate, MonthlyTrend, CategoryTrend } from '../types/analytics.types';
import { WORK_HOURS } from './constants';

/**
 * Calcule les allocations budgétaires basées sur le salaire et la méthode
 */
export const calculateBudgetAllocations = (
  salary: number,
  method: BudgetMethod
): { needs: number; wants: number; savings: number } => {
  return {
    needs: (salary * method.needs) / 100,
    wants: (salary * method.wants) / 100,
    savings: (salary * method.savings) / 100,
  };
};

/**
 * Calcule le taux horaire théorique
 */
export const calculateTheoreticalHourlyRate = (
  annualSalary: number,
  options: {
    hoursPerDay?: number;
    daysPerWeek?: number;
    weeksPerYear?: number;
    vacationDays?: number;
    sickDays?: number;
  } = {}
): number => {
  const {
    hoursPerDay = WORK_HOURS.defaultHoursPerDay,
    daysPerWeek = WORK_HOURS.defaultDaysPerWeek,
    weeksPerYear = WORK_HOURS.defaultWeeksPerYear,
    vacationDays = WORK_HOURS.defaultVacationDays,
    sickDays = WORK_HOURS.defaultSickDays,
  } = options;

  const totalWorkDays = daysPerWeek * weeksPerYear;
  const workingDays = totalWorkDays - vacationDays - sickDays;
  const totalWorkingHours = workingDays * hoursPerDay;

  return totalWorkingHours > 0 ? annualSalary / totalWorkingHours : 0;
};

/**
 * Convertit un abonnement en coût mensuel
 */
export const convertSubscriptionToMonthly = (
  price: number,
  period: SubscriptionPeriod
): number => {
  switch (period) {
    case 'weekly':
      return price * 4.33; // 52 semaines / 12 mois
    case 'yearly':
      return price / 12;
    case 'monthly':
    default:
      return price;
  }
};

/**
 * Calcule le coût total mensuel des abonnements
 */
export const calculateMonthlySubscriptionCost = (subscriptions: Subscription[]): number => {
  return subscriptions
    .filter(sub => sub.isActive)
    .reduce((total, sub) => {
      return total + convertSubscriptionToMonthly(sub.price, sub.period);
    }, 0);
};

/**
 * Calcule les heures de travail nécessaires pour un montant donné
 */
export const calculateWorkHoursForAmount = (
  amount: number,
  hourlyRate: number
): number => {
  return hourlyRate > 0 ? amount / hourlyRate : 0;
};

/**
 * Calcule le taux horaire réel
 */
export const calculateRealHourlyRate = (
  theoreticalHourlyRate: number,
  monthlyExpenses: number,
  monthlySubscriptions: number,
  monthlyIncome: number
): RealHourlyRate => {
  const totalMonthlyImpact = monthlyExpenses + monthlySubscriptions;
  const workHoursLostPerMonth = calculateWorkHoursForAmount(totalMonthlyImpact, theoreticalHourlyRate);
  
  // Supposons 160 heures de travail par mois (8h * 20 jours)
  const monthlyWorkHours = 160;
  const realHourlyRate = (monthlyIncome - totalMonthlyImpact) / monthlyWorkHours;
  
  const efficiency = theoreticalHourlyRate > 0 ? (realHourlyRate / theoreticalHourlyRate) * 100 : 0;

  return {
    theoretical: theoreticalHourlyRate,
    real: Math.max(0, realHourlyRate),
    efficiency: Math.max(0, Math.min(100, efficiency)),
    totalImpact: totalMonthlyImpact,
    breakdown: {
      expenses: monthlyExpenses,
      subscriptions: monthlySubscriptions,
    },
  };
};

/**
 * Calcule les statistiques budgétaires
 */
export const calculateBudgetStats = (
  budget: Budget,
  expenses: Expense[],
  subscriptions: Subscription[]
): BudgetStats => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  // Filtrer les dépenses du mois courant
  const monthlyExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
  });

  // Calculer les totaux par catégorie
  const categorySpending = monthlyExpenses.reduce(
    (acc, expense) => {
      acc[expense.category] += expense.amount;
      return acc;
    },
    { needs: 0, wants: 0, savings: 0 }
  );

  // Ajouter les abonnements aux catégories appropriées
  const monthlySubscriptionCost = calculateMonthlySubscriptionCost(subscriptions);
  subscriptions
    .filter(sub => sub.isActive)
    .forEach(sub => {
      const monthlyAmount = convertSubscriptionToMonthly(sub.price, sub.period);
      categorySpending[sub.budgetCategory] += monthlyAmount;
    });

  const totalExpenses = Object.values(categorySpending).reduce((sum, amount) => sum + amount, 0);
  const totalSubscriptions = monthlySubscriptionCost;
  const remaining = budget.salary - totalExpenses;

  // Calculer les pourcentages utilisés
  const percentageUsed = {
    needs: budget.allocations.needs > 0 ? (categorySpending.needs / budget.allocations.needs) * 100 : 0,
    wants: budget.allocations.wants > 0 ? (categorySpending.wants / budget.allocations.wants) * 100 : 0,
    savings: budget.allocations.savings > 0 ? (categorySpending.savings / budget.allocations.savings) * 100 : 0,
  };

  return {
    totalIncome: budget.salary,
    totalExpenses,
    totalSubscriptions,
    remaining,
    categorySpending,
    percentageUsed,
  };
};

/**
 * Calcule les tendances mensuelles
 */
export const calculateMonthlyTrends = (
  expenses: Expense[],
  subscriptions: Subscription[],
  months: number = 12
): MonthlyTrend[] => {
  const trends: MonthlyTrend[] = [];
  const currentDate = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const month = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthKey = month.toISOString().slice(0, 7); // YYYY-MM

    // Filtrer les dépenses du mois
    const monthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === month.getMonth() && 
             expenseDate.getFullYear() === month.getFullYear();
    });

    const monthlyExpenseTotal = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const monthlySubscriptionTotal = calculateMonthlySubscriptionCost(subscriptions);

    trends.push({
      month: monthKey,
      income: 0, // À remplir avec les données de revenus
      expenses: monthlyExpenseTotal,
      subscriptions: monthlySubscriptionTotal,
      savings: 0, // Calculé plus tard avec les revenus
    });
  }

  return trends;
};

/**
 * Calcule les tendances par catégorie
 */
export const calculateCategoryTrends = (
  expenses: Expense[],
  previousMonths: number = 3
): CategoryTrend[] => {
  const currentDate = new Date();
  const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - previousMonths, 1);

  // Dépenses du mois courant
  const currentExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= currentMonth;
  });

  // Dépenses des mois précédents
  const previousExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= previousMonth && expenseDate < currentMonth;
  });

  const categories: ExpenseCategory[] = ['needs', 'wants', 'savings'];
  
  return categories.map(category => {
    const currentAmount = currentExpenses
      .filter(expense => expense.category === category)
      .reduce((sum, expense) => sum + expense.amount, 0);

    const previousAmount = previousExpenses
      .filter(expense => expense.category === category)
      .reduce((sum, expense) => sum + expense.amount, 0);

    const trend = previousAmount > 0 
      ? ((currentAmount - previousAmount) / previousAmount) * 100
      : currentAmount > 0 ? 100 : 0;

    return {
      category,
      trend,
      amount: currentAmount,
    };
  });
};

/**
 * Calcule l'impact d'un abonnement sur le taux horaire
 */
export const calculateSubscriptionImpact = (
  subscription: Subscription,
  hourlyRate: number
): {
  monthlyImpact: number;
  yearlyImpact: number;
  hoursPerMonth: number;
  hoursPerYear: number;
} => {
  const monthlyAmount = convertSubscriptionToMonthly(subscription.price, subscription.period);
  const yearlyAmount = monthlyAmount * 12;
  
  const hoursPerMonth = calculateWorkHoursForAmount(monthlyAmount, hourlyRate);
  const hoursPerYear = calculateWorkHoursForAmount(yearlyAmount, hourlyRate);

  return {
    monthlyImpact: monthlyAmount,
    yearlyImpact: yearlyAmount,
    hoursPerMonth,
    hoursPerYear,
  };
};

/**
 * Calcule l'économie potentielle en annulant des abonnements
 */
export const calculatePotentialSavings = (
  subscriptions: Subscription[],
  subscriptionIds: string[]
): {
  monthlyeSavings: number;
  yearlySavings: number;
  workHoursSaved: number;
} => {
  const subscriptionsToCancel = subscriptions.filter(sub => 
    subscriptionIds.includes(sub.id) && sub.isActive
  );

  const monthlySavings = subscriptionsToCancel.reduce((total, sub) => {
    return total + convertSubscriptionToMonthly(sub.price, sub.period);
  }, 0);

  return {
    monthlyeSavings: monthlySavings,
    yearlySavings: monthlySavings * 12,
    workHoursSaved: 0, // À calculer avec le taux horaire
  };
};

/**
 * Calcule le pourcentage d'utilisation du budget
 */
export const calculateBudgetUsage = (
  allocated: number,
  spent: number
): {
  percentage: number;
  remaining: number;
  status: 'safe' | 'warning' | 'danger';
} => {
  const percentage = allocated > 0 ? (spent / allocated) * 100 : 0;
  const remaining = allocated - spent;
  
  let status: 'safe' | 'warning' | 'danger';
  if (percentage <= 80) {
    status = 'safe';
  } else if (percentage <= 100) {
    status = 'warning';
  } else {
    status = 'danger';
  }

  return {
    percentage: Math.max(0, percentage),
    remaining,
    status,
  };
};

/**
 * Calcule la projection financière
 */
export const calculateFinancialProjection = (
  currentSavings: number,
  monthlyIncome: number,
  monthlyExpenses: number,
  months: number = 12
): {
  projectedSavings: number;
  monthlySurplus: number;
  savingsRate: number;
} => {
  const monthlySurplus = monthlyIncome - monthlyExpenses;
  const projectedSavings = currentSavings + (monthlySurplus * months);
  const savingsRate = monthlyIncome > 0 ? (monthlySurplus / monthlyIncome) * 100 : 0;

  return {
    projectedSavings: Math.max(0, projectedSavings),
    monthlySurplus,
    savingsRate: Math.max(0, savingsRate),
  };
};

/**
 * Calcule le coût par utilisation d'un abonnement
 */
export const calculateCostPerUse = (
  subscription: Subscription,
  usesPerMonth: number
): number => {
  const monthlyAmount = convertSubscriptionToMonthly(subscription.price, subscription.period);
  return usesPerMonth > 0 ? monthlyAmount / usesPerMonth : 0;
};

/**
 * Calcule l'âge moyen des dépenses
 */
export const calculateExpenseAge = (expenses: Expense[]): number => {
  if (expenses.length === 0) return 0;
  
  const now = Date.now();
  const totalAge = expenses.reduce((sum, expense) => {
    const expenseTime = new Date(expense.date).getTime();
    return sum + (now - expenseTime);
  }, 0);
  
  const avgAgeMs = totalAge / expenses.length;
  return Math.floor(avgAgeMs / (1000 * 60 * 60 * 24)); // Convertir en jours
};

/**
 * Calcule les statistiques de fréquence des dépenses
 */
export const calculateExpenseFrequency = (
  expenses: Expense[],
  days: number = 30
): {
  averagePerDay: number;
  averageAmount: number;
  totalDays: number;
  activeDays: number;
} => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const recentExpenses = expenses.filter(expense => 
    new Date(expense.date) >= cutoffDate
  );
  
  const expenseDates = new Set(
    recentExpenses.map(expense => expense.date.split('T')[0])
  );
  
  const totalAmount = recentExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  return {
    averagePerDay: recentExpenses.length / days,
    averageAmount: recentExpenses.length > 0 ? totalAmount / recentExpenses.length : 0,
    totalDays: days,
    activeDays: expenseDates.size,
  };
};