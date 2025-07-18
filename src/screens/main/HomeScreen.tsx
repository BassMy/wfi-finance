// src/screens/main/HomeScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useAuth } from '../../hooks/useAuth';
import { fetchBudget, calculateCurrentStats } from '../../store/slices/budgetSlice';
import { fetchExpenses } from '../../store/slices/expensesSlice';
import { fetchSubscriptions } from '../../store/slices/subscriptionsSlice';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Button } from '../../components/common/Button';
import { Theme } from '../../styles/theme';
import { formatCurrency, formatPercentage } from '../../utils/formatting';

interface HomeScreenProps {
  theme: Theme;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ theme }) => {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Redux state
  const budget = useAppSelector(state => state.budget.budget);
  const budgetStats = useAppSelector(state => state.budget.stats);
  const budgetLoading = useAppSelector(state => state.budget.isLoading);
  const expenses = useAppSelector(state => state.expenses.expenses);
  const expensesTotals = useAppSelector(state => state.expenses.totals);
  const subscriptions = useAppSelector(state => state.subscriptions.subscriptions);
  const subscriptionsTotal = useAppSelector(state => state.subscriptions.monthlyTotal);

  const styles = createHomeStyles(theme);

  // Charger les données initiales
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
      
      // Calculer les stats après avoir chargé les données
      dispatch(calculateCurrentStats());
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getBudgetStatus = () => {
    if (!budget || !budgetStats) return 'unknown';
    
    const overallUsage = (budgetStats.totalExpenses / budgetStats.totalIncome) * 100;
    
    if (overallUsage <= 80) return 'safe';
    if (overallUsage <= 100) return 'warning';
    return 'danger';
  };

  const getStatusColor = () => {
    const status = getBudgetStatus();
    switch (status) {
      case 'safe': return theme.colors.success;
      case 'warning': return theme.colors.warning;
      case 'danger': return theme.colors.danger;
      default: return theme.colors.textSecondary;
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '☀️ Bonjour';
    if (hour < 18) return '🌤️ Bon après-midi';
    return '🌙 Bonsoir';
  };

  if (budgetLoading && !budget) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner 
          fullScreen 
          text="Chargement de votre dashboard..." 
          theme={theme} 
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header avec salutation */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {getGreeting()}, {user?.firstName} !
          </Text>
          <Text style={styles.subtitle}>
            Voici un aperçu de vos finances
          </Text>
        </View>

        {/* Vue d'ensemble budget */}
        {budget && budgetStats ? (
          <>
            <View style={styles.budgetOverview}>
              <View style={styles.budgetHeader}>
                <Text style={styles.sectionTitle}>💰 Budget du mois</Text>
                <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
              </View>
              
              <View style={styles.budgetStats}>
                <View style={styles.budgetStat}>
                  <Text style={styles.budgetAmount}>
                    {formatCurrency(budgetStats.remaining)}
                  </Text>
                  <Text style={styles.budgetLabel}>Restant</Text>
                </View>
                
                <View style={styles.budgetStat}>
                  <Text style={styles.budgetAmount}>
                    {formatCurrency(budgetStats.totalExpenses)}
                  </Text>
                  <Text style={styles.budgetLabel}>Dépensé</Text>
                </View>
                
                <View style={styles.budgetStat}>
                  <Text style={styles.budgetAmount}>
                    {formatCurrency(budgetStats.totalIncome)}
                  </Text>
                  <Text style={styles.budgetLabel}>Budget total</Text>
                </View>
              </View>

              {/* Barres de progression par catégorie */}
              <View style={styles.categoryProgress}>
                <View style={styles.categoryItem}>
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryName}>🏠 Besoins</Text>
                    <Text style={styles.categoryPercentage}>
                      {formatPercentage(budgetStats.percentageUsed.needs)}
                    </Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: `${Math.min(100, budgetStats.percentageUsed.needs)}%`,
                          backgroundColor: theme.colors.needs 
                        }
                      ]} 
                    />
                  </View>
                </View>

                <View style={styles.categoryItem}>
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryName}>🎯 Envies</Text>
                    <Text style={styles.categoryPercentage}>
                      {formatPercentage(budgetStats.percentageUsed.wants)}
                    </Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: `${Math.min(100, budgetStats.percentageUsed.wants)}%`,
                          backgroundColor: theme.colors.wants 
                        }
                      ]} 
                    />
                  </View>
                </View>

                <View style={styles.categoryItem}>
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryName}>💎 Épargne</Text>
                    <Text style={styles.categoryPercentage}>
                      {formatPercentage(budgetStats.percentageUsed.savings)}
                    </Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: `${Math.min(100, budgetStats.percentageUsed.savings)}%`,
                          backgroundColor: theme.colors.savings 
                        }
                      ]} 
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Résumé rapide */}
            <View style={styles.quickStats}>
              <View style={styles.statCard}>
                <Text style={styles.statIcon}>💸</Text>
                <Text style={styles.statValue}>{expenses.length}</Text>
                <Text style={styles.statLabel}>Dépenses ce mois</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statIcon}>💳</Text>
                <Text style={styles.statValue}>{subscriptions.filter(s => s.isActive).length}</Text>
                <Text style={styles.statLabel}>Abonnements actifs</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statIcon}>📊</Text>
                <Text style={styles.statValue}>{formatCurrency(subscriptionsTotal, 'EUR', { compact: true })}</Text>
                <Text style={styles.statLabel}>Coût abonnements</Text>
              </View>
            </View>
          </>
        ) : (
          /* Pas de budget configuré */
          <View style={styles.noBudgetCard}>
            <Text style={styles.noBudgetIcon}>🎯</Text>
            <Text style={styles.noBudgetTitle}>Configurez votre budget</Text>
            <Text style={styles.noBudgetText}>
              Commencez par définir votre salaire et votre méthode budgétaire pour profiter de toutes les fonctionnalités.
            </Text>
            <Button
              title="Configurer mon budget"
              onPress={() => {/* Navigation vers budget setup */}}
              theme={theme}
              style={styles.setupButton}
            />
          </View>
        )}

        {/* Actions rapides */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>⚡ Actions rapides</Text>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionCard}>
              <Text style={styles.actionIcon}>💸</Text>
              <Text style={styles.actionText}>Ajouter une dépense</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <Text style={styles.actionIcon}>💳</Text>
              <Text style={styles.actionText}>Nouvel abonnement</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionText}>Voir les analyses</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <Text style={styles.actionIcon}>⚙️</Text>
              <Text style={styles.actionText}>Paramètres</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dépenses récentes */}
        {expenses.length > 0 && (
          <View style={styles.recentExpenses}>
            <Text style={styles.sectionTitle}>🕒 Dépenses récentes</Text>
            {expenses.slice(0, 3).map((expense: { id: React.Key | null | undefined; description: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; date: string | number | Date; amount: number; category: string; }) => (
              <View key={expense.id} style={styles.expenseItem}>
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseDescription}>{expense.description}</Text>
                  <Text style={styles.expenseDate}>
                    {new Date(expense.date).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
                <View style={styles.expenseAmount}>
                  <Text style={styles.expensePrice}>
                    {formatCurrency(expense.amount)}
                  </Text>
                  <Text style={[
                    styles.expenseCategory,
                    { color: expense.category === 'needs' ? theme.colors.needs : 
                             expense.category === 'wants' ? theme.colors.wants : 
                             theme.colors.savings }
                  ]}>
                    {expense.category === 'needs' ? 'Besoin' : 
                     expense.category === 'wants' ? 'Envie' : 'Épargne'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const createHomeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    
    scrollView: {
      flex: 1,
    },
    
    header: {
      padding: theme.spacing.large,
      paddingBottom: theme.spacing.medium,
    },
    
    greeting: {
      fontSize: theme.fontSizes.xlarge,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.small,
    },
    
    subtitle: {
      fontSize: theme.fontSizes.regular,
      color: theme.colors.textSecondary,
    },
    
    budgetOverview: {
      backgroundColor: theme.colors.surface,
      margin: theme.spacing.large,
      marginTop: 0,
      borderRadius: theme.borderRadius.large,
      padding: theme.spacing.large,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.isDark ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    
    budgetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.large,
    },
    
    sectionTitle: {
      fontSize: theme.fontSizes.large,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.text,
    },
    
    statusIndicator: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    
    budgetStats: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.large,
    },
    
    budgetStat: {
      alignItems: 'center',
    },
    
    budgetAmount: {
      fontSize: theme.fontSizes.large,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.text,
    },
    
    budgetLabel: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.tiny,
    },
    
    categoryProgress: {
      gap: theme.spacing.medium,
    },
    
    categoryItem: {
      gap: theme.spacing.small,
    },
    
    categoryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    
    categoryName: {
      fontSize: theme.fontSizes.medium,
      fontWeight: theme.fontWeights.medium,
      color: theme.colors.text,
    },
    
    categoryPercentage: {
      fontSize: theme.fontSizes.small,
      fontWeight: theme.fontWeights.semibold,
      color: theme.colors.textSecondary,
    },
    
    progressBar: {
      height: 8,
      backgroundColor: theme.colors.borderLight,
      borderRadius: 4,
      overflow: 'hidden',
    },
    
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
    
    quickStats: {
      flexDirection: 'row',
      marginHorizontal: theme.spacing.large,
      marginBottom: theme.spacing.large,
      gap: theme.spacing.medium,
    },
    
    statCard: {
      flex: 1,
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
      fontSize: 24,
      marginBottom: theme.spacing.small,
    },
    
    statValue: {
      fontSize: theme.fontSizes.large,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.text,
    },
    
    statLabel: {
      fontSize: theme.fontSizes.tiny,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: theme.spacing.tiny,
    },
    
    noBudgetCard: {
      backgroundColor: theme.colors.surface,
      margin: theme.spacing.large,
      borderRadius: theme.borderRadius.large,
      padding: theme.spacing.xlarge,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.colors.primary,
      borderStyle: 'dashed',
    },
    
    noBudgetIcon: {
      fontSize: 48,
      marginBottom: theme.spacing.medium,
    },
    
    noBudgetTitle: {
      fontSize: theme.fontSizes.large,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.medium,
      textAlign: 'center',
    },
    
    noBudgetText: {
      fontSize: theme.fontSizes.regular,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: theme.fontSizes.large,
      marginBottom: theme.spacing.large,
    },
    
    setupButton: {
      paddingHorizontal: theme.spacing.xlarge,
    },
    
    quickActions: {
      margin: theme.spacing.large,
      marginTop: 0,
    },
    
    actionButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.medium,
      marginTop: theme.spacing.medium,
    },
    
    actionCard: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.large,
      alignItems: 'center',
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    
    actionIcon: {
      fontSize: 32,
      marginBottom: theme.spacing.small,
    },
    
    actionText: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.text,
      textAlign: 'center',
      fontWeight: theme.fontWeights.medium,
    },
    
    recentExpenses: {
      margin: theme.spacing.large,
      marginTop: 0,
    },
    
    expenseItem: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.medium,
      marginTop: theme.spacing.medium,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    
    expenseInfo: {
      flex: 1,
    },
    
    expenseDescription: {
      fontSize: theme.fontSizes.regular,
      fontWeight: theme.fontWeights.medium,
      color: theme.colors.text,
    },
    
    expenseDate: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.tiny,
    },
    
    expenseAmount: {
      alignItems: 'flex-end',
    },
    
    expensePrice: {
      fontSize: theme.fontSizes.regular,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.text,
    },
    
    expenseCategory: {
      fontSize: theme.fontSizes.tiny,
      fontWeight: theme.fontWeights.medium,
      marginTop: theme.spacing.tiny,
    },
  });