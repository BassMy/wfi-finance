// src/components/common/ProgressBar.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { Theme, lightTheme } from '../../styles/theme';

interface ProgressBarProps {
  percentage: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
  showLabel?: boolean;
  showPercentage?: boolean;
  label?: string;
  animated?: boolean;
  animationDuration?: number;
  theme?: Theme;
  style?: ViewStyle;
  status?: 'safe' | 'warning' | 'danger';
  striped?: boolean;
  rounded?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  height = 8,
  color,
  backgroundColor,
  showLabel = false,
  showPercentage = false,
  label,
  animated = true,
  animationDuration = 800,
  theme = lightTheme,
  style,
  status,
  striped = false,
  rounded = true,
}) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const styles = createProgressBarStyles(theme, height, rounded);

  // Animation de la barre de progression
  useEffect(() => {
    if (animated) {
      Animated.timing(animatedWidth, {
        toValue: Math.max(0, Math.min(100, percentage)),
        duration: animationDuration,
        useNativeDriver: false,
      }).start();
    } else {
      animatedWidth.setValue(Math.max(0, Math.min(100, percentage)));
    }
  }, [percentage, animated, animationDuration]);

  // Déterminer la couleur en fonction du statut
  const getColor = () => {
    if (color) return color;
    
    if (status) {
      switch (status) {
        case 'safe':
          return theme.colors.success;
        case 'warning':
          return theme.colors.warning;
        case 'danger':
          return theme.colors.danger;
        default:
          return theme.colors.primary;
      }
    }

    // Couleur automatique basée sur le pourcentage
    if (percentage <= 60) return theme.colors.success;
    if (percentage <= 80) return theme.colors.warning;
    return theme.colors.danger;
  };

  const getBackgroundColor = () => {
    if (backgroundColor) return backgroundColor;
    return theme.colors.borderLight;
  };

  const progressColor = getColor();
  const bgColor = getBackgroundColor();

  // Animation de pulsation pour les barres critiques
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    if (percentage > 90) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 0.8,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnimation.setValue(1);
    }
  }, [percentage]);

  const renderStripedPattern = () => {
    if (!striped) return null;

    return (
      <View style={styles.stripedPattern}>
        {Array.from({ length: 10 }, (_, index) => (
          <View key={index} style={styles.stripe} />
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* Label et pourcentage */}
      {(showLabel || showPercentage) && (
        <View style={styles.labelContainer}>
          {showLabel && label && (
            <Text style={styles.label}>{label}</Text>
          )}
          {showPercentage && (
            <Text style={[
              styles.percentage,
              { color: progressColor }
            ]}>
              {percentage.toFixed(1)}%
            </Text>
          )}
        </View>
      )}

      {/* Barre de progression */}
      <View style={styles.progressContainer}>
        <View style={[
          styles.progressBackground,
          { backgroundColor: bgColor }
        ]}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                backgroundColor: progressColor,
                width: animatedWidth.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                  extrapolate: 'clamp',
                }),
                transform: [{ scaleY: pulseAnimation }],
              }
            ]}
          >
            {renderStripedPattern()}
          </Animated.View>

          {/* Indicateur de seuil critique */}
          {percentage > 100 && (
            <View style={styles.overflowIndicator}>
              <Text style={styles.overflowText}>!</Text>
            </View>
          )}
        </View>

        {/* Marqueurs de seuil */}
        <View style={styles.thresholds}>
          <View style={[styles.threshold, { left: '80%' }]} />
          <View style={[styles.threshold, { left: '100%' }]} />
        </View>
      </View>

      {/* Indicateurs de statut */}
      {percentage > 100 && (
        <View style={styles.statusContainer}>
          <Text style={styles.overBudgetText}>
            🚨 Dépassement de {(percentage - 100).toFixed(1)}%
          </Text>
        </View>
      )}
      
      {percentage > 80 && percentage <= 100 && (
        <View style={styles.statusContainer}>
          <Text style={styles.warningText}>
            ⚠️ Attention: {(100 - percentage).toFixed(1)}% restant
          </Text>
        </View>
      )}
    </View>
  );
};

