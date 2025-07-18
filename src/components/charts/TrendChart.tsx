// src/components/charts/TrendChart.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Theme } from '../../styles/theme';
import { formatCurrency } from '../../utils/formatting';

interface TrendData {
  month: string;
  expenses: number;
  subscriptions: number;
  income?: number;
  savings?: number;
}

interface TrendChartProps {
  data: TrendData[];
  type?: 'line' | 'bar' | 'area';
  theme: Theme;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  currency?: 'EUR' | 'USD' | 'GBP';
}

export const TrendChart: React.FC<TrendChartProps> = ({
  data,
  type = 'bar',
  theme,
  height = 250,
  showGrid = true,
  showTooltip = true,
  showLegend = true,
  currency = 'EUR',
}) => {
  const styles = createTrendChartStyles(theme);
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);

  // Formater les données pour l'affichage
  const formattedData = data.map(item => ({
    ...item,
    monthShort: new Date(item.month).toLocaleDateString('fr-FR', { 
      month: 'short' 
    }),
    monthFull: new Date(item.month).toLocaleDateString('fr-FR', { 
      month: 'long', 
      year: 'numeric' 
    }),
  }));

  // Configuration des couleurs
  const colors = {
    expenses: theme.colors.primary,
    subscriptions: theme.colors.warning,
    income: theme.colors.success,
    savings: theme.colors.purple,
    grid: theme.colors.borderLight,
    text: theme.colors.textSecondary,
  };

  // Graphique en barres interactif
  const renderBarChart = () => {
    const maxValue = Math.max(
      ...formattedData.map(d => d.expenses + d.subscriptions + (d.income || 0))
    );

    return (
      <View style={styles.chartContainer}>
        {showGrid && <View style={styles.gridLines} />}
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chartScrollContent}
        >
          <View style={[
            styles.chartBars,
            { minWidth: Math.max(300, formattedData.length * 80) }
          ]}>
            {formattedData.map((item, index) => {
              const expensesHeight = maxValue > 0 ? (item.expenses / maxValue) * 180 : 0;
              const subscriptionsHeight = maxValue > 0 ? (item.subscriptions / maxValue) * 180 : 0;
              const incomeHeight = maxValue > 0 ? ((item.income || 0) / maxValue) * 180 : 0;
              const isSelected = selectedIndex === index;
              
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.barContainer}
                  onPress={() => setSelectedIndex(isSelected ? null : index)}
                  activeOpacity={0.7}
                >
                  <View style={styles.barGroup}>
                    {/* Barre des revenus (arrière-plan) */}
                    {item.income && (
                      <View 
                        style={[
                          styles.bar,
                          styles.incomeBar,
                          { 
                            height: incomeHeight,
                            backgroundColor: colors.income,
                            opacity: 0.3,
                          }
                        ]}
                      />
                    )}
                    
                    {/* Barre des dépenses */}
                    <View 
                      style={[
                        styles.bar,
                        styles.expensesBar,
                        { 
                          height: expensesHeight,
                          backgroundColor: colors.expenses,
                          opacity: isSelected ? 1 : 0.8,
                        }
                      ]}
                    />
                    
                    {/* Barre des abonnements */}
                    <View 
                      style={[
                        styles.bar,
                        styles.subscriptionsBar,
                        { 
                          height: subscriptionsHeight,
                          backgroundColor: colors.subscriptions,
                          opacity: isSelected ? 1 : 0.8,
                        }
                      ]}
                    />
                  </View>
                  
                  {/* Étiquette du mois */}
                  <Text style={[
                    styles.barLabel,
                    isSelected && styles.selectedBarLabel
                  ]}>
                    {item.monthShort}
                  </Text>
                  
                  {/* Valeur totale */}
                  <Text style={[
                    styles.barValue,
                    isSelected && styles.selectedBarValue
                  ]}>
                    {formatCurrency(item.expenses + item.subscriptions, currency, { compact: true })}
                  </Text>
                  
                  {/* Tooltip conditionnel */}
                  {isSelected && showTooltip && (
                    <View style={styles.tooltip}>
                      <Text style={styles.tooltipTitle}>{item.monthFull}</Text>
                      <View style={styles.tooltipItem}>
                        <View style={[styles.tooltipDot, { backgroundColor: colors.expenses }]} />
                        <Text style={styles.tooltipText}>
                          Dépenses: {formatCurrency(item.expenses, currency)}
                        </Text>
                      </View>
                      <View style={styles.tooltipItem}>
                        <View style={[styles.tooltipDot, { backgroundColor: colors.subscriptions }]} />
                        <Text style={styles.tooltipText}>
                          Abonnements: {formatCurrency(item.subscriptions, currency)}
                        </Text>
                      </View>
                      {item.income && (
                        <View style={styles.tooltipItem}>
                          <View style={[styles.tooltipDot, { backgroundColor: colors.income }]} />
                          <Text style={styles.tooltipText}>
                            Revenus: {formatCurrency(item.income, currency)}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  };

  // Graphique linéaire simplifié
  const renderLineChart = () => {
    const maxValue = Math.max(
      ...formattedData.map(d => Math.max(d.expenses, d.subscriptions, d.income || 0))
    );

    return (
      <View style={styles.chartContainer}>
        {showGrid && <View style={styles.gridLines} />}
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chartScrollContent}
        >
          <View style={[
            styles.lineChartContainer,
            { minWidth: Math.max(300, formattedData.length * 60) }
          ]}>
            {/* Lignes de connexion */}
            {formattedData.map((item, index) => {
              if (index === formattedData.length - 1) return null;
              
              const currentExpensesY = 180 - (item.expenses / maxValue) * 180;
              const nextExpensesY = 180 - (formattedData[index + 1].expenses / maxValue) * 180;
              
              return (
                <View
                  key={`line-${index}`}
                  style={[
                    styles.connectionLine,
                    {
                      left: index * 60 + 35,
                      top: currentExpensesY,
                      width: 60,
                      transform: [
                        { 
                          rotate: `${Math.atan2(nextExpensesY - currentExpensesY, 60) * 180 / Math.PI}deg` 
                        }
                      ],
                    }
                  ]}
                />
              );
            })}
            
            {/* Points de données */}
            {formattedData.map((item, index) => {
              const expensesY = 180 - (item.expenses / maxValue) * 180;
              const subscriptionsY = 180 - (item.subscriptions / maxValue) * 180;
              const isSelected = selectedIndex === index;
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.linePoint, { left: index * 60 + 30 }]}
                  onPress={() => setSelectedIndex(isSelected ? null : index)}
                  activeOpacity={0.7}
                >
                  {/* Point des dépenses */}
                  <View 
                    style={[
                      styles.dataPoint,
                      { 
                        top: expensesY,
                        backgroundColor: colors.expenses,
                        transform: [{ scale: isSelected ? 1.5 : 1 }],
                      }
                    ]}
                  />
                  
                  {/* Point des abonnements */}
                  <View 
                    style={[
                      styles.dataPoint,
                      { 
                        top: subscriptionsY,
                        backgroundColor: colors.subscriptions,
                        transform: [{ scale: isSelected ? 1.5 : 1 }],
                      }
                    ]}
                  />
                  
                  {/* Étiquettes */}
                  <Text style={[styles.lineLabel, { top: 190 }]}>
                    {item.monthShort}
                  </Text>
                  
                  {/* Tooltip */}
                  {isSelected && showTooltip && (
                    <View style={[styles.tooltip, { top: Math.min(expensesY, subscriptionsY) - 80 }]}>
                      <Text style={styles.tooltipTitle}>{item.monthFull}</Text>
                      <View style={styles.tooltipItem}>
                        <View style={[styles.tooltipDot, { backgroundColor: colors.expenses }]} />
                        <Text style={styles.tooltipText}>
                          Dépenses: {formatCurrency(item.expenses, currency)}
                        </Text>
                      </View>
                      <View style={styles.tooltipItem}>
                        <View style={[styles.tooltipDot, { backgroundColor: colors.subscriptions }]} />
                        <Text style={styles.tooltipText}>
                          Abonnements: {formatCurrency(item.subscriptions, currency)}
                        </Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  };

  // Statistiques rapides
  const renderStats = () => {
    if (formattedData.length === 0) return null;

    const totalExpenses = formattedData.reduce((sum, item) => sum + item.expenses, 0);
    const avgExpenses = totalExpenses / formattedData.length;
    const lastMonth = formattedData[formattedData.length - 1];
    const previousMonth = formattedData[formattedData.length - 2];
    const monthlyChange = previousMonth 
      ? ((lastMonth.expenses - previousMonth.expenses) / previousMonth.expenses) * 100
      : 0;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {formatCurrency(avgExpenses, currency, { compact: true })}
          </Text>
          <Text style={styles.statLabel}>Moyenne mensuelle</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[
            styles.statValue,
            { color: monthlyChange > 0 ? theme.colors.danger : theme.colors.success }
          ]}>
            {monthlyChange > 0 ? '+' : ''}{monthlyChange.toFixed(1)}%
          </Text>
          <Text style={styles.statLabel}>vs mois dernier</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {formatCurrency(lastMonth.expenses, currency, { compact: true })}
          </Text>
          <Text style={styles.statLabel}>Ce mois</Text>
        </View>
      </View>
    );
  };

  // Légende
  const renderLegend = () => {
    if (!showLegend) return null;

    return (
      <View style={styles.legendContainer}>
        <TouchableOpacity style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: colors.expenses }]} />
          <Text style={styles.legendText}>Dépenses</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: colors.subscriptions }]} />
          <Text style={styles.legendText}>Abonnements</Text>
        </TouchableOpacity>
        {data.some(d => d.income) && (
          <TouchableOpacity style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: colors.income }]} />
            <Text style={styles.legendText}>Revenus</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (formattedData.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>Pas assez de données pour afficher les tendances</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderStats()}
      
      <View style={styles.chartWrapper}>
        {type === 'line' && renderLineChart()}
        {(type === 'bar' || type === 'area') && renderBarChart()}
      </View>

      {renderLegend()}
    </View>
  );
};

const createTrendChartStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.medium,
    },
    
    chartWrapper: {
      marginBottom: theme.spacing.medium,
    },

    chartContainer: {
      height: 220,
      position: 'relative',
    },

    chartScrollContent: {
      paddingHorizontal: theme.spacing.medium,
    },

    gridLines: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 40,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: theme.colors.borderLight,
      opacity: 0.3,
    },
    
    // Styles pour graphique en barres
    chartBars: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      height: 180,
    },

    barContainer: {
      alignItems: 'center',
      marginHorizontal: theme.spacing.small,
      minWidth: 60,
      position: 'relative',
    },

    barGroup: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      height: 180,
      justifyContent: 'center',
    },

    bar: {
      minHeight: 4,
      borderRadius: 4,
      marginHorizontal: 1,
    },

    expensesBar: {
      width: 16,
    },

    subscriptionsBar: {
      width: 12,
    },

    incomeBar: {
      width: 20,
      position: 'absolute',
      bottom: 0,
    },

    barLabel: {
      fontSize: theme.fontSizes.tiny,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.tiny,
      textAlign: 'center',
    },

    selectedBarLabel: {
      color: theme.colors.text,
      fontWeight: theme.fontWeights.semibold,
    },

    barValue: {
      fontSize: theme.fontSizes.tiny,
      fontWeight: theme.fontWeights.semibold,
      color: theme.colors.text,
      textAlign: 'center',
      marginTop: 2,
    },

    selectedBarValue: {
      color: theme.colors.primary,
    },

    // Styles pour graphique linéaire
    lineChartContainer: {
      position: 'relative',
      height: 220,
    },

    connectionLine: {
      position: 'absolute',
      height: 2,
      backgroundColor: theme.colors.primary,
      opacity: 0.6,
    },

    linePoint: {
      position: 'absolute',
      width: 20,
      height: 220,
    },

    dataPoint: {
      position: 'absolute',
      width: 10,
      height: 10,
      borderRadius: 5,
      left: 5,
      borderWidth: 2,
      borderColor: theme.colors.surface,
    },

    lineLabel: {
      position: 'absolute',
      fontSize: theme.fontSizes.tiny,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      width: 20,
    },

    // Tooltip
    tooltip: {
      position: 'absolute',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.small,
      padding: theme.spacing.small,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
      borderWidth: 1,
      borderColor: theme.colors.border,
      minWidth: 150,
      zIndex: 1000,
      left: -65,
      top: -100,
    },

    tooltipTitle: {
      fontSize: theme.fontSizes.small,
      fontWeight: theme.fontWeights.semibold,
      color: theme.colors.text,
      marginBottom: theme.spacing.tiny,
      textAlign: 'center',
    },

    tooltipItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 1,
    },

    tooltipDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: theme.spacing.tiny,
    },

    tooltipText: {
      fontSize: theme.fontSizes.tiny,
      color: theme.colors.text,
      flex: 1,
    },
    
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: theme.spacing.large,
      paddingBottom: theme.spacing.medium,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight,
    },
    
    statItem: {
      alignItems: 'center',
    },
    
    statValue: {
      fontSize: theme.fontSizes.regular,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.text,
    },
    
    statLabel: {
      fontSize: theme.fontSizes.tiny,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.tiny,
      textAlign: 'center',
    },

    legendContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: theme.spacing.large,
      marginTop: theme.spacing.medium,
    },
    
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    
    legendColor: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: theme.spacing.small,
    },
    
    legendText: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.text,
    },
    
    emptyState: {
      alignItems: 'center',
      padding: theme.spacing.xlarge,
    },
    
    emptyText: {
      fontSize: theme.fontSizes.regular,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  });