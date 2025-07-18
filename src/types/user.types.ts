// src/types/user.types.ts
export interface User {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
  settings: UserSettings;
}

export interface UserSettings {
  currency: 'EUR' | 'USD' | 'GBP';
  darkMode: boolean;
  notifications: boolean;
  language: 'fr' | 'en';
  budgetMethod: string;
}