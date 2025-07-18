// src/utils/validation.ts

/**
 * Validation d'adresse email
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validation de mot de passe
 */
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 6) {
    errors.push('Au moins 6 caractères');
  }
  
  if (!/[A-Za-z]/.test(password)) {
    errors.push('Au moins une lettre');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Au moins un chiffre');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validation de montant financier
 */
export const validateAmount = (amount: string | number): { isValid: boolean; error?: string } => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return { isValid: false, error: 'Montant invalide' };
  }
  
  if (numAmount < 0) {
    return { isValid: false, error: 'Le montant ne peut pas être négatif' };
  }
  
  if (numAmount > 1000000) {
    return { isValid: false, error: 'Montant trop élevé (max: 1 000 000)' };
  }
  
  return { isValid: true };
};

/**
 * Validation de nom/prénom
 */
export const validateName = (name: string): { isValid: boolean; error?: string } => {
  const trimmedName = name.trim();
  
  if (!trimmedName) {
    return { isValid: false, error: 'Champ requis' };
  }
  
  if (trimmedName.length < 2) {
    return { isValid: false, error: 'Au moins 2 caractères' };
  }
  
  if (trimmedName.length > 50) {
    return { isValid: false, error: 'Maximum 50 caractères' };
  }
  
  if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(trimmedName)) {
    return { isValid: false, error: 'Caractères non autorisés' };
  }
  
  return { isValid: true };
};

/**
 * Validation de description
 */
export const validateDescription = (description: string): { isValid: boolean; error?: string } => {
  const trimmedDesc = description.trim();
  
  if (!trimmedDesc) {
    return { isValid: false, error: 'Description requise' };
  }
  
  if (trimmedDesc.length < 3) {
    return { isValid: false, error: 'Au moins 3 caractères' };
  }
  
  if (trimmedDesc.length > 200) {
    return { isValid: false, error: 'Maximum 200 caractères' };
  }
  
  return { isValid: true };
};

/**
 * Validation de salaire
 */
export const validateSalary = (salary: string | number): { isValid: boolean; error?: string } => {
  const numSalary = typeof salary === 'string' ? parseFloat(salary) : salary;
  
  if (isNaN(numSalary)) {
    return { isValid: false, error: 'Salaire invalide' };
  }
  
  if (numSalary <= 0) {
    return { isValid: false, error: 'Le salaire doit être positif' };
  }
  
  if (numSalary < 500) {
    return { isValid: false, error: 'Salaire minimum: 500€' };
  }
  
  if (numSalary > 50000) {
    return { isValid: false, error: 'Salaire maximum: 50 000€' };
  }
  
  return { isValid: true };
};

/**
 * Validation de pourcentage
 */
export const validatePercentage = (percentage: number): { isValid: boolean; error?: string } => {
  if (isNaN(percentage)) {
    return { isValid: false, error: 'Pourcentage invalide' };
  }
  
  if (percentage < 0 || percentage > 100) {
    return { isValid: false, error: 'Pourcentage entre 0 et 100' };
  }
  
  return { isValid: true };
};

/**
 * Validation de date
 */
export const validateDate = (date: string): { isValid: boolean; error?: string } => {
  const parsedDate = new Date(date);
  
  if (isNaN(parsedDate.getTime())) {
    return { isValid: false, error: 'Date invalide' };
  }
  
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  
  if (parsedDate < oneYearAgo) {
    return { isValid: false, error: 'Date trop ancienne (max: 1 an)' };
  }
  
  if (parsedDate > oneYearFromNow) {
    return { isValid: false, error: 'Date trop future (max: 1 an)' };
  }
  
  return { isValid: true };
};

/**
 * Validation d'URL
 */
export const validateUrl = (url: string): { isValid: boolean; error?: string } => {
  try {
    new URL(url);
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'URL invalide' };
  }
};

/**
 * Validation de numéro de téléphone français
 */
export const validatePhoneNumber = (phone: string): { isValid: boolean; error?: string } => {
  const phoneRegex = /^(?:(?:\+33|0)[1-9](?:[0-9]{8}))$/;
  
  if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    return { isValid: false, error: 'Numéro de téléphone invalide' };
  }
  
  return { isValid: true };
};

/**
 * Validation de formulaire générique
 */
export const validateForm = (
  fields: Record<string, any>,
  rules: Record<string, (value: any) => { isValid: boolean; error?: string }>
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  let isValid = true;
  
  Object.entries(rules).forEach(([fieldName, validator]) => {
    const result = validator(fields[fieldName]);
    if (!result.isValid) {
      errors[fieldName] = result.error || 'Erreur de validation';
      isValid = false;
    }
  });
  
  return { isValid, errors };
};