// Composant spécialisé pour le budget
export const BudgetProgressBar: React.FC<{
  allocated: number;
  spent: number;
  label: string;
  theme: Theme;
  color?: string;
}> = ({ allocated, spent, label, theme, color }) => {
  const percentage = allocated > 0 ? (spent / allocated) * 100 : 0;
  const remaining = allocated - spent;

  return (
    <View style={{ marginBottom: theme.spacing.medium }}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.small,
      }}>
        <Text style={{
          fontSize: theme.fontSizes.regular,
          fontWeight: theme.fontWeights.medium,
          color: theme.colors.text,
        }}>
          {label}
        </Text>
        <Text style={{
          fontSize: theme.fontSizes.small,
          color: remaining >= 0 ? theme.colors.success : theme.colors.danger,
          fontWeight: theme.fontWeights.semibold,
        }}>
          {remaining >= 0 ? '+' : ''}{remaining.toFixed(0)}€
        </Text>
      </View>
      
      <ProgressBar
        percentage={percentage}
        color={color}
        theme={theme}
        height={12}
        animated={true}
        striped={percentage > 90}
      />
      
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: theme.spacing.tiny,
      }}>
        <Text style={{
          fontSize: theme.fontSizes.small,
          color: theme.colors.textSecondary,
        }}>
          {spent.toFixed(0)}€ dépensé
        </Text>
        <Text style={{
          fontSize: theme.fontSizes.small,
          color: theme.colors.textSecondary,
        }}>
          sur {allocated.toFixed(0)}€
        </Text>
      </View>
    </View>
  );
};

// Composant pour l'efficacité du taux horaire
export const EfficiencyProgressBar: React.FC<{
  efficiency: number;
  theme: Theme;
}> = ({ efficiency, theme }) => {
  const getEfficiencyStatus = () => {
    if (efficiency >= 85) return { status: 'excellent', icon: '🏆', color: theme.colors.success };
    if (efficiency >= 70) return { status: 'good', icon: '👍', color: theme.colors.success };
    if (efficiency >= 50) return { status: 'average', icon: '⚡', color: theme.colors.warning };
    return { status: 'poor', icon: '⚠️', color: theme.colors.danger };
  };

  const status = getEfficiencyStatus();

  return (
    <View>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.small,
      }}>
        <Text style={{
          fontSize: theme.fontSizes.medium,
          marginRight: theme.spacing.small,
        }}>
          {status.icon}
        </Text>
        <Text style={{
          fontSize: theme.fontSizes.regular,
          fontWeight: theme.fontWeights.semibold,
          color: theme.colors.text,
          flex: 1,
        }}>
          Efficacité financière
        </Text>
        <Text style={{
          fontSize: theme.fontSizes.large,
          fontWeight: theme.fontWeights.bold,
          color: status.color,
        }}>
          {efficiency.toFixed(1)}%
        </Text>
      </View>
      
      <ProgressBar
        percentage={efficiency}
        color={status.color}
        theme={theme}
        height={16}
        animated={true}
        rounded={true}
      />
      
      <Text style={{
        fontSize: theme.fontSizes.small,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginTop: theme.spacing.small,
      }}>
        {efficiency >= 85 ? 'Excellente gestion financière!' :
         efficiency >= 70 ? 'Bonne maîtrise de vos finances' :
         efficiency >= 50 ? 'Peut être optimisé' :
         'Nécessite une attention particulière'}
      </Text>
    </View>
  );
};

const createProgressBarStyles = (theme: Theme, height: number, rounded: boolean) =>
  StyleSheet.create({
    container: {
      width: '100%',
    },
    
    labelContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.small,
    },
    
    label: {
      fontSize: theme.fontSizes.regular,
      fontWeight: theme.fontWeights.medium,
      color: theme.colors.text,
    },
    
    percentage: {
      fontSize: theme.fontSizes.small,
      fontWeight: theme.fontWeights.bold,
    },
    
    progressContainer: {
      position: 'relative',
    },
    
    progressBackground: {
      height: height,
      borderRadius: rounded ? height / 2 : 0,
      overflow: 'hidden',
      position: 'relative',
    },
    
    progressFill: {
      height: '100%',
      borderRadius: rounded ? height / 2 : 0,
      position: 'relative',
      overflow: 'hidden',
    },
    
    stripedPattern: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: 'row',
      opacity: 0.3,
    },
    
    stripe: {
      width: 4,
      height: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
      marginRight: 4,
    },
    
    thresholds: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    
    threshold: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: 2,
      backgroundColor: theme.colors.border,
      opacity: 0.5,
    },
    
    overflowIndicator: {
      position: 'absolute',
      right: -height / 2,
      top: -height / 4,
      width: height * 1.5,
      height: height * 1.5,
      borderRadius: height * 0.75,
      backgroundColor: theme.colors.danger,
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    overflowText: {
      color: '#FFFFFF',
      fontSize: height * 0.6,
      fontWeight: theme.fontWeights.bold,
    },
    
    statusContainer: {
      marginTop: theme.spacing.small,
      alignItems: 'center',
    },
    
    overBudgetText: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.danger,
      fontWeight: theme.fontWeights.semibold,
    },
    
    warningText: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.warning,
      fontWeight: theme.fontWeights.medium,
    },
  });