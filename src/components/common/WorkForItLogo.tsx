// src/components/common/WorkForItLogo.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Theme, lightTheme } from '../../styles/theme';

interface WorkForItLogoProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  variant?: 'full' | 'icon' | 'text';
  color?: string;
  showTagline?: boolean;
  animated?: boolean;
  theme?: Theme;
  style?: ViewStyle;
}

export const WorkForItLogo: React.FC<WorkForItLogoProps> = ({
  size = 'medium',
  variant = 'full',
  color,
  showTagline = false,
  animated = false,
  theme = lightTheme,
  style,
}) => {
  const styles = createLogoStyles(theme, size);

  const getSizes = () => {
    switch (size) {
      case 'small':
        return {
          iconSize: 32,
          textSize: theme.fontSizes.regular,
          taglineSize: theme.fontSizes.small,
          spacing: theme.spacing.small,
        };
      case 'large':
        return {
          iconSize: 80,
          textSize: theme.fontSizes.huge,
          taglineSize: theme.fontSizes.regular,
          spacing: theme.spacing.large,
        };
      case 'xlarge':
        return {
          iconSize: 120,
          textSize: theme.fontSizes.massive,
          taglineSize: theme.fontSizes.large,
          spacing: theme.spacing.xlarge,
        };
      default: // medium
        return {
          iconSize: 60,
          textSize: theme.fontSizes.xlarge,
          taglineSize: theme.fontSizes.medium,
          spacing: theme.spacing.medium,
        };
    }
  };

  const sizes = getSizes();
  const logoColor = color || theme.colors.primary;

  // Icône SVG simplifiée avec des caractères
  const renderIcon = () => (
    <View style={[
      styles.iconContainer,
      {
        width: sizes.iconSize,
        height: sizes.iconSize,
        borderRadius: sizes.iconSize / 2,
      }
    ]}>
      <Text style={[
        styles.iconEmoji,
        { fontSize: sizes.iconSize * 0.6 }
      ]}>
        💼
      </Text>
      
      {/* Effet de brillance */}
      <View style={[
        styles.iconShine,
        {
          width: sizes.iconSize * 0.3,
          height: sizes.iconSize * 0.8,
          borderRadius: sizes.iconSize * 0.15,
        }
      ]} />
    </View>
  );

  // Version alternative avec des formes géométriques
  const renderGeometricIcon = () => (
    <View style={[
      styles.geometricIcon,
      {
        width: sizes.iconSize,
        height: sizes.iconSize,
      }
    ]}>
      {/* Cercle principal */}
      <View style={[
        styles.mainCircle,
        {
          width: sizes.iconSize,
          height: sizes.iconSize,
          borderRadius: sizes.iconSize / 2,
          backgroundColor: logoColor,
        }
      ]}>
        {/* Dollar/Euro sign stylisé */}
        <View style={styles.currencyContainer}>
          <View style={[
            styles.currencyLine,
            {
              width: sizes.iconSize * 0.4,
              height: 3,
              backgroundColor: '#FFFFFF',
            }
          ]} />
          <View style={[
            styles.currencyLine,
            {
              width: sizes.iconSize * 0.5,
              height: 3,
              backgroundColor: '#FFFFFF',
              marginTop: sizes.iconSize * 0.15,
            }
          ]} />
          <View style={[
            styles.currencyLine,
            {
              width: sizes.iconSize * 0.4,
              height: 3,
              backgroundColor: '#FFFFFF',
              marginTop: sizes.iconSize * 0.15,
            }
          ]} />
        </View>
        
        {/* Petits points décoratifs */}
        <View style={[
          styles.decorativeDot,
          {
            width: sizes.iconSize * 0.08,
            height: sizes.iconSize * 0.08,
            borderRadius: sizes.iconSize * 0.04,
            top: sizes.iconSize * 0.2,
            right: sizes.iconSize * 0.2,
          }
        ]} />
        <View style={[
          styles.decorativeDot,
          {
            width: sizes.iconSize * 0.06,
            height: sizes.iconSize * 0.06,
            borderRadius: sizes.iconSize * 0.03,
            bottom: sizes.iconSize * 0.25,
            left: sizes.iconSize * 0.25,
          }
        ]} />
      </View>
    </View>
  );

  const renderText = () => (
    <View style={styles.textContainer}>
      <Text style={[
        styles.logoText,
        {
          fontSize: sizes.textSize,
          color: logoColor,
        }
      ]}>
        Work<Text style={styles.logoTextSecondary}>For</Text>It
      </Text>
      
      {showTagline && (
        <Text style={[
          styles.tagline,
          {
            fontSize: sizes.taglineSize,
          }
        ]}>
          Maîtrisez vos finances intelligemment
        </Text>
      )}
    </View>
  );

  const renderFullLogo = () => (
    <View style={[styles.fullLogoContainer, { gap: sizes.spacing }]}>
      {renderIcon()}
      {renderText()}
    </View>
  );

  const renderAnimatedLogo = () => {
    // Pour une vraie animation, on utiliserait Animated.Value
    // Ici on simule avec des styles
    return (
      <View style={[styles.animatedContainer, style]}>
        {variant === 'full' && renderFullLogo()}
        {variant === 'icon' && renderIcon()}
        {variant === 'text' && renderText()}
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {animated ? renderAnimatedLogo() : (
        <>
          {variant === 'full' && renderFullLogo()}
          {variant === 'icon' && renderIcon()}
          {variant === 'text' && renderText()}
        </>
      )}
    </View>
  );
};

// Version compacte pour les headers
export const CompactLogo: React.FC<{
  theme: Theme;
  showText?: boolean;
}> = ({ theme, showText = true }) => (
  <View style={{
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.small,
  }}>
    <WorkForItLogo
      size="small"
      variant="icon"
      theme={theme}
    />
    {showText && (
      <Text style={{
        fontSize: theme.fontSizes.large,
        fontWeight: theme.fontWeights.bold,
        color: theme.colors.primary,
      }}>
        WorkForIt
      </Text>
    )}
  </View>
);

// Version pour splash screen
export const SplashLogo: React.FC<{
  theme: Theme;
}> = ({ theme }) => (
  <View style={{
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  }}>
    <WorkForItLogo
      size="xlarge"
      variant="full"
      showTagline={true}
      animated={true}
      theme={theme}
    />
    
    <View style={{
      marginTop: theme.spacing.huge,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.medium,
    }}>
      <View style={{
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: theme.colors.primary,
      }} />
      <Text style={{
        fontSize: theme.fontSizes.small,
        color: theme.colors.textSecondary,
        fontWeight: theme.fontWeights.medium,
      }}>
        Chargement...
      </Text>
      <View style={{
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: theme.colors.primary,
      }} />
    </View>
  </View>
);

// Version pour les emails et exports
export const EmailLogo: React.FC<{
  theme: Theme;
}> = ({ theme }) => (
  <View style={{
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.large,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  }}>
    <WorkForItLogo
      size="medium"
      variant="full"
      theme={theme}
    />
    <Text style={{
      fontSize: theme.fontSizes.small,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.medium,
      textAlign: 'center',
    }}>
      Rapport généré par WorkForIt
    </Text>
  </View>
);

const createLogoStyles = (theme: Theme, size: string) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    fullLogoContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    animatedContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    iconContainer: {
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    
    iconEmoji: {
      textAlign: 'center',
    },
    
    iconShine: {
      position: 'absolute',
      top: '10%',
      left: '20%',
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      transform: [{ rotate: '45deg' }],
    },
    
    geometricIcon: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    mainCircle: {
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    
    currencyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    currencyLine: {
      borderRadius: 1.5,
    },
    
    decorativeDot: {
      position: 'absolute',
      backgroundColor: 'rgba(255, 255, 255, 0.7)',
    },
    
    textContainer: {
      alignItems: 'center',
    },
    
    logoText: {
      fontWeight: theme.fontWeights.bold,
      letterSpacing: 1,
      textAlign: 'center',
    },
    
    logoTextSecondary: {
      color: theme.colors.textSecondary,
      fontWeight: theme.fontWeights.regular,
    },
    
    tagline: {
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: theme.spacing.small,
      fontStyle: 'italic',
    },
  });