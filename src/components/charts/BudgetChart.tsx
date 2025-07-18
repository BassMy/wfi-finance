// src/components/charts/BudgetChart.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Theme } from '../../styles/theme';
import { formatCurrency, formatPercentage } from '../../utils/formatting';

interface BudgetChartProps {
  data: {
    needs: { allocated: number; spent: number };
    wants: { allocated: number; spent: number };
    savings: { allocated: number; spent: number };
  };
  theme: Theme;
  size?: number;
  showLabels?: boolean;
  showPercentages?: boolean;
}

export const BudgetChart: React.FC<BudgetChartProps> = ({
  data,
  theme,
  size = 200,
  showLabels = true,
  showPercentages = true,
}) => {
  const styles = createBudgetChartStyles(theme, size);

  // Calculer les totaux
  const totalAllocated = data.needs.allocated + data.wants.allocated + data.savings.allocated;
  const totalSpent = data.needs.spent + data.wants.spent + data.savings.spent;

  // Calculer les angles pour chaque section
  const needsAngle = totalAllocated > 0 ? (data.needs.allocated / totalAllocated) * 360 : 0;
  const wantsAngle = totalAllocated > 0 ? (data.wants.allocated / totalAllocated) * 360 : 0;
  const savingsAngle = totalAllocated > 0 ? (data.savings.allocated / totalAllocated) * 360 : 0;

  // Calculer les pourcentages d'utilisation
  const needsUsage = data.needs.allocated > 0 ? (data.needs.spent / data.needs.allocated) * 100 : 0;
  const wantsUsage = data.wants.allocated > 0 ? (data.wants.spent / data.wants.allocated) * 100 : 0;
  const savingsUsage = data.savings.allocated > 0 ? (data.savings.spent / data.savings.allocated) * 100 : 0;

  // Créer les chemins SVG pour le graphique circulaire
  const createArcPath = (
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    endAngle: number
  ) => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    return `M ${centerX} ${centerY} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  const center = size / 2;
  const radius = size / 2 - 20;
  const innerRadius = radius * 0.6;

  // Graphique simplifié avec des cercles concentriques colorés
  const renderSimpleChart = () => {
    const segments = [
      { 
        color: theme.colors.needs, 
        percentage: (data.needs.allocated / totalAllocated) * 100,
        usage: needsUsage,
        label: 'Besoins'
      },
      { 
        color: theme.colors.wants, 
        percentage: (data.wants.allocated / totalAllocated) * 100,
        usage: wantsUsage,
        label: 'Envies'
      },
      { 
        color: theme.colors.savings, 
        percentage: (data.savings.allocated / totalAllocated) * 100,
        usage: savingsUsage,
        label: 'Épargne'
      },
    ];

    return (
      <View style={styles.chartContainer}>
        {/* Cercle de fond */}
        <View style={[styles.circle, styles.backgroundCircle]} />
        
        {/* Segments du budget */}
        {segments.map((segment, index) => {
          const circumference = 2 * Math.PI * (radius - 10 - index * 15);
          const strokeDasharray = `${(segment.percentage / 100) * circumference} ${circumference}`;
          const rotation = index * 120; // Décalage pour chaque segment
          
          return (
            <View
              key={index}
              style={[
                styles.segmentContainer,
                { transform: [{ rotate: `${rotation}deg` }] }
              ]}
            >
              <View
                style={[
                  styles.segment,
                  {
                    borderColor: segment.color,
                    borderWidth: 8,
                    width: radius * 2 - index * 30,
                    height: radius * 2 - index * 30,
                    borderRadius: radius - index * 15,
                  }
                ]}
              />
              
              {/* Indicateur d'utilisation */}
              <View
                style={[
                  styles.usageIndicator,
                  {
                    borderColor: segment.usage > 100 ? theme.colors.danger : 
                                 segment.usage > 80 ? theme.colors.warning : theme.colors.success,
                    borderWidth: 4,
                    width: radius * 1.8 - index * 30,
                    height: radius * 1.8 - index * 30,
                    borderRadius: radius * 0.9 - index * 15,
                  }
                ]}
              />
            </View>
          );
        })}

        {/* Centre avec total */}
        <View style={styles.centerContent}>
          <Text style={styles.centerAmount}>
            {formatCurrency(totalSpent, 'EUR', { compact: true })}
          </Text>
          <Text style={styles.centerLabel}>Dépensé</Text>
          <Text style={styles.centerTotal}>
            / {formatCurrency(totalAllocated, 'EUR', { compact: true })}
          </Text>
        </View>
      </View>
    );
  };

  const renderLegend = () => {
    const items = [
      {
        color: theme.colors.needs,
        label: 'Besoins',
        allocated: data.needs.allocated,
        spent: data.needs.spent,
        usage: needsUsage,
      },
      {
        color: theme.colors.wants,
        label: 'Envies',
        allocated: data.wants.allocated,
        spent: data.wants.spent,
        usage: wantsUsage,
      },
      {
        color: theme.colors.savings,
        label: 'Épargne',
        allocated: data.savings.allocated,
        spent: data.savings.spent,
        usage: savingsUsage,
      },
    ];

    return (
      <View style={styles.legend}>
        {items.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={styles.legendItemHeader}>
              <View style={[styles.legendColor, { backgroundColor: item.color }]} />
              <Text style={styles.legendLabel}>{item.label}</Text>
              {showPercentages && (
                <Text style={[
                  styles.legendUsage,
                  { 
                    color: item.usage > 100 ? theme.colors.danger : 
                           item.usage > 80 ? theme.colors.warning : theme.colors.success 
                  }
                ]}>
                  {formatPercentage(item.usage)}
                </Text>
              )}
            </View>
            
            <View style={styles.legendDetails}>
              <Text style={styles.legendSpent}>
                {formatCurrency(item.spent)}
              </Text>
              <Text style={styles.legendAllocated}>
                / {formatCurrency(item.allocated)}
              </Text>
            </View>
            
            {/* Barre de progression */}
            <View style={styles.legendProgressBar}>
              <View 
                style={[
                  styles.legendProgressFill,
                  { 
                    width: `${Math.min(100, item.usage)}%`,
                    backgroundColor: item.usage > 100 ? theme.colors.danger : 
                                   item.usage > 80 ? theme.colors.warning : item.color
                  }
                ]}
              />
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderSimpleChart()}
      {showLabels && renderLegend()}
    </View>
  );
};

const createBudgetChartStyles = (theme: Theme, size: number) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
    },
    
    chartContainer: {
      width: size,
      height: size,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    
    circle: {
      position: 'absolute',
      borderRadius: size / 2,
    },
    
    backgroundCircle: {
      width: size,
      height: size,
      backgroundColor: theme.colors.borderLight,
    },
    
    segmentContainer: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    segment: {
      position: 'absolute',
      borderColor: 'transparent',
      backgroundColor: 'transparent',
    },
    
    usageIndicator: {
      position: 'absolute',
      borderColor: 'transparent',
      backgroundColor: 'transparent',
    },
    
    centerContent: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
      width: size * 0.5,
      height: size * 0.5,
      backgroundColor: theme.colors.surface,
      borderRadius: size * 0.25,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    
    centerAmount: {
      fontSize: theme.fontSizes.large,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.text,
    },
    
    centerLabel: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.tiny,
    },
    
    centerTotal: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.textTertiary,
    },
    
    legend: {
      width: '100%',
      marginTop: theme.spacing.large,
      gap: theme.spacing.medium,
    },
    
    legendItem: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.medium,
    },
    
    legendItemHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.small,
    },
    
    legendColor: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: theme.spacing.small,
    },
    
    legendLabel: {
      flex: 1,
      fontSize: theme.fontSizes.regular,
      fontWeight: theme.fontWeights.medium,
      color: theme.colors.text,
    },
    
    legendUsage: {
      fontSize: theme.fontSizes.small,
      fontWeight: theme.fontWeights.bold,
    },
    
    legendDetails: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.small,
    },
    
    legendSpent: {
      fontSize: theme.fontSizes.regular,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.text,
    },
    
    legendAllocated: {
      fontSize: theme.fontSizes.regular,
      color: theme.colors.textSecondary,
      marginLeft: theme.spacing.small,
    },
    
    legendProgressBar: {
      height: 4,
      backgroundColor: theme.colors.borderLight,
      borderRadius: 2,
      overflow: 'hidden',
    },
    
    legendProgressFill: {
      height: '100%',
      borderRadius: 2,
    },
  });