// src/services/subscription.service.ts

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  features: string[];
  isPopular?: boolean;
  trialDays?: number;
  maxProjects?: number;
  maxClients?: number;
  maxInvoicesPerMonth?: number;
  hasAdvancedReporting?: boolean;
  hasTimeTracking?: boolean;
  hasExpenseTracking?: boolean;
  hasMultiCurrency?: boolean;
  supportLevel: 'email' | 'priority' | 'dedicated';
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'expired' | 'trial' | 'pending';
  startDate: Date;
  endDate: Date;
  trialEndsAt?: Date;
  autoRenew: boolean;
  paymentMethod?: {
    type: 'card' | 'paypal' | 'bank_transfer';
    last4?: string;
    brand?: string;
  };
  nextBillingDate?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Usage {
  userId: string;
  period: Date; // Premier jour du mois pour les stats mensuelles
  projectsCreated: number;
  clientsCreated: number;
  invoicesGenerated: number;
  hoursTracked: number;
  expensesLogged: number;
  reportsGenerated: number;
  updatedAt: Date;
}

export interface SubscriptionEvent {
  id: string;
  subscriptionId: string;
  type: 'created' | 'updated' | 'cancelled' | 'renewed' | 'payment_failed' | 'trial_started' | 'trial_ended';
  data: any;
  createdAt: Date;
}

const STORAGE_KEYS = {
  SUBSCRIPTION_PLANS: '@subscription_plans',
  USER_SUBSCRIPTION: '@user_subscription',
  USAGE_DATA: '@usage_data',
  SUBSCRIPTION_EVENTS: '@subscription_events',
};

export class SubscriptionService {
  private static plans: SubscriptionPlan[] = [];
  private static userSubscription: UserSubscription | null = null;
  private static usageData: Usage[] = [];
  private static events: SubscriptionEvent[] = [];

  /**
   * Initialise le service avec les plans par défaut
   */
  static async initialize(): Promise<void> {
    try {
      await this.loadPlans();
      await this.loadUserSubscription();
      await this.loadUsageData();
      await this.loadEvents();
      
      // Créer les plans par défaut si aucun n'existe
      if (this.plans.length === 0) {
        await this.createDefaultPlans();
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du service d\'abonnement:', error);
    }
  }

  /**
   * Crée les plans d'abonnement par défaut
   */
  private static async createDefaultPlans(): Promise<void> {
    const defaultPlans: SubscriptionPlan[] = [
      {
        id: 'free',
        name: 'Gratuit',
        description: 'Pour commencer',
        price: 0,
        currency: 'EUR',
        interval: 'monthly',
        features: [
          '3 projets maximum',
          '5 clients maximum',
          '10 factures par mois',
          'Suivi du temps de base',
          'Support par email',
        ],
        maxProjects: 3,
        maxClients: 5,
        maxInvoicesPerMonth: 10,
        hasAdvancedReporting: false,
        hasTimeTracking: true,
        hasExpenseTracking: false,
        hasMultiCurrency: false,
        supportLevel: 'email',
      },
      {
        id: 'starter',
        name: 'Starter',
        description: 'Pour les freelances',
        price: 19,
        currency: 'EUR',
        interval: 'monthly',
        features: [
          'Projets illimités',
          '25 clients maximum',
          '50 factures par mois',
          'Suivi du temps avancé',
          'Suivi des dépenses',
          'Rapports de base',
          'Support prioritaire',
        ],
        isPopular: true,
        trialDays: 14,
        maxProjects: undefined,
        maxClients: 25,
        maxInvoicesPerMonth: 50,
        hasAdvancedReporting: false,
        hasTimeTracking: true,
        hasExpenseTracking: true,
        hasMultiCurrency: false,
        supportLevel: 'priority',
      },
      {
        id: 'professional',
        name: 'Professionnel',
        description: 'Pour les équipes',
        price: 49,
        currency: 'EUR',
        interval: 'monthly',
        features: [
          'Tout du plan Starter',
          'Clients illimités',
          'Factures illimitées',
          'Rapports avancés',
          'Multi-devises',
          'Intégrations avancées',
          'Support dédié',
        ],
        trialDays: 14,
        maxProjects: undefined,
        maxClients: undefined,
        maxInvoicesPerMonth: undefined,
        hasAdvancedReporting: true,
        hasTimeTracking: true,
        hasExpenseTracking: true,
        hasMultiCurrency: true,
        supportLevel: 'dedicated',
      },
      {
        id: 'starter_yearly',
        name: 'Starter (Annuel)',
        description: 'Pour les freelances - 2 mois gratuits',
        price: 190,
        currency: 'EUR',
        interval: 'yearly',
        features: [
          'Tout du plan Starter',
          '2 mois gratuits',
          'Facturation annuelle',
        ],
        trialDays: 14,
        maxProjects: undefined,
        maxClients: 25,
        maxInvoicesPerMonth: 50,
        hasAdvancedReporting: false,
        hasTimeTracking: true,
        hasExpenseTracking: true,
        hasMultiCurrency: false,
        supportLevel: 'priority',
      },
      {
        id: 'professional_yearly',
        name: 'Professionnel (Annuel)',
        description: 'Pour les équipes - 2 mois gratuits',
        price: 490,
        currency: 'EUR',
        interval: 'yearly',
        features: [
          'Tout du plan Professionnel',
          '2 mois gratuits',
          'Facturation annuelle',
        ],
        trialDays: 14,
        maxProjects: undefined,
        maxClients: undefined,
        maxInvoicesPerMonth: undefined,
        hasAdvancedReporting: true,
        hasTimeTracking: true,
        hasExpenseTracking: true,
        hasMultiCurrency: true,
        supportLevel: 'dedicated',
      },
    ];

    this.plans = defaultPlans;
    await this.savePlans();
  }

