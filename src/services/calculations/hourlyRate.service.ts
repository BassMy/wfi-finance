// src/services/hourlyRate.service.ts

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface HourlyRate {
  id: string;
  clientId?: string;
  projectId?: string;
  serviceName: string;
  baseRate: number;
  currency: string;
  isDefault: boolean;
  multipliers?: {
    overtime?: number; // Multiplicateur pour les heures supplémentaires
    weekend?: number;  // Multiplicateur pour le weekend
    holiday?: number;  // Multiplicateur pour les jours fériés
    rush?: number;     // Multiplicateur pour les projets urgents
  };
  validFrom: Date;
  validTo?: Date;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeEntry {
  id: string;
  rateId: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  breakDuration?: number; // en minutes
  description: string;
  isOvertime?: boolean;
  isWeekend?: boolean;
  isHoliday?: boolean;
  isRush?: boolean;
  status: 'draft' | 'submitted' | 'approved' | 'paid';
  invoiceId?: string;
}

export interface RateCalculation {
  baseHours: number;
  overtimeHours: number;
  baseAmount: number;
  overtimeAmount: number;
  weekendAmount: number;
  holidayAmount: number;
  rushAmount: number;
  totalAmount: number;
  effectiveRate: number;
}

const STORAGE_KEYS = {
  HOURLY_RATES: '@hourly_rates',
  TIME_ENTRIES: '@time_entries',
  RATE_SETTINGS: '@rate_settings',
};

export interface RateSettings {
  defaultCurrency: string;
  overtimeThreshold: number; // Heures par jour avant les heures supplémentaires
  weeklyOvertimeThreshold: number; // Heures par semaine avant les heures supplémentaires
  autoCalculateOvertime: boolean;
  defaultMultipliers: {
    overtime: number;
    weekend: number;
    holiday: number;
    rush: number;
  };
}

export class HourlyRateService {
  private static rates: HourlyRate[] = [];
  private static timeEntries: TimeEntry[] = [];
  private static settings: RateSettings = {
    defaultCurrency: 'EUR',
    overtimeThreshold: 8,
    weeklyOvertimeThreshold: 40,
    autoCalculateOvertime: true,
    defaultMultipliers: {
      overtime: 1.5,
      weekend: 1.25,
      holiday: 2.0,
      rush: 1.3,
    },
  };

  /**
   * Initialise le service
   */
  static async initialize(): Promise<void> {
    try {
      await this.loadRates();
      await this.loadTimeEntries();
      await this.loadSettings();
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du service de taux horaires:', error);
    }
  }

  /**
   * Charge les taux depuis le stockage
   */
  private static async loadRates(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.HOURLY_RATES);
      if (data) {
        this.rates = JSON.parse(data).map((rate: any) => ({
          ...rate,
          validFrom: new Date(rate.validFrom),
          validTo: rate.validTo ? new Date(rate.validTo) : undefined,
          createdAt: new Date(rate.createdAt),
          updatedAt: new Date(rate.updatedAt),
        }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des taux:', error);
    }
  }

  /**
   * Charge les entrées de temps depuis le stockage
   */
  private static async loadTimeEntries(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TIME_ENTRIES);
      if (data) {
        this.timeEntries = JSON.parse(data).map((entry: any) => ({
          ...entry,
          date: new Date(entry.date),
          startTime: new Date(entry.startTime),
          endTime: new Date(entry.endTime),
        }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des entrées de temps:', error);
    }
  }

  /**
   * Charge les paramètres depuis le stockage
   */
  private static async loadSettings(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.RATE_SETTINGS);
      if (data) {
        this.settings = { ...this.settings, ...JSON.parse(data) };
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
    }
  }

  /**
   * Sauvegarde les taux
   */
  private static async saveRates(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HOURLY_RATES, JSON.stringify(this.rates));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des taux:', error);
    }
  }

  /**
   * Sauvegarde les entrées de temps
   */
  private static async saveTimeEntries(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TIME_ENTRIES, JSON.stringify(this.timeEntries));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des entrées de temps:', error);
    }
  }

  /**
   * Sauvegarde les paramètres
   */
  private static async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.RATE_SETTINGS, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres:', error);
    }
  }

  /**
   * Crée un nouveau taux horaire
   */
  static async createRate(rateData: Omit<HourlyRate, 'id' | 'createdAt' | 'updatedAt'>): Promise<HourlyRate> {
    // Si c'est un taux par défaut, désactiver les autres taux par défaut
    if (rateData.isDefault) {
      this.rates.forEach(rate => {
        if (rate.isDefault) {
          rate.isDefault = false;
        }
      });
    }

    const rate: HourlyRate = {
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
      multipliers: this.settings.defaultMultipliers,
      ...rateData,
    };

    this.rates.push(rate);
    await this.saveRates();
    return rate;
  }

  /**
   * Met à jour un taux horaire
   */
  static async updateRate(id: string, updates: Partial<Omit<HourlyRate, 'id' | 'createdAt'>>): Promise<HourlyRate | null> {
    const index = this.rates.findIndex(rate => rate.id === id);
    if (index === -1) return null;

    // Si on définit ce taux comme par défaut, désactiver les autres
    if (updates.isDefault) {
      this.rates.forEach(rate => {
        if (rate.id !== id && rate.isDefault) {
          rate.isDefault = false;
        }
      });
    }

    this.rates[index] = {
      ...this.rates[index],
      ...updates,
      updatedAt: new Date(),
    };

    await this.saveRates();
    return this.rates[index];
  }

  /**
   * Supprime un taux horaire
   */
  static async deleteRate(id: string): Promise<boolean> {
    const index = this.rates.findIndex(rate => rate.id === id);
    if (index === -1) return false;

    this.rates.splice(index, 1);
    await this.saveRates();
    return true;
  }

  /**
   * Obtient tous les taux horaires
   */
  static getRates(): HourlyRate[] {
    return [...this.rates];
  }

  /**
   * Obtient le taux par défaut
   */
  static getDefaultRate(): HourlyRate | null {
    return this.rates.find(rate => rate.isDefault) || null;
  }

  /**
   * Obtient les taux actifs pour une date donnée
   */
  static getActiveRates(date: Date = new Date()): HourlyRate[] {
    return this.rates.filter(rate => {
      const isAfterValidFrom = date >= rate.validFrom;
      const isBeforeValidTo = !rate.validTo || date <= rate.validTo;
      return isAfterValidFrom && isBeforeValidTo;
    });
  }

  /**
   * Trouve le meilleur taux pour un client/projet spécifique
   */
  static findBestRate(clientId?: string, projectId?: string, date: Date = new Date()): HourlyRate | null {
    const activeRates = this.getActiveRates(date);

    // Priorité 1: Taux spécifique au projet
    if (projectId) {
      const projectRate = activeRates.find(rate => rate.projectId === projectId);
      if (projectRate) return projectRate;
    }

    // Priorité 2: Taux spécifique au client
    if (clientId) {
      const clientRate = activeRates.find(rate => rate.clientId === clientId && !rate.projectId);
      if (clientRate) return clientRate;
    }

    // Priorité 3: Taux par défaut
    const defaultRate = activeRates.find(rate => rate.isDefault);
    if (defaultRate) return defaultRate;

    // Aucun taux trouvé
    return null;
  }

  /**
   * Ajoute une entrée de temps
   */
  static async addTimeEntry(entryData: Omit<TimeEntry, 'id'>): Promise<TimeEntry> {
    const entry: TimeEntry = {
      id: Date.now().toString(),
      ...entryData,
    };

    this.timeEntries.push(entry);
    await this.saveTimeEntries();
    return entry;
  }

  /**
   * Met à jour une entrée de temps
   */
  static async updateTimeEntry(id: string, updates: Partial<Omit<TimeEntry, 'id'>>): Promise<TimeEntry | null> {
    const index = this.timeEntries.findIndex(entry => entry.id === id);
    if (index === -1) return null;

    this.timeEntries[index] = {
      ...this.timeEntries[index],
      ...updates,
    };

    await this.saveTimeEntries();
    return this.timeEntries[index];
  }

  /**
   * Supprime une entrée de temps
   */
  static async deleteTimeEntry(id: string): Promise<boolean> {
    const index = this.timeEntries.findIndex(entry => entry.id === id);
    if (index === -1) return false;

    this.timeEntries.splice(index, 1);
    await this.saveTimeEntries();
    return true;
  }

  /**
   * Obtient les entrées de temps pour une période
   */
  static getTimeEntries(startDate?: Date, endDate?: Date): TimeEntry[] {
    let entries = [...this.timeEntries];

    if (startDate) {
      entries = entries.filter(entry => entry.date >= startDate);
    }

    if (endDate) {
      entries = entries.filter(entry => entry.date <= endDate);
    }

    return entries.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Calcule la durée d'une entrée de temps en heures
   */
  static calculateDuration(entry: TimeEntry): number {
    const durationMs = entry.endTime.getTime() - entry.startTime.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    const breakHours = (entry.breakDuration || 0) / 60;
    return Math.max(0, durationHours - breakHours);
  }

  /**
   * Obtient les multiplicateurs sûrs pour un taux donné
   */
  private static getSafeMultipliers(rate: HourlyRate): {
    overtime: number;
    weekend: number;
    holiday: number;
    rush: number;
  } {
    const defaultMultipliers = this.settings.defaultMultipliers;
    
    return {
      overtime: rate.multipliers?.overtime ?? defaultMultipliers.overtime,
      weekend: rate.multipliers?.weekend ?? defaultMultipliers.weekend,
      holiday: rate.multipliers?.holiday ?? defaultMultipliers.holiday,
      rush: rate.multipliers?.rush ?? defaultMultipliers.rush,
    };
  }

  /**
   * Calcule le montant pour une entrée de temps
   */
  static calculateEntryAmount(entry: TimeEntry): RateCalculation {
    const rate = this.rates.find(r => r.id === entry.rateId);
    if (!rate) {
      throw new Error('Taux horaire non trouvé');
    }

    const duration = this.calculateDuration(entry);
    let baseHours = duration;
    let overtimeHours = 0;

    // Calculer les heures supplémentaires si activé
    if (this.settings.autoCalculateOvertime && duration > this.settings.overtimeThreshold) {
      baseHours = this.settings.overtimeThreshold;
      overtimeHours = duration - this.settings.overtimeThreshold;
    }

    // Utiliser les multiplicateurs sûrs
    const multipliers = this.getSafeMultipliers(rate);

    // Calculs de base
    let baseAmount = baseHours * rate.baseRate;
    let overtimeAmount = 0;
    let weekendAmount = 0;
    let holidayAmount = 0;
    let rushAmount = 0;

    // Appliquer les multiplicateurs
    if (entry.isOvertime || overtimeHours > 0) {
      overtimeAmount = overtimeHours * rate.baseRate * multipliers.overtime;
    }

    if (entry.isWeekend) {
      const weekendMultiplier = multipliers.weekend - 1; // -1 car le taux de base est déjà inclus
      weekendAmount = duration * rate.baseRate * weekendMultiplier;
    }

    if (entry.isHoliday) {
      const holidayMultiplier = multipliers.holiday - 1;
      holidayAmount = duration * rate.baseRate * holidayMultiplier;
    }

    if (entry.isRush) {
      const rushMultiplier = multipliers.rush - 1;
      rushAmount = duration * rate.baseRate * rushMultiplier;
    }

    const totalAmount = baseAmount + overtimeAmount + weekendAmount + holidayAmount + rushAmount;
    const effectiveRate = duration > 0 ? totalAmount / duration : rate.baseRate;

    return {
      baseHours,
      overtimeHours,
      baseAmount,
      overtimeAmount,
      weekendAmount,
      holidayAmount,
      rushAmount,
      totalAmount,
      effectiveRate,
    };
  }

  /**
   * Calcule le total pour plusieurs entrées de temps
   */
  static calculateTotalAmount(entries: TimeEntry[]): {
    totalHours: number;
    totalAmount: number;
    averageRate: number;
    breakdown: RateCalculation[];
  } {
    const breakdown = entries.map(entry => this.calculateEntryAmount(entry));
    
    const totalHours = entries.reduce((sum, entry) => sum + this.calculateDuration(entry), 0);
    const totalAmount = breakdown.reduce((sum, calc) => sum + calc.totalAmount, 0);
    const averageRate = totalHours > 0 ? totalAmount / totalHours : 0;

    return {
      totalHours,
      totalAmount,
      averageRate,
      breakdown,
    };
  }

  /**
   * Obtient les statistiques de revenus
   */
  static getRevenueStats(startDate: Date, endDate: Date): {
    totalRevenue: number;
    totalHours: number;
    averageHourlyRate: number;
    entriesCount: number;
    byStatus: { [status: string]: { amount: number; hours: number; count: number } };
    byRate: { [rateId: string]: { amount: number; hours: number; count: number; rateName: string } };
  } {
    const entries = this.getTimeEntries(startDate, endDate);
    const calculations = entries.map(entry => ({
      entry,
      calculation: this.calculateEntryAmount(entry),
    }));

    const totalRevenue = calculations.reduce((sum, calc) => sum + calc.calculation.totalAmount, 0);
    const totalHours = calculations.reduce((sum, calc) => sum + this.calculateDuration(calc.entry), 0);
    const averageHourlyRate = totalHours > 0 ? totalRevenue / totalHours : 0;

    // Statistiques par statut
    const byStatus: { [status: string]: { amount: number; hours: number; count: number } } = {};
    calculations.forEach(calc => {
      const status = calc.entry.status;
      if (!byStatus[status]) {
        byStatus[status] = { amount: 0, hours: 0, count: 0 };
      }
      byStatus[status].amount += calc.calculation.totalAmount;
      byStatus[status].hours += this.calculateDuration(calc.entry);
      byStatus[status].count += 1;
    });

    // Statistiques par taux
    const byRate: { [rateId: string]: { amount: number; hours: number; count: number; rateName: string } } = {};
    calculations.forEach(calc => {
      const rateId = calc.entry.rateId;
      const rate = this.rates.find(r => r.id === rateId);
      if (!byRate[rateId]) {
        byRate[rateId] = {
          amount: 0,
          hours: 0,
          count: 0,
          rateName: rate?.serviceName || 'Taux inconnu',
        };
      }
      byRate[rateId].amount += calc.calculation.totalAmount;
      byRate[rateId].hours += this.calculateDuration(calc.entry);
      byRate[rateId].count += 1;
    });

    return {
      totalRevenue,
      totalHours,
      averageHourlyRate,
      entriesCount: entries.length,
      byStatus,
      byRate,
    };
  }

  /**
   * Met à jour les paramètres
   */
  static async updateSettings(newSettings: Partial<RateSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveSettings();
  }

  /**
   * Obtient les paramètres actuels
   */
  static getSettings(): RateSettings {
    return { ...this.settings };
  }

  /**
   * Exporte les données de taux horaires
   */
  static exportData(): {
    rates: HourlyRate[];
    timeEntries: TimeEntry[];
    settings: RateSettings;
  } {
    return {
      rates: [...this.rates],
      timeEntries: [...this.timeEntries],
      settings: { ...this.settings },
    };
  }

  /**
   * Importe les données de taux horaires
   */
  static async importData(data: {
    rates?: HourlyRate[];
    timeEntries?: TimeEntry[];
    settings?: RateSettings;
  }): Promise<void> {
    if (data.rates) {
      this.rates = data.rates;
      await this.saveRates();
    }

    if (data.timeEntries) {
      this.timeEntries = data.timeEntries;
      await this.saveTimeEntries();
    }

    if (data.settings) {
      this.settings = { ...this.settings, ...data.settings };
      await this.saveSettings();
    }
  }
}