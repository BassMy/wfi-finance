// src/screens/main/AnalyticsScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useAuth } from '../../hooks/useAuth';
import { fetchBudget } from '../../store/slices/budgetSlices';
import { fetchExpenses } from '../../store/slices/expensesSlice';
import { fetchSubscriptions } from '../../store/slices/subscriptionsSlice';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Button } from '../../components/common/Button';
import { Theme } from '../../styles/theme';
import { formatCurrency, formatPercentage } from '../../utils/formatting';
import { 
  calculateMonthlyTrends,
  calculateCategoryTrends,
  calculateExpenseFrequency,
  calculateTheoreticalHourlyRate,
  calculateRealHourlyRate,
  calculateMonthlySubscriptionCost
} from '../../utils/calculations';
import { RootState } from '../../store/store';

interface AnalyticsScreenProps {
  theme: Theme;
}

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({ theme }) => {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  
  // Redux state avec types explicites
  const budget = useAppSelector((state: RootState) => state.budget.budget);
  const expenses = useAppSelector((state: RootState) => state.expenses.expenses);
  const expensesTotals = useAppSelector((state: RootState) => state.expenses.totals);
  const subscriptions = useAppSelector((state: RootState) => state.subscriptions.subscriptions);
  const subscriptionsTotal = useAppSelector((state: RootState) => state.subscriptions.monthlyTotal);
  const isLoading = useAppSelector((state: RootState) => state.budget.isLoading);

  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'3m' | '6m' | '12m'>('6m');
  const [selectedView, setSelectedView] = useState<'overview' | 'trends' | 'hourly' | 'predictions'>('overview');

  const styles = createAnalyticsStyles(theme);
  const screenWidth = Dimensions.get('window').width;

  // Charger les données
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      await Promise.all([
        dispatch(fetchBudget(user.uid)),
        dispatch(fetchExpenses(user.uid)),
        dispatch(fetchSubscriptions(user.uid)),
      ]);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Calculer les analytics
  const getAnalytics = () => {
    if (!expenses || !expenses.length) return null;

    const monthlyTrends = calculateMonthlyTrends(
      expenses, 
      subscriptions || [], 
      selectedPeriod === '3m' ? 3 : selectedPeriod === '6m' ? 6 : 12
    );

    const categoryTrends = calculateCategoryTrends(expenses, 3);
    const expenseFrequency = calculateExpenseFrequency(expenses, 30);

    // Calcul du taux horaire
    let hourlyRateData = null;
    if (budget) {
      const theoreticalRate = calculateTheoreticalHourlyRate(budget.salary);
      const realRate = calculateRealHourlyRate(
        theoreticalRate,
        expensesTotals?.total || 0,
        subscriptionsTotal || 0,
        budget.salary
      );
      hourlyRateData = { theoretical: theoreticalRate, real: realRate };
    }

    return {
      monthlyTrends,
      categoryTrends,
      expenseFrequency,
      hourlyRateData,
    };
  };

  const analytics = getAnalytics();

  const renderOverview = () => {
    if (!analytics || !expensesTotals) return null;

    const currentMonth = new Date().getMonth();
    const lastMonthExpenses = expenses?.filter((exp: { date: string | number | Date; }) => {
      const expDate = new Date(exp.date);
      return expDate.getMonth() === currentMonth - 1;
    }) || [];
    
    const lastMonthTotal = lastMonthExpenses.reduce((sum: number, exp: { amount: number; }) => sum + exp.amount, 0);
    const changeFromLastMonth = lastMonthTotal > 0 
      ? ((expensesTotals.total - lastMonthTotal) / lastMonthTotal) * 100 
      : 0;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Vue d'ensemble</Text>

        {/* Cartes de statistiques */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>💸</Text>
            <Text style={styles.statValue}>
              {formatCurrency(expensesTotals.total)}
            </Text>
            <Text style={styles.statLabel}>Ce mois</Text>
            <Text style={[
              styles.statChange,
              { color: changeFromLastMonth > 0 ? theme.colors.danger : theme.colors.success }
            ]}>
              {changeFromLastMonth > 0 ? '+' : ''}{changeFromLastMonth.toFixed(1)}%
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📈</Text>
            <Text style={styles.statValue}>
              {analytics.expenseFrequency.averagePerDay.toFixed(1)}
            </Text>
            <Text style={styles.statLabel}>Dépenses/jour</Text>
            <Text style={styles.statChange}>
              {analytics.expenseFrequency.activeDays} jours actifs
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>💳</Text>
            <Text style={styles.statValue}>
              {formatCurrency(subscriptionsTotal || 0)}
            </Text>
            <Text style={styles.statLabel}>Abonnements/mois</Text>
            <Text style={styles.statChange}>
              {subscriptions?.filter(s => s.isActive).length || 0} actifs
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⚡</Text>
            <Text style={styles.statValue}>
              {analytics.hourlyRateData?.real.efficiency.toFixed(0) || '0'}%
            </Text>
            <Text style={styles.statLabel}>Efficacité</Text>
            <Text style={[
              styles.statChange,
              { color: (analytics.hourlyRateData?.real.efficiency || 0) > 80 
                ? theme.colors.success : theme.colors.warning }
            ]}>
              Taux horaire réel
            </Text>
          </View>
        </View>

        {/* Répartition par catégorie */}
        <View style={styles.categoryBreakdown}>
          <Text style={styles.subsectionTitle}>Répartition par catégorie</Text>
          
          <View style={styles.categoryItem}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryName}>🏠 Besoins</Text>
              <Text style={styles.categoryAmount}>
                {formatCurrency(expensesTotals.needs)}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${(expensesTotals.needs / expensesTotals.total) * 100}%`,
                    backgroundColor: theme.colors.needs 
                  }
                ]}
              />
            </View>
            <Text style={styles.categoryPercentage}>
              {formatPercentage((expensesTotals.needs / expensesTotals.total) * 100)}
            </Text>
          </View>

          <View style={styles.categoryItem}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryName}>🎯 Envies</Text>
              <Text style={styles.categoryAmount}>
                {formatCurrency(expensesTotals.wants)}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${(expensesTotals.wants / expensesTotals.total) * 100}%`,
                    backgroundColor: theme.colors.wants 
                  }
                ]}
              />
            </View>
            <Text style={styles.categoryPercentage}>
              {formatPercentage((expensesTotals.wants / expensesTotals.total) * 100)}
            </Text>
          </View>

          <View style={styles.categoryItem}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryName}>💎 Épargne</Text>
              <Text style={styles.categoryAmount}>
                {formatCurrency(expensesTotals.savings)}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${(expensesTotals.savings / expensesTotals.total) * 100}%`,
                    backgroundColor: theme.colors.savings 
                  }
                ]}
              />
            </View>
            <Text style={styles.categoryPercentage}>
              {formatPercentage((expensesTotals.savings / expensesTotals.total) * 100)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderTrends = () => {
    if (!analytics?.monthlyTrends) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📈 Tendances</Text>

        {/* Sélecteur de période */}
        <View style={styles.periodSelector}>
          {(['3m', '6m', '12m'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.periodButtonTextActive
              ]}>
                {period === '3m' ? '3 mois' : period === '6m' ? '6 mois' : '1 an'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Graphique simplifié des tendances */}
        <View style={styles.trendChart}>
          <Text style={styles.chartTitle}>Évolution des dépenses</Text>
          <View style={styles.chartContainer}>
            {analytics.monthlyTrends.map((trend, index) => {
              const maxAmount = Math.max(...analytics.monthlyTrends.map(t => t.expenses));
              const height = maxAmount > 0 ? (trend.expenses / maxAmount) * 100 : 0;
              
              return (
                <View key={trend.month} style={styles.chartBar}>
                  <View 
                    style={[
                      styles.chartBarFill,
                      { 
                        height: `${height}%`,
                        backgroundColor: theme.colors.primary 
                      }
                    ]}
                  />
                  <Text style={styles.chartBarLabel}>
                    {new Date(trend.month).toLocaleDateString('fr-FR', { month: 'short' })}
                  </Text>
                  <Text style={styles.chartBarValue}>
                    {formatCurrency(trend.expenses, 'EUR', { compact: true })}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Tendances par catégorie */}
        <View style={styles.categoryTrends}>
          <Text style={styles.subsectionTitle}>Évolution par catégorie</Text>
          {analytics.categoryTrends.map((trend) => (
            <View key={trend.category} style={styles.trendItem}>
              <View style={styles.trendInfo}>
                <Text style={styles.trendCategory}>
                  {trend.category === 'needs' ? '🏠 Besoins' :
                   trend.category === 'wants' ? '🎯 Envies' : '💎 Épargne'}
                </Text>
                <Text style={styles.trendAmount}>
                  {formatCurrency(trend.amount)}
                </Text>
              </View>
              <Text style={[
                styles.trendChange,
                { 
                  color: trend.trend > 0 ? theme.colors.danger : 
                         trend.trend < 0 ? theme.colors.success : theme.colors.textSecondary 
                }
              ]}>
                {trend.trend > 0 ? '+' : ''}{trend.trend.toFixed(1)}%
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderHourlyRate = () => {
    if (!analytics?.hourlyRateData || !budget) return null;

    const { theoretical, real } = analytics.hourlyRateData;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⏰ Taux horaire réel</Text>

        <View style={styles.hourlyRateCard}>
          <View style={styles.hourlyRateHeader}>
            <View style={styles.rateItem}>
              <Text style={styles.rateLabel}>Théorique</Text>
              <Text style={styles.rateValue}>
                {formatCurrency(theoretical)}/h
              </Text>
            </View>
            <Text style={styles.rateArrow}>→</Text>
            <View style={styles.rateItem}>
              <Text style={styles.rateLabel}>Réel</Text>
              <Text style={[
                styles.rateValue,
                { color: real.real < theoretical ? theme.colors.warning : theme.colors.success }
              ]}>
                {formatCurrency(real.real)}/h
              </Text>
            </View>
          </View>

          <View style={styles.efficiencyContainer}>
            <Text style={styles.efficiencyLabel}>Efficacité</Text>
            <View style={styles.efficiencyBar}>
              <View 
                style={[
                  styles.efficiencyFill,
                  { 
                    width: `${Math.min(100, real.efficiency)}%`,
                    backgroundColor: real.efficiency > 80 ? theme.colors.success :
                                   real.efficiency > 60 ? theme.colors.warning : theme.colors.danger
                  }
                ]}
              />
            </View>
            <Text style={styles.efficiencyPercentage}>
              {formatPercentage(real.efficiency)}
            </Text>
          </View>

          <View style={styles.impactBreakdown}>
            <Text style={styles.breakdownTitle}>Impact mensuel</Text>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Dépenses courantes</Text>
              <Text style={styles.breakdownValue}>
                {formatCurrency(real.breakdown.expenses)}
              </Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Abonnements</Text>
              <Text style={styles.breakdownValue}>
                {formatCurrency(real.breakdown.subscriptions)}
              </Text>
            </View>
            <View style={[styles.breakdownItem, styles.breakdownTotal]}>
              <Text style={styles.breakdownLabel}>Impact total</Text>
              <Text style={styles.breakdownValue}>
                {formatCurrency(real.totalImpact)}
              </Text>
            </View>
          </View>

          <View style={styles.workTimeImpact}>
            <Text style={styles.impactTitle}>
              💼 Temps de travail "perdu" par mois
            </Text>
            <Text style={styles.impactValue}>
              {(real.totalImpact / theoretical).toFixed(1)} heures
            </Text>
            <Text style={styles.impactSubtext}>
              ≈ {((real.totalImpact / theoretical) / 8).toFixed(1)} jours de travail
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderPredictions = () => {
    if (!analytics?.monthlyTrends || analytics.monthlyTrends.length < 3) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔮 Prédictions</Text>
          <View style={styles.emptyPredictions}>
            <Text style={styles.emptyText}>
              Pas assez de données pour générer des prédictions.
              Ajoutez plus de dépenses pour voir vos tendances futures.
            </Text>
          </View>
        </View>
      );
    }

    // Calcul simple de prédiction basé sur la moyenne des 3 derniers mois
    const recentTrends = analytics.monthlyTrends.slice(-3);
    const avgExpenses = recentTrends.reduce((sum, t) => sum + t.expenses, 0) / recentTrends.length;
    const avgSubscriptions = recentTrends.reduce((sum, t) => sum + t.subscriptions, 0) / recentTrends.length;

    // Prédictions pour les 3 prochains mois
    const predictions = Array.from({ length: 3 }, (_, index) => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + index + 1);
      
      return {
        month: futureDate.toISOString().slice(0, 7),
        predictedExpenses: avgExpenses * (1 + (Math.random() - 0.5) * 0.1), // Variation de ±5%
        predictedSubscriptions: avgSubscriptions,
      };
    });

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔮 Prédictions</Text>

        <View style={styles.predictionsCard}>
          <Text style={styles.predictionsTitle}>
            Prévisions pour les 3 prochains mois
          </Text>
          
          {predictions.map((prediction, index) => (
            <View key={prediction.month} style={styles.predictionItem}>
              <Text style={styles.predictionMonth}>
                {new Date(prediction.month).toLocaleDateString('fr-FR', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </Text>
              <View style={styles.predictionValues}>
                <Text style={styles.predictionExpenses}>
                  {formatCurrency(prediction.predictedExpenses)} dépenses
                </Text>
                <Text style={styles.predictionSubscriptions}>
                  {formatCurrency(prediction.predictedSubscriptions)} abonnements
                </Text>
                <Text style={styles.predictionTotal}>
                  {formatCurrency(prediction.predictedExpenses + prediction.predictedSubscriptions)} total
                </Text>
              </View>
            </View>
          ))}

          <View style={styles.predictionsNote}>
            <Text style={styles.noteText}>
              💡 Ces prédictions sont basées sur vos habitudes des 3 derniers mois.
              Elles peuvent varier selon vos futurs choix financiers.
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading && (!expenses || !expenses.length)) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner 
          fullScreen 
          text="Chargement des analyses..." 
          theme={theme} 
        />
      </SafeAreaView>
    );
  }

  if (!expenses || !expenses.length) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>Pas encore d'analyses</Text>
          <Text style={styles.emptyText}>
            Ajoutez quelques dépenses pour voir vos analyses et tendances financières.
          </Text>
          <Button
            title="Voir mes dépenses"
            onPress={() => {/* Navigation vers expenses */}}
            theme={theme}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header avec navigation */}
      <View style={styles.header}>
        <Text style={styles.title}>📊 Analyses</Text>
        <View style={styles.viewSelector}>
          {([
            { key: 'overview', label: '🏠', title: 'Vue d\'ensemble' },
            { key: 'trends', label: '📈', title: 'Tendances' },
            { key: 'hourly', label: '⏰', title: 'Taux horaire' },
            { key: 'predictions', label: '🔮', title: 'Prédictions' },
          ] as const).map((view) => (
            <TouchableOpacity
              key={view.key}
              style={[
                styles.viewButton,
                selectedView === view.key && styles.viewButtonActive
              ]}
              onPress={() => setSelectedView(view.key)}
            >
              <Text style={[
                styles.viewButtonText,
                selectedView === view.key && styles.viewButtonTextActive
              ]}>
                {view.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {selectedView === 'overview' && renderOverview()}
        {selectedView === 'trends' && renderTrends()}
        {selectedView === 'hourly' && renderHourlyRate()}
        {selectedView === 'predictions' && renderPredictions()}
      </ScrollView>
    </SafeAreaView>
  );
};

const createAnalyticsStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    
    header: {
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.large,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    
    title: {
      fontSize: theme.fontSizes.xlarge,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.medium,
    },
    
    viewSelector: {
      flexDirection: 'row',
      backgroundColor: theme.colors.borderLight,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.tiny,
    },
    
    viewButton: {
      flex: 1,
      paddingVertical: theme.spacing.small,
      alignItems: 'center',
      borderRadius: theme.borderRadius.small,
    },
    
    viewButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    
    viewButtonText: {
      fontSize: theme.fontSizes.medium,
      color: theme.colors.textSecondary,
    },
    
    viewButtonTextActive: {
      color: '#FFFFFF',
    },
    
    scrollView: {
      flex: 1,
    },
    
    section: {
      padding: theme.spacing.large,
    },
    
    sectionTitle: {
      fontSize: theme.fontSizes.large,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.large,
    },
    
    subsectionTitle: {
      fontSize: theme.fontSizes.regular,
      fontWeight: theme.fontWeights.semibold,
      color: theme.colors.text,
      marginBottom: theme.spacing.medium,
    },
    
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.medium,
      marginBottom: theme.spacing.large,
    },
    
    statCard: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.medium,
      alignItems: 'center',
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    
    statIcon: {
      fontSize: 32,
      marginBottom: theme.spacing.small,
    },
    
    statValue: {
      fontSize: theme.fontSizes.large,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.text,
    },
    
    statLabel: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: theme.spacing.tiny,
    },
    
    statChange: {
      fontSize: theme.fontSizes.tiny,
      fontWeight: theme.fontWeights.medium,
      marginTop: theme.spacing.tiny,
    },
    
    categoryBreakdown: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.large,
    },
    
    categoryItem: {
      marginBottom: theme.spacing.medium,
    },
    
    categoryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.small,
    },
    
    categoryName: {
      fontSize: theme.fontSizes.regular,
      fontWeight: theme.fontWeights.medium,
      color: theme.colors.text,
    },
    
    categoryAmount: {
      fontSize: theme.fontSizes.regular,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.text,
    },
    
    progressBar: {
      height: 8,
      backgroundColor: theme.colors.borderLight,
      borderRadius: 4,
      marginBottom: theme.spacing.small,
    },
    
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
    
    categoryPercentage: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.textSecondary,
      textAlign: 'right',
    },
    
    periodSelector: {
      flexDirection: 'row',
      backgroundColor: theme.colors.borderLight,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.tiny,
      marginBottom: theme.spacing.large,
    },
    
    periodButton: {
      flex: 1,
      paddingVertical: theme.spacing.small,
      alignItems: 'center',
      borderRadius: theme.borderRadius.small,
    },
    
    periodButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    
    periodButtonText: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.textSecondary,
      fontWeight: theme.fontWeights.medium,
    },
    
    periodButtonTextActive: {
      color: '#FFFFFF',
    },
    
    trendChart: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.large,
      marginBottom: theme.spacing.large,
    },
    
    chartTitle: {
      fontSize: theme.fontSizes.regular,
      fontWeight: theme.fontWeights.semibold,
      color: theme.colors.text,
      marginBottom: theme.spacing.medium,
      textAlign: 'center',
    },
    
    chartContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      height: 120,
      marginBottom: theme.spacing.medium,
    },
    
    chartBar: {
      flex: 1,
      alignItems: 'center',
      marginHorizontal: theme.spacing.tiny,
    },
    
    chartBarFill: {
      width: '70%',
      minHeight: 4,
      borderRadius: 2,
      marginBottom: theme.spacing.small,
    },
    
    chartBarLabel: {
      fontSize: theme.fontSizes.tiny,
      color: theme.colors.textTertiary,
      marginBottom: theme.spacing.tiny,
    },
    
    chartBarValue: {
      fontSize: theme.fontSizes.tiny,
      fontWeight: theme.fontWeights.semibold,
      color: theme.colors.text,
    },
    
    categoryTrends: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.large,
    },
    
    trendItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.medium,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight,
    },
    
    trendInfo: {
      flex: 1,
    },
    
    trendCategory: {
      fontSize: theme.fontSizes.regular,
      fontWeight: theme.fontWeights.medium,
      color: theme.colors.text,
    },
    
    trendAmount: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.tiny,
    },
    
    trendChange: {
      fontSize: theme.fontSizes.regular,
      fontWeight: theme.fontWeights.bold,
    },
    
    hourlyRateCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.large,
    },
    
    hourlyRateHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.large,
    },
    
    rateItem: {
      alignItems: 'center',
      flex: 1,
    },
    
    rateLabel: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.small,
    },
    
    rateValue: {
      fontSize: theme.fontSizes.xlarge,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.text,
    },
    
    rateArrow: {
      fontSize: theme.fontSizes.xlarge,
      color: theme.colors.textTertiary,
      marginHorizontal: theme.spacing.medium,
    },
    
    efficiencyContainer: {
      marginBottom: theme.spacing.large,
    },
    
    efficiencyLabel: {
      fontSize: theme.fontSizes.regular,
      fontWeight: theme.fontWeights.medium,
      color: theme.colors.text,
      marginBottom: theme.spacing.small,
    },
    
    efficiencyBar: {
      height: 12,
      backgroundColor: theme.colors.borderLight,
      borderRadius: 6,
      marginBottom: theme.spacing.small,
    },
    
    efficiencyFill: {
      height: '100%',
      borderRadius: 6,
    },
    
    efficiencyPercentage: {
      fontSize: theme.fontSizes.large,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.text,
      textAlign: 'center',
    },
    
    impactBreakdown: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.borderLight,
      paddingTop: theme.spacing.medium,
      marginBottom: theme.spacing.large,
    },
    
    breakdownTitle: {
      fontSize: theme.fontSizes.regular,
      fontWeight: theme.fontWeights.semibold,
      color: theme.colors.text,
      marginBottom: theme.spacing.medium,
    },
    
    breakdownItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.small,
    },
    
    breakdownTotal: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.borderLight,
      marginTop: theme.spacing.small,
      paddingTop: theme.spacing.medium,
    },
    
    breakdownLabel: {
      fontSize: theme.fontSizes.regular,
      color: theme.colors.text,
    },
    
    breakdownValue: {
      fontSize: theme.fontSizes.regular,
      fontWeight: theme.fontWeights.semibold,
      color: theme.colors.text,
    },
    
    workTimeImpact: {
      backgroundColor: theme.colors.warningLight,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.large,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.warning,
    },
    
    impactTitle: {
      fontSize: theme.fontSizes.regular,
      fontWeight: theme.fontWeights.semibold,
      color: theme.colors.warning,
      textAlign: 'center',
      marginBottom: theme.spacing.medium,
    },
    
    impactValue: {
      fontSize: theme.fontSizes.xlarge,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.warning,
    },
    
    impactSubtext: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.warning,
      marginTop: theme.spacing.small,
    },
    
    predictionsCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.large,
    },
    
    predictionsTitle: {
      fontSize: theme.fontSizes.regular,
      fontWeight: theme.fontWeights.semibold,
      color: theme.colors.text,
      marginBottom: theme.spacing.large,
      textAlign: 'center',
    },
    
    predictionItem: {
      paddingVertical: theme.spacing.medium,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight,
    },
    
    predictionMonth: {
      fontSize: theme.fontSizes.regular,
      fontWeight: theme.fontWeights.semibold,
      color: theme.colors.text,
      marginBottom: theme.spacing.small,
    },
    
    predictionValues: {
      paddingLeft: theme.spacing.medium,
    },
    
    predictionExpenses: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.textSecondary,
    },
    
    predictionSubscriptions: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.textSecondary,
    },
    
    predictionTotal: {
      fontSize: theme.fontSizes.regular,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.text,
      marginTop: theme.spacing.tiny,
    },
    
    predictionsNote: {
      backgroundColor: theme.colors.primaryLight,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.medium,
      marginTop: theme.spacing.large,
    },
    
    noteText: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.primary,
      textAlign: 'center',
      lineHeight: theme.fontSizes.regular,
    },
    
    emptyPredictions: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.xlarge,
      alignItems: 'center',
    },
    
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.huge,
    },
    
    emptyIcon: {
      fontSize: 64,
      marginBottom: theme.spacing.large,
    },
    
    emptyTitle: {
      fontSize: theme.fontSizes.large,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.medium,
    },
    
    emptyText: {
      fontSize: theme.fontSizes.regular,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: theme.fontSizes.large,
      marginBottom: theme.spacing.large,
    },
  });