  /**
   * Charge les plans depuis le stockage
   */
  private static async loadPlans(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTION_PLANS);
      if (data) {
        this.plans = JSON.parse(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des plans:', error);
    }
  }

  /**
   * Charge l'abonnement utilisateur depuis le stockage
   */
  private static async loadUserSubscription(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_SUBSCRIPTION);
      if (data) {
        const subscription = JSON.parse(data);
        this.userSubscription = {
          ...subscription,
          startDate: new Date(subscription.startDate),
          endDate: new Date(subscription.endDate),
          trialEndsAt: subscription.trialEndsAt ? new Date(subscription.trialEndsAt) : undefined,
          nextBillingDate: subscription.nextBillingDate ? new Date(subscription.nextBillingDate) : undefined,
          cancelledAt: subscription.cancelledAt ? new Date(subscription.cancelledAt) : undefined,
          createdAt: new Date(subscription.createdAt),
          updatedAt: new Date(subscription.updatedAt),
        };
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'abonnement utilisateur:', error);
    }
  }

  /**
   * Charge les données d'utilisation depuis le stockage
   */
  private static async loadUsageData(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USAGE_DATA);
      if (data) {
        this.usageData = JSON.parse(data).map((usage: any) => ({
          ...usage,
          period: new Date(usage.period),
          updatedAt: new Date(usage.updatedAt),
        }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données d\'utilisation:', error);
    }
  }

  /**
   * Charge les événements depuis le stockage
   */
  private static async loadEvents(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTION_EVENTS);
      if (data) {
        this.events = JSON.parse(data).map((event: any) => ({
          ...event,
          createdAt: new Date(event.createdAt),
        }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
    }
  }

  /**
   * Sauvegarde les plans
   */
  private static async savePlans(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_PLANS, JSON.stringify(this.plans));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des plans:', error);
    }
  }

  /**
   * Sauvegarde l'abonnement utilisateur
   */
  private static async saveUserSubscription(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_SUBSCRIPTION, JSON.stringify(this.userSubscription));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'abonnement utilisateur:', error);
    }
  }

  /**
   * Sauvegarde les données d'utilisation
   */
  private static async saveUsageData(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USAGE_DATA, JSON.stringify(this.usageData));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données d\'utilisation:', error);
    }
  }

  /**
   * Sauvegarde les événements
   */
  private static async saveEvents(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_EVENTS, JSON.stringify(this.events));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des événements:', error);
    }
  }

  /**
   * Obtient tous les plans disponibles
   */
  static getPlans(): SubscriptionPlan[] {
    return [...this.plans];
  }

  /**
   * Obtient un plan par son ID
   */
  static getPlan(planId: string): SubscriptionPlan | null {
    return this.plans.find(plan => plan.id === planId) || null;
  }

  /**
   * Obtient l'abonnement actuel de l'utilisateur
   */
  static getCurrentSubscription(): UserSubscription | null {
    return this.userSubscription ? { ...this.userSubscription } : null;
  }

  /**
   * Obtient le plan actuel de l'utilisateur
   */
  static getCurrentPlan(): SubscriptionPlan | null {
    if (!this.userSubscription) return this.getPlan('free');
    return this.getPlan(this.userSubscription.planId);
  }

  /**
   * Vérifie si l'utilisateur a accès à une fonctionnalité
   */
  static hasFeatureAccess(feature: keyof Pick<SubscriptionPlan, 
    'hasAdvancedReporting' | 'hasTimeTracking' | 'hasExpenseTracking' | 'hasMultiCurrency'
  >): boolean {
    const currentPlan = this.getCurrentPlan();
    if (!currentPlan) return false;

    const subscription = this.getCurrentSubscription();
    if (subscription && (subscription.status === 'expired' || subscription.status === 'cancelled')) {
      // Accès limité au plan gratuit si l'abonnement est expiré
      const freePlan = this.getPlan('free');
      return freePlan ? freePlan[feature] === true : false;
    }

    return currentPlan[feature] === true;
  }

  /**
   * Vérifie si l'utilisateur peut créer plus de projets/clients/factures
   */
  static canCreateMore(type: 'projects' | 'clients' | 'invoices', currentCount: number): {
    canCreate: boolean;
    limit?: number;
    remaining?: number;
  } {
    const currentPlan = this.getCurrentPlan();
    if (!currentPlan) return { canCreate: false };

    let limit: number | undefined;
    
    switch (type) {
      case 'projects':
        limit = currentPlan.maxProjects;
        break;
      case 'clients':
        limit = currentPlan.maxClients;
        break;
      case 'invoices':
        limit = currentPlan.maxInvoicesPerMonth;
        break;
    }

    if (limit === undefined) {
      return { canCreate: true }; // Illimité
    }

    const canCreate = currentCount < limit;
    const remaining = Math.max(0, limit - currentCount);

    return { canCreate, limit, remaining };
  }

  /**
   * Souscrit à un plan
   */
  static async subscribeToPlan(
    userId: string, 
    planId: string, 
    paymentMethod?: UserSubscription['paymentMethod']
  ): Promise<UserSubscription> {
    const plan = this.getPlan(planId);
    if (!plan) {
      throw new Error('Plan non trouvé');
    }

    const now = new Date();
    const endDate = new Date(now);
    
    if (plan.interval === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Calculer la fin de l'essai si applicable
    let trialEndsAt: Date | undefined;
    let status: UserSubscription['status'] = 'active';
    
    if (plan.trialDays && plan.trialDays > 0) {
      trialEndsAt = new Date(now);
      trialEndsAt.setDate(trialEndsAt.getDate() + plan.trialDays);
      status = 'trial';
    }

    // Calculer la prochaine date de facturation
    let nextBillingDate: Date | undefined;
    if (plan.price > 0) {
      nextBillingDate = trialEndsAt || endDate;
    }

    const subscription: UserSubscription = {
      id: Date.now().toString(),
      userId,
      planId,
      status,
      startDate: now,
      endDate,
      trialEndsAt,
      autoRenew: true,
      paymentMethod,
      nextBillingDate,
      createdAt: now,
      updatedAt: now,
    };

    // Annuler l'ancien abonnement s'il existe
    if (this.userSubscription) {
      await this.cancelSubscription('plan_change');
    }

    this.userSubscription = subscription;
    await this.saveUserSubscription();
    
    // Ajouter un événement
    await this.addEvent(subscription.id, 'created', { planId, trialDays: plan.trialDays });

    return subscription;
  }

  /**
   * Annule l'abonnement
   */
  static async cancelSubscription(reason?: string): Promise<void> {
    if (!this.userSubscription) {
      throw new Error('Aucun abonnement actif');
    }

    this.userSubscription.status = 'cancelled';
    this.userSubscription.cancelledAt = new Date();
    this.userSubscription.cancellationReason = reason;
    this.userSubscription.autoRenew = false;
    this.userSubscription.updatedAt = new Date();

    await this.saveUserSubscription();
    
    // Ajouter un événement
    await this.addEvent(this.userSubscription.id, 'cancelled', { reason });
  }

  /**
   * Renouvelle l'abonnement
   */
  static async renewSubscription(): Promise<void> {
    if (!this.userSubscription) {
      throw new Error('Aucun abonnement actif');
    }

    const plan = this.getPlan(this.userSubscription.planId);
    if (!plan) {
      throw new Error('Plan non trouvé');
    }

    const now = new Date();
    const newEndDate = new Date(this.userSubscription.endDate);
    
    if (plan.interval === 'monthly') {
      newEndDate.setMonth(newEndDate.getMonth() + 1);
    } else {
      newEndDate.setFullYear(newEndDate.getFullYear() + 1);
    }

    this.userSubscription.endDate = newEndDate;
    this.userSubscription.status = 'active';
    this.userSubscription.nextBillingDate = newEndDate;
    this.userSubscription.updatedAt = now;

    await this.saveUserSubscription();
    
    // Ajouter un événement
    await this.addEvent(this.userSubscription.id, 'renewed', { newEndDate });
  }

  /**
   * Met à jour l'utilisation
   */
  static async updateUsage(
    userId: string, 
    updates: Partial<Omit<Usage, 'userId' | 'period' | 'updatedAt'>>
  ): Promise<void> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    let usage = this.usageData.find(u => 
      u.userId === userId && 
      u.period.getTime() === periodStart.getTime()
    );

    if (!usage) {
      usage = {
        userId,
        period: periodStart,
        projectsCreated: 0,
        clientsCreated: 0,
        invoicesGenerated: 0,
        hoursTracked: 0,
        expensesLogged: 0,
        reportsGenerated: 0,
        updatedAt: now,
      };
      this.usageData.push(usage);
    }

    Object.assign(usage, updates, { updatedAt: now });
    await this.saveUsageData();
  }

  /**
   * Obtient l'utilisation pour une période
   */
  static getUsage(userId: string, period?: Date): Usage | null {
    const targetPeriod = period || new Date();
    const periodStart = new Date(targetPeriod.getFullYear(), targetPeriod.getMonth(), 1);
    
    return this.usageData.find(u => 
      u.userId === userId && 
      u.period.getTime() === periodStart.getTime()
    ) || null;
  }

  /**
   * Vérifie le statut de l'abonnement et met à jour si nécessaire
   */
  static async checkSubscriptionStatus(): Promise<void> {
    if (!this.userSubscription) return;

    const now = new Date();
    let hasChanged = false;

    // Vérifier si l'essai est terminé
    if (this.userSubscription.status === 'trial' && 
        this.userSubscription.trialEndsAt && 
        now > this.userSubscription.trialEndsAt) {
      
      this.userSubscription.status = 'active';
      hasChanged = true;
      
      await this.addEvent(this.userSubscription.id, 'trial_ended', {});
    }

    // Vérifier si l'abonnement est expiré
    if (this.userSubscription.status === 'active' && 
        now > this.userSubscription.endDate) {
      
      if (this.userSubscription.autoRenew) {
        try {
          await this.renewSubscription();
        } catch (error) {
          this.userSubscription.status = 'expired';
          hasChanged = true;
          
          await this.addEvent(this.userSubscription.id, 'payment_failed', { error: error.message });
        }
      } else {
        this.userSubscription.status = 'expired';
        hasChanged = true;
      }
    }

    if (hasChanged) {
      this.userSubscription.updatedAt = now;
      await this.saveUserSubscription();
    }
  }

  /**
   * Ajoute un événement d'abonnement
   */
  private static async addEvent(
    subscriptionId: string, 
    type: SubscriptionEvent['type'], 
    data: any
  ): Promise<void> {
    const event: SubscriptionEvent = {
      id: Date.now().toString(),
      subscriptionId,
      type,
      data,
      createdAt: new Date(),
    };

    this.events.push(event);
    await this.saveEvents();
  }

  /**
   * Obtient l'historique des événements
   */
  static getSubscriptionEvents(subscriptionId?: string): SubscriptionEvent[] {
    let events = [...this.events];
    
    if (subscriptionId) {
      events = events.filter(event => event.subscriptionId === subscriptionId);
    }

    return events.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Calcule les statistiques d'utilisation
   */
  static getUsageStats(userId: string): {
    currentPeriod: Usage | null;
    previousPeriod: Usage | null;
    trends: {
      projectsChange: number;
      clientsChange: number;
      invoicesChange: number;
      hoursChange: number;
    };
  } {
    const now = new Date();
    const currentPeriod = this.getUsage(userId, now);
    
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousPeriod = this.getUsage(userId, previousMonth);

    const trends = {
      projectsChange: this.calculateChange(previousPeriod?.projectsCreated || 0, currentPeriod?.projectsCreated || 0),
      clientsChange: this.calculateChange(previousPeriod?.clientsCreated || 0, currentPeriod?.clientsCreated || 0),
      invoicesChange: this.calculateChange(previousPeriod?.invoicesGenerated || 0, currentPeriod?.invoicesGenerated || 0),
      hoursChange: this.calculateChange(previousPeriod?.hoursTracked || 0, currentPeriod?.hoursTracked || 0),
    };

    return {
      currentPeriod,
      previousPeriod,
      trends,
    };
  }

  /**
   * Calcule le pourcentage de changement
   */
  private static calculateChange(previous: number, current: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  }

  /**
   * Exporte les données d'abonnement
   */
  static exportData(): {
    plans: SubscriptionPlan[];
    subscription: UserSubscription | null;
    usage: Usage[];
    events: SubscriptionEvent[];
  } {
    return {
      plans: [...this.plans],
      subscription: this.userSubscription ? { ...this.userSubscription } : null,
      usage: [...this.usageData],
      events: [...this.events],
    };
  }
}