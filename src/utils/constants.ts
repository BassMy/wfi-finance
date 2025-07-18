// src/utils/constants.ts
import { BudgetMethod } from '../types/budget.types';
import { SubscriptionCategory } from '../types/subscription.types';

/**
 * Configuration de l'application
 */
export const APP_CONFIG = {
  name: 'WorkForIt',
  version: '1.0.0',
  defaultCurrency: 'EUR' as const,
  defaultLanguage: 'fr' as const,
  maxFileSize: 5 * 1024 * 1024, // 5MB
  apiTimeout: 10000, // 10 secondes
  maxRetries: 3,
} as const;

/**
 * Méthodes budgétaires prédéfinies
 */
export const BUDGET_METHODS: BudgetMethod[] = [
  {
    id: 'classic_50_30_20',
    name: '50/30/20 Classique',
    description: 'Méthode populaire et équilibrée',
    needs: 50,
    wants: 30,
    savings: 20,
    isCustom: false,
  },
  {
    id: 'aggressive_savings',
    name: 'Épargne Agressive',
    description: 'Maximiser l\'épargne',
    needs: 50,
    wants: 20,
    savings: 30,
    isCustom: false,
  },
  {
    id: 'balanced_lifestyle',
    name: 'Lifestyle Équilibré',
    description: 'Plus de place aux loisirs',
    needs: 45,
    wants: 40,
    savings: 15,
    isCustom: false,
  },
  {
    id: 'student_budget',
    name: 'Budget Étudiant',
    description: 'Adapté aux revenus étudiants',
    needs: 60,
    wants: 30,
    savings: 10,
    isCustom: false,
  },
  {
    id: 'family_focused',
    name: 'Famille',
    description: 'Priorité aux besoins familiaux',
    needs: 65,
    wants: 20,
    savings: 15,
    isCustom: false,
  },
];

/**
 * Catégories d'abonnements avec métadonnées
 */
export const SUBSCRIPTION_CATEGORIES: Array<{
  id: SubscriptionCategory;
  name: string;
  icon: string;
  color: string;
  examples: string[];
}> = [
  {
    id: 'streaming',
    name: 'Streaming',
    icon: '📺',
    color: '#E53E3E',
    examples: ['Netflix', 'Prime Video', 'Disney+', 'YouTube Premium'],
  },
  {
    id: 'music',
    name: 'Musique',
    icon: '🎵',
    color: '#38A169',
    examples: ['Spotify', 'Apple Music', 'Deezer', 'Tidal'],
  },
  {
    id: 'software',
    name: 'Logiciels',
    icon: '💻',
    color: '#3182CE',
    examples: ['Adobe CC', 'Microsoft 365', 'Notion', 'Figma'],
  },
  {
    id: 'fitness',
    name: 'Sport & Santé',
    icon: '💪',
    color: '#D69E2E',
    examples: ['Salle de sport', 'MyFitnessPal', 'Strava', 'Headspace'],
  },
  {
    id: 'news',
    name: 'Actualités',
    icon: '📰',
    color: '#805AD5',
    examples: ['Le Monde', 'New York Times', 'Medium', 'LinkedIn Premium'],
  },
  {
    id: 'gaming',
    name: 'Gaming',
    icon: '🎮',
    color: '#DD6B20',
    examples: ['PlayStation Plus', 'Xbox Game Pass', 'Steam', 'Twitch Prime'],
  },
  {
    id: 'cloud',
    name: 'Cloud & Stockage',
    icon: '☁️',
    color: '#319795',
    examples: ['iCloud', 'Google Drive', 'Dropbox', 'OneDrive'],
  },
  {
    id: 'other',
    name: 'Autres',
    icon: '📦',
    color: '#718096',
    examples: ['Transport', 'Téléphonie', 'Assurances', 'Banque'],
  },
];

/**
 * Périodes d'abonnement
 */
export const SUBSCRIPTION_PERIODS = [
  { id: 'weekly', name: 'Hebdomadaire', multiplier: 52 },
  { id: 'monthly', name: 'Mensuel', multiplier: 12 },
  { id: 'yearly', name: 'Annuel', multiplier: 1 },
] as const;

/**
 * Devises supportées
 */
export const CURRENCIES = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'Dollar américain' },
  { code: 'GBP', symbol: '£', name: 'Livre sterling' },
] as const;

