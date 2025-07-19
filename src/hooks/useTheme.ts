// src/hooks/useTheme.ts
import { useAppSelector } from '../store/hooks';

// Thème simple intégré
const lightTheme = {
  colors: {
    primary: '#2563eb',
    primaryLight: '#3b82f6',
    background: '#f9fafb',
    surface: '#ffffff',
    text: '#1f2937',
    textSecondary: '#6b7280',
    textTertiary: '#9ca3af',
    border: '#e5e7eb',
    borderLight: '#f3f4f6',
    success: '#10b981',
    successLight: '#d1fae5',
    warning: '#f59e0b',
    warningLight: '#fef3c7',
    danger: '#ef4444',
    dangerLight: '#fee2e2',
    needs: '#10b981',
    wants: '#f59e0b',
    savings: '#3b82f6',
    shadow: '#000000',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  spacing: {
    tiny: 4,
    small: 8,
    medium: 16,
    large: 24,
    xlarge: 32,
    huge: 48,
  },
  fontSizes: {
    tiny: 10,
    small: 12,
    regular: 14,
    medium: 16,
    large: 18,
    xlarge: 24,
    huge: 32,
  },
  fontWeights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  borderRadius: {
    small: 4,
    medium: 8,
    large: 12,
  },
  isDark: false,
};

const darkTheme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    primary: '#3b82f6',
    primaryLight: '#1d4ed8',
    background: '#111827',
    surface: '#1f2937',
    text: '#f9fafb',
    textSecondary: '#d1d5db',
    textTertiary: '#9ca3af',
    border: '#374151',
    borderLight: '#4b5563',
    shadow: '#000000',
    overlay: 'rgba(0, 0, 0, 0.8)',
  },
  isDark: true,
};

export const useTheme = () => {
  const darkMode = useAppSelector(state => state.settings.settings.darkMode);
  const theme = darkMode ? darkTheme : lightTheme;

  return {
    theme,
    isDark: darkMode,
  };
};

// Export des thèmes pour utilisation directe
export { lightTheme, darkTheme };