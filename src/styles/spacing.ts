/ src/styles/spacing.ts
export const spacing = {
  tiny: scale(isTinyScreen ? 2 : 4),
  small: scale(isTinyScreen ? 6 : 8),
  medium: scale(isTinyScreen ? 10 : 12),
  regular: scale(isTinyScreen ? 12 : 16),
  large: scale(isTinyScreen ? 16 : 20),
  xlarge: scale(isTinyScreen ? 20 : 24),
  xxlarge: scale(isTinyScreen ? 24 : 32),
  huge: scale(isTinyScreen ? 32 : 40),
  massive: scale(isTinyScreen ? 40 : 48),
};

export const borderRadius = {
  small: 4,
  medium: 8,
  large: 12,
  xlarge: 16,
  round: 9999,
};

// Interface principale du thème
export interface Theme {
  colors: typeof lightColors;
  fontSizes: typeof fontSizes;
  fontWeights: typeof fontWeights;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  isDark: boolean;
}

export const lightTheme: Theme = {
  colors: lightColors,
  fontSizes,
  fontWeights,
  spacing,
  borderRadius,
  isDark: false,
};

export const darkTheme: Theme = {
  colors: darkColors,
  fontSizes,
  fontWeights,
  spacing,
  borderRadius,
  isDark: true,
};