/**
 * Langues supportées
 */
export const LANGUAGES = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
] as const;

/**
 * Limites de l'application
 */
export const LIMITS = {
  minSalary: 500,
  maxSalary: 50000,
  minAmount: 0.01,
  maxAmount: 10000,
  maxDescriptionLength: 200,
  maxExpensesPerMonth: 500,
  maxSubscriptions: 100,
  maxCategories: 20,
} as const;

/**
 * Configuration des heures de travail
 */
export const WORK_HOURS = {
  defaultHoursPerDay: 8,
  defaultDaysPerWeek: 5,
  defaultWeeksPerYear: 52,
  defaultVacationDays: 25,
  defaultSickDays: 5,
} as const;

/**
 * Couleurs par catégorie de dépense
 */
export const EXPENSE_CATEGORY_COLORS = {
  needs: '#3B82F6',    // Bleu
  wants: '#10B981',    // Vert
  savings: '#8B5CF6',  // Violet
} as const;

/**
 * Configuration des notifications
 */
export const NOTIFICATION_CONFIG = {
  subscriptionReminder: {
    daysBefore: [7, 3, 1],
    defaultTime: '09:00',
  },
  budgetAlert: {
    thresholds: [80, 90, 100], // Pourcentages
  },
  weeklyReport: {
    dayOfWeek: 0, // Dimanche
    time: '19:00',
  },
} as const;

/**
 * Configuration des graphiques
 */
export const CHART_CONFIG = {
  colors: {
    primary: '#3B82F6',
    secondary: '#10B981',
    tertiary: '#8B5CF6',
    warning: '#F59E0B',
    danger: '#EF4444',
    gradient: ['#3B82F6', '#8B5CF6'],
  },
  animation: {
    duration: 800,
    easing: 'easeInOutQuart',
  },
} as const;

/**
 * Messages d'erreur standardisés
 */
export const ERROR_MESSAGES = {
  network: 'Problème de connexion réseau',
  unauthorized: 'Session expirée, veuillez vous reconnecter',
  forbidden: 'Accès non autorisé',
  notFound: 'Ressource non trouvée',
  serverError: 'Erreur serveur, veuillez réessayer',
  unknown: 'Une erreur inattendue s\'est produite',
  validation: 'Données invalides',
  timeout: 'Délai d\'attente dépassé',
} as const;

/**
 * Clés de stockage local
 */
export const STORAGE_KEYS = {
  theme: 'workforit_theme',
  language: 'workforit_language',
  currency: 'workforit_currency',
  onboarding: 'workforit_onboarding_completed',
  lastSync: 'workforit_last_sync',
  offlineData: 'workforit_offline_data',
} as const;

/**
 * Configuration Analytics
 */
export const ANALYTICS_EVENTS = {
  app: {
    launched: 'app_launched',
    backgrounded: 'app_backgrounded',
    crashed: 'app_crashed',
  },
  auth: {
    login: 'user_login',
    register: 'user_register',
    logout: 'user_logout',
    passwordReset: 'password_reset',
  },
  budget: {
    created: 'budget_created',
    updated: 'budget_updated',
    methodChanged: 'budget_method_changed',
  },
  expense: {
    added: 'expense_added',
    edited: 'expense_edited',
    deleted: 'expense_deleted',
    categoryChanged: 'expense_category_changed',
  },
  subscription: {
    added: 'subscription_added',
    edited: 'subscription_edited',
    cancelled: 'subscription_cancelled',
    renewed: 'subscription_renewed',
  },
} as const;

/**
 * Regex patterns
 */
export const REGEX_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^(?:(?:\+33|0)[1-9](?:[0-9]{8}))$/,
  amount: /^\d+(?:[.,]\d{1,2})?$/,
  positiveNumber: /^[1-9]\d*$/,
  slug: /^[a-z0-9-]+$/,
} as const;

/**
 * Configuration des icônes par défaut
 */
export const DEFAULT_ICONS = {
  expense: '💸',
  subscription: '💳',
  budget: '💰',
  savings: '🏦',
  analytics: '📊',
  profile: '👤',
  settings: '⚙️',
  notification: '🔔',
  success: '✅',
  warning: '⚠️',
  error: '❌',
  info: 'ℹ️',
} as const;