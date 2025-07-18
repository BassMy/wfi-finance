// src/utils/formatting.ts
import { CURRENCIES } from './constants';

/**
 * Formatage de devise
 */
export const formatCurrency = (
  amount: number,
  currency: 'EUR' | 'USD' | 'GBP' = 'EUR',
  options: {
    showSymbol?: boolean;
    decimals?: number;
    compact?: boolean;
  } = {}
): string => {
  const { showSymbol = true, decimals = 2, compact = false } = options;
  
  const currencyInfo = CURRENCIES.find(c => c.code === currency);
  const symbol = currencyInfo?.symbol || '€';
  
  // Formatage compact (1.2k, 1.5M, etc.)
  if (compact && Math.abs(amount) >= 1000) {
    const suffixes = ['', 'k', 'M', 'G'];
    let suffixIndex = 0;
    let formattedAmount = amount;
    
    while (Math.abs(formattedAmount) >= 1000 && suffixIndex < suffixes.length - 1) {
      formattedAmount /= 1000;
      suffixIndex++;
    }
    
    const formatted = formattedAmount.toFixed(1).replace(/\.0$/, '');
    return showSymbol ? `${formatted}${suffixes[suffixIndex]} ${symbol}` : `${formatted}${suffixes[suffixIndex]}`;
  }
  
  // Formatage normal
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
  
  return showSymbol ? `${formatted} ${symbol}` : formatted;
};

/**
 * Formatage de pourcentage
 */
export const formatPercentage = (
  value: number,
  options: {
    decimals?: number;
    showSign?: boolean;
  } = {}
): string => {
  const { decimals = 1, showSign = false } = options;
  
  const formatted = value.toFixed(decimals);
  const sign = showSign && value > 0 ? '+' : '';
  
  return `${sign}${formatted}%`;
};

/**
 * Formatage de date
 */
export const formatDate = (
  date: Date | string,
  format: 'short' | 'medium' | 'long' | 'relative' = 'medium',
  locale: string = 'fr-FR'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Date invalide';
  }
  
  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString(locale, {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      });
      
    case 'long':
      return dateObj.toLocaleDateString(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      
    case 'relative':
      return formatRelativeDate(dateObj);
      
    default: // medium
      return dateObj.toLocaleDateString(locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
  }
};

/**
 * Formatage de date relative (il y a X jours, dans X jours)
 */
export const formatRelativeDate = (date: Date): string => {
  const now = new Date();
  const diffInMs = date.getTime() - now.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    return 'Aujourd\'hui';
  } else if (diffInDays === 1) {
    return 'Demain';
  } else if (diffInDays === -1) {
    return 'Hier';
  } else if (diffInDays > 1 && diffInDays <= 7) {
    return `Dans ${diffInDays} jours`;
  } else if (diffInDays < -1 && diffInDays >= -7) {
    return `Il y a ${Math.abs(diffInDays)} jours`;
  } else if (diffInDays > 7) {
    return formatDate(date, 'medium');
  } else {
    return formatDate(date, 'medium');
  }
};

/**
 * Formatage de temps (durée)
 */
export const formatDuration = (
  minutes: number,
  format: 'short' | 'long' = 'short'
): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (format === 'short') {
    if (hours > 0) {
      return remainingMinutes > 0 ? `${hours}h${remainingMinutes}m` : `${hours}h`;
    }
    return `${remainingMinutes}m`;
  }
  
  // Format long
  const parts: string[] = [];
  if (hours > 0) {
    parts.push(`${hours} heure${hours > 1 ? 's' : ''}`);
  }
  if (remainingMinutes > 0) {
    parts.push(`${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`);
  }
  
  return parts.join(' et ') || '0 minute';
};

/**
 * Formatage de numéro de téléphone
 */
