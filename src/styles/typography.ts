// src/styles/typography.ts
export const fontSizes = {
  tiny: moderateScale(isTinyScreen ? 8 : isSmallScreen ? 9 : 10),
  small: moderateScale(isTinyScreen ? 10 : isSmallScreen ? 11 : 12),
  medium: moderateScale(isTinyScreen ? 12 : isSmallScreen ? 13 : 14),
  regular: moderateScale(isTinyScreen ? 14 : isSmallScreen ? 15 : 16),
  large: moderateScale(isTinyScreen ? 16 : isSmallScreen ? 17 : 18),
  xlarge: moderateScale(isTinyScreen ? 18 : isSmallScreen ? 19 : 20),
  xxlarge: moderateScale(isTinyScreen ? 20 : isSmallScreen ? 22 : 24),
  huge: moderateScale(isTinyScreen ? 24 : isSmallScreen ? 26 : 28),
  massive: moderateScale(isTinyScreen ? 28 : isSmallScreen ? 30 : 32),
};

export const fontWeights = {
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const lineHeights = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.75,
};