// src/types/common.types.ts

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  limit: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface RealHourlyRate {
  theoretical: number;
  real: number;
  efficiency: number;
  totalImpact: number;
  breakdown: {
    expenses: number;
    subscriptions: number;
  };
}

export interface WorkHours {
  hoursPerDay: number;
  daysPerWeek: number;
  weeksPerYear: number;
  vacationDays: number;
  sickDays: number;
}

export interface ExpenseImpact {
  workHoursRequired: number;
  workDaysRequired: number;
  theoreticalHourlyRate: number;
  realHourlyRate: number;
  efficiency: number;
}

export interface SubscriptionImpact {
  monthlyImpact: number;
  yearlyImpact: number;
  hoursPerMonth: number;
  hoursPerYear: number;
  costPerUse?: number;
}

export interface HourlyRateBreakdown {
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
}

export interface IndustryComparison {
  userRate: number;
  industryAverage: number;
  percentile: number;
  comparison: 'above' | 'below' | 'average';
  message: string;
}

export interface OptimizationRecommendation {
  action: string;
  impact: number;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
}

export interface HourlyRateOptimization {
  currentEfficiency: number;
  optimizedEfficiency: number;
  potentialGain: number;
  recommendations: OptimizationRecommendation[];
}

export interface HourlyRateReport {
  summary: RealHourlyRate;
  breakdown: HourlyRateBreakdown;
  recommendations: string[];
}

// Types pour les calculs
export interface SalaryCalculationOptions {
  hoursPerDay: number;
  daysPerWeek: number;
  weeksPerYear: number;
  vacationDays: number;
  sickDays: number;
}

// Types pour les filtres et requêtes
export interface ExpenseFilters {
  category?: string;
  minAmount?: number;
  maxAmount?: number;
  dateRange?: DateRange;
}

export interface SubscriptionFilters {
  category?: string;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

// Types pour les statistiques
export interface MonthlyStats {
  totalExpenses: number;
  totalSubscriptions: number;
  averageDaily: number;
  categoryBreakdown: Record<string, number>;
}

export interface YearlyStats {
  totalExpenses: number;
  totalSubscriptions: number;
  monthlyAverage: number;
  categoryBreakdown: Record<string, number>;
  trends: {
    month: string;
    amount: number;
  }[];
}