export const formatPhoneNumber = (phone: string): string => {
  // Supprimer tous les caractères non numériques sauf le +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Format français
  if (cleaned.startsWith('+33')) {
    const number = cleaned.slice(3);
    return `+33 ${number.slice(0, 1)} ${number.slice(1, 3)} ${number.slice(3, 5)} ${number.slice(5, 7)} ${number.slice(7, 9)}`;
  }
  
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`;
  }
  
  return phone; // Retourner tel quel si format non reconnu
};

/**
 * Formatage de nom (première lettre en majuscule)
 */
export const formatName = (name: string): string => {
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .trim();
};

/**
 * Formatage d'initiales
 */
export const formatInitials = (firstName: string, lastName: string): string => {
  const first = firstName.charAt(0).toUpperCase();
  const last = lastName.charAt(0).toUpperCase();
  return `${first}${last}`;
};

/**
 * Formatage de taille de fichier
 */
export const formatFileSize = (bytes: number): string => {
  const sizes = ['o', 'Ko', 'Mo', 'Go'];
  if (bytes === 0) return '0 o';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  
  return `${size.toFixed(1)} ${sizes[i]}`;
};

/**
 * Formatage de numéro avec séparateurs de milliers
 */
export const formatNumber = (
  number: number,
  options: {
    decimals?: number;
    separator?: string;
  } = {}
): string => {
  const { decimals = 0, separator = ' ' } = options;
  
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: true,
  }).format(number).replace(/\s/g, separator);
};

/**
 * Formatage de taux horaire
 */
export const formatHourlyRate = (
  rate: number,
  currency: 'EUR' | 'USD' | 'GBP' = 'EUR'
): string => {
  return `${formatCurrency(rate, currency)} / heure`;
};

/**
 * Formatage de période d'abonnement
 */
export const formatSubscriptionPeriod = (period: 'weekly' | 'monthly' | 'yearly'): string => {
  switch (period) {
    case 'weekly':
      return 'par semaine';
    case 'monthly':
      return 'par mois';
    case 'yearly':
      return 'par an';
    default:
      return '';
  }
};

/**
 * Formatage de catégorie d'abonnement
 */
export const formatSubscriptionCategory = (category: string): string => {
  const categoryMap: Record<string, string> = {
    streaming: 'Streaming',
    music: 'Musique',
    software: 'Logiciels',
    fitness: 'Sport & Santé',
    news: 'Actualités',
    gaming: 'Gaming',
    cloud: 'Cloud & Stockage',
    other: 'Autres',
  };
  
  return categoryMap[category] || category;
};

/**
 * Formatage de texte tronqué
 */
export const truncateText = (text: string, maxLength: number = 50): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
};

/**
 * Formatage de slug (URL friendly)
 */
export const formatSlug = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^a-z0-9\s-]/g, '') // Garder uniquement lettres, chiffres, espaces et tirets
    .replace(/\s+/g, '-') // Remplacer espaces par tirets
    .replace(/-+/g, '-') // Supprimer tirets multiples
    .replace(/^-|-$/g, ''); // Supprimer tirets en début/fin
};

/**
 * Formatage de mot de passe (masquage)
 */
export const formatPassword = (password: string, showLast: number = 0): string => {
  if (showLast === 0) {
    return '•'.repeat(password.length);
  }
  
  const masked = '•'.repeat(Math.max(0, password.length - showLast));
  const visible = password.slice(-showLast);
  
  return masked + visible;
};

/**
 * Formatage de statut (première lettre majuscule)
 */
export const formatStatus = (status: string): string => {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

/**
 * Utilitaire pour parser une chaîne de montant
 */
export const parseAmount = (amountString: string): number => {
  // Supprimer tous les caractères non numériques sauf . et ,
  const cleaned = amountString.replace(/[^\d.,]/g, '');
  
  // Remplacer virgule par point pour parseFloat
  const normalized = cleaned.replace(',', '.');
  
  const amount = parseFloat(normalized);
  return isNaN(amount) ? 0 : amount;
};

/**
 * Formatage pour export CSV
 */
export const formatForCSV = (value: any): string => {
  if (value === null || value === undefined) return '';
  
  const stringValue = String(value);
  
  // Échapper les guillemets et entourer de guillemets si nécessaire
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
};