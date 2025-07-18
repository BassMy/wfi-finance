// src/styles/theme.ts
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Système responsive
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

export const scale = (size: number) => {
  const newSize = (width / guidelineBaseWidth) * size;
  return Math.max(Math.min(newSize, size * 1.3), size * 0.8);
};

export const verticalScale = (size: number) => {
  const newSize = (height / guidelineBaseHeight) * size;
  return Math.max(Math.min(newSize, size * 1.3), size * 0.8);
};

export const moderateScale = (size: number, factor = 0.5) => 
  size + (scale(size) - size) * factor;

// Détection de petits écrans
export const isSmallScreen = width < 360 || height < 640;
export const isTinyScreen = width < 320;

// Définition du type Theme
export interface Theme {
  isDark: any;
  colors: {
    dangerLight: any;
    successLight: any;
    warningLight: any;
    primaryLight: any;
    overlay: any;
    purple: any;
    // Couleurs principales
    primary: string;
    secondary: string;
    accent: string;
    
    // Couleurs de budget
    needs: string;
    wants: string;
    savings: string;
    
    // Couleurs d'état
    success: string;
    warning: string;
    danger: string;
    info: string;
    
    // Couleurs de surface
    background: string;
    surface: string;
    card: string;
    
    // Couleurs de bordure
    border: string;
    borderLight: string;
    
    // Couleurs de texte
    text: string;
    textSecondary: string;
    textTertiary: string;
    textOnPrimary: string;
    
    // Couleurs d'ombre
    shadow: string;
  };
  
  fontSizes: {
    massive: any;
    huge: any;
    tiny: number;
    small: number;
    regular: number;
    medium: number;
    large: number;
    xlarge: number;
    xxlarge: number;
  };
  
  fontWeights: {
    light: '300';
    regular: '400';
    medium: '500';
    semibold: '600';
    bold: '700';
  };
  
  spacing: {
    huge: DimensionValue | undefined;
    regular: any;
    tiny: number;
    small: number;
    medium: number;
    large: number;
    xlarge: number;
    xxlarge: number;
  };
  
  borderRadius: {
    small: number;
    medium: number;
    large: number;
    xlarge: number;
    round: number;
  };
}

// Thème clair
export const lightTheme: Theme = {
  colors: {
    // Couleurs principales
    primary: '#007AFF',
    secondary: '#5856D6',
    accent: '#FF3B30',
    
    // Couleurs de budget
    needs: '#34C759',      // Vert pour les besoins
    wants: '#FF9500',      // Orange pour les envies
    savings: '#007AFF',    // Bleu pour l'épargne
    
    // Couleurs d'état
    success: '#34C759',
    warning: '#FF9500',
    danger: '#FF3B30',
    info: '#007AFF',
    
    // Couleurs de surface
    background: '#F2F2F7',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    
    // Couleurs de bordure
    border: '#C7C7CC',
    borderLight: '#E5E5EA',
    
    // Couleurs de texte
    text: '#000000',
    textSecondary: '#3C3C43',
    textTertiary: '#8E8E93',
    textOnPrimary: '#FFFFFF',
    
    // Couleurs d'ombre
    shadow: '#000000',
  },
  
  fontSizes: {
    tiny: moderateScale(10),
    small: moderateScale(12),
    regular: moderateScale(14),
    medium: moderateScale(16),
    large: moderateScale(18),
    xlarge: moderateScale(20),
    xxlarge: moderateScale(24),
  },
  
  fontWeights: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  spacing: {
    tiny: scale(4),
    small: scale(8),
    medium: scale(16),
    large: scale(24),
    xlarge: scale(32),
    xxlarge: scale(48),
  },
  
  borderRadius: {
    small: scale(4),
    medium: scale(8),
    large: scale(12),
    xlarge: scale(16),
    round: scale(50),
  },
};

// Thème sombre
export const darkTheme: Theme = {
  colors: {
    // Couleurs principales
    primary: '#0A84FF',
    secondary: '#5E5CE6',
    accent: '#FF453A',
    
    // Couleurs de budget
    needs: '#30D158',      // Vert pour les besoins
    wants: '#FF9F0A',      // Orange pour les envies
    savings: '#0A84FF',    // Bleu pour l'épargne
    
    // Couleurs d'état
    success: '#30D158',
    warning: '#FF9F0A',
    danger: '#FF453A',
    info: '#0A84FF',
    
    // Couleurs de surface
    background: '#000000',
    surface: '#1C1C1E',
    card: '#2C2C2E',
    
    // Couleurs de bordure
    border: '#38383A',
    borderLight: '#48484A',
    
    // Couleurs de texte
    text: '#FFFFFF',
    textSecondary: '#EBEBF5',
    textTertiary: '#8E8E93',
    textOnPrimary: '#FFFFFF',
    
    // Couleurs d'ombre
    shadow: '#000000',
  },
  
  fontSizes: {
    tiny: moderateScale(10),
    small: moderateScale(12),
    regular: moderateScale(14),
    medium: moderateScale(16),
    large: moderateScale(18),
    xlarge: moderateScale(20),
    xxlarge: moderateScale(24),
  },
  
  fontWeights: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  spacing: {
    tiny: scale(4),
    small: scale(8),
    medium: scale(16),
    large: scale(24),
    xlarge: scale(32),
    xxlarge: scale(48),
  },
  
  borderRadius: {
    small: scale(4),
    medium: scale(8),
    large: scale(12),
    xlarge: scale(16),
    round: scale(50),
  },
};

// Export par défaut du thème clair
export default lightTheme;