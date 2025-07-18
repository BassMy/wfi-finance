// src/screens/main/SubscriptionsScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Switch,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useAuth } from '../../hooks/useAuth';
import { 
  fetchSubscriptions, 
  addSubscription, 
  updateSubscription 
} from '../../store/slices/subscriptionsSlice';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Theme } from '../../styles/theme';
import { 
  Subscription, 
  SubscriptionInput, 
  SubscriptionPeriod, 
  SubscriptionCategory,
  ExpenseCategory 
} from '../../types';
import { formatCurrency, formatSubscriptionPeriod } from '../../utils/formatting';
import { validateAmount, validateDescription } from '../../utils/validation';
import { SUBSCRIPTION_CATEGORIES } from '../../utils/constants';
import { convertSubscriptionToMonthly } from '../../utils/calculations';

interface SubscriptionsScreenProps {
  theme: Theme;
}

export const SubscriptionsScreen: React.FC<SubscriptionsScreenProps> = ({ theme }) => {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  
  // Redux state
  const subscriptions = useAppSelector(state => state.subscriptions.subscriptions);
  const monthlyTotal = useAppSelector(state => state.subscriptions.monthlyTotal);
  const yearlyTotal = useAppSelector(state => state.subscriptions.yearlyTotal);
  const activeCount = useAppSelector(state => state.subscriptions.activeCount);
  const isLoading = useAppSelector(state => state.subscriptions.isLoading);
  const error = useAppSelector(state => state.subscriptions.error);

  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<SubscriptionCategory | 'all'>('all');
  const [showInactive, setShowInactive] = useState(false);

  // Formulaire d'ajout
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    period: 'monthly' as SubscriptionPeriod,
    category: 'other' as SubscriptionCategory,
    budgetCategory: 'wants' as ExpenseCategory,
    description: '',
  });
  const [formErrors, setFormErrors] = useState({
    name: '',
    price: '',
  });

  const styles = createSubscriptionsStyles(theme);

  // Charger les abonnements
  useEffect(() => {
    if (user) {
      dispatch(fetchSubscriptions(user.uid));
    }
  }, [user, dispatch]);

  const onRefresh = async () => {
    if (!user) return;
    setRefreshing(true);
    await dispatch(fetchSubscriptions(user.uid));
    setRefreshing(false);
  };

  // Filtrer les abonnements
  const getFilteredSubscriptions = () => {
    let filtered = subscriptions;

    // Filtre par statut actif/inactif
    if (!showInactive) {
      filtered = filtered.filter(sub => sub.isActive);
    }

    // Filtre par catégorie
    if (filterCategory !== 'all') {
      filtered = filtered.filter(sub => sub.category === filterCategory);
    }

    // Trier par prix mensuel décroissant
    return filtered.sort((a, b) => {
      const aMonthly = convertSubscriptionToMonthly(a.price, a.period);
      const bMonthly = convertSubscriptionToMonthly(b.price, b.period);
      return bMonthly - aMonthly;
    });
  };

  // Validation du formulaire
  const validateForm = () => {
    const newErrors = { name: '', price: '' };
    let isValid = true;

    const nameValidation = validateDescription(formData.name);
    if (!nameValidation.isValid) {
      newErrors.name = nameValidation.error || '';
      isValid = false;
    }

    const priceValidation = validateAmount(parseFloat(formData.price));
    if (!priceValidation.isValid) {
      newErrors.price = priceValidation.error || '';
      isValid = false;
    }

    setFormErrors(newErrors);
    return isValid;
  };

  // Ajouter un abonnement
  const handleAddSubscription = async () => {
    if (!validateForm() || !user) return;

    const subscriptionData: SubscriptionInput = {
      name: formData.name.trim(),
      price: parseFloat(formData.price),
      period: formData.period,
      category: formData.category,
      budgetCategory: formData.budgetCategory,
      description: formData.description.trim(),
    };

    try {
      const result = await dispatch(addSubscription({ 
        userId: user.uid, 
        subscription: subscriptionData 
      }));
      
      if (addSubscription.fulfilled.match(result)) {
        // Réinitialiser le formulaire
        setFormData({
          name: '',
          price: '',
          period: 'monthly',
          category: 'other',
          budgetCategory: 'wants',
          description: '',
        });
        setShowAddForm(false);
        Alert.alert('Succès', 'Abonnement ajouté avec succès !');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ajouter l\'abonnement');
    }
  };

  // Basculer le statut actif/inactif
  const toggleSubscriptionStatus = async (subscription: Subscription) => {
    if (!user) return;

    try {
      await dispatch(updateSubscription({
        subscriptionId: subscription.id,
        userId: user.uid,
        updates: { isActive: !subscription.isActive }
      }));
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier l\'abonnement');
    }
  };

  // Calculer l'impact d'un abonnement
  const calculateImpact = (subscription: Subscription) => {
    const monthlyAmount = convertSubscriptionToMonthly(subscription.price, subscription.period);
    const yearlyAmount = monthlyAmount * 12;
    
    // Estimation des heures de travail (basé sur 15€/h en moyenne)
    const estimatedHourlyRate = 15;
    const hoursPerMonth = monthlyAmount / estimatedHourlyRate;
    const hoursPerYear = yearlyAmount / estimatedHourlyRate;

    return {
      monthlyAmount,
      yearlyAmount,
      hoursPerMonth,
      hoursPerYear,
    };
  };

  const getCategoryInfo = (category: SubscriptionCategory) => {
    return SUBSCRIPTION_CATEGORIES.find(cat => cat.id === category) || {
      icon: '📦',
      name: 'Autre',
      color: theme.colors.textSecondary,
    };
  };

  const getBudgetCategoryColor = (category: ExpenseCategory) => {
    switch (category) {
      case 'needs': return theme.colors.needs;
      case 'wants': return theme.colors.wants;
      case 'savings': return theme.colors.savings;
      default: return theme.colors.textSecondary;
    }
  };

  const renderSubscriptionItem = ({ item }: { item: Subscription }) => {
    const impact = calculateImpact(item);
    const categoryInfo = getCategoryInfo(item.category);

    return (
      <View style={[
        styles.subscriptionItem,
        !item.isActive && styles.subscriptionItemInactive
      ]}>
        <View style={styles.subscriptionHeader}>
          <View style={styles.subscriptionInfo}>
            <View style={styles.subscriptionTitle}>
              <Text style={styles.subscriptionIcon}>{categoryInfo.icon}</Text>
              <Text style={styles.subscriptionName}>{item.name}</Text>
              {!item.isActive && (
                <Text style={styles.inactiveLabel}>INACTIF</Text>
              )}
            </View>
            
            {item.description && (
              <Text style={styles.subscriptionDescription}>{item.description}</Text>
            )}
            
            <View style={styles.subscriptionMeta}>
              <Text style={styles.subscriptionCategory}>
                {categoryInfo.name}
              </Text>
              <Text style={[
                styles.budgetCategory,
                { color: getBudgetCategoryColor(item.budgetCategory) }
              ]}>
                {item.budgetCategory === 'needs' ? 'Besoin' :
                 item.budgetCategory === 'wants' ? 'Envie' : 'Épargne'}
              </Text>
            </View>
          </View>

          <View style={styles.subscriptionActions}>
            <Switch
              value={item.isActive}
              onValueChange={() => toggleSubscriptionStatus(item)}
              trackColor={{ 
                false: theme.colors.borderLight, 
                true: theme.colors.success 
              }}
              thumbColor={item.isActive ? '#FFFFFF' : theme.colors.textTertiary}
            />
          </View>
        </View>

        <View style={styles.subscriptionPricing}>
          <View style={styles.priceInfo}>
            <Text style={styles.originalPrice}>
              {formatCurrency(item.price)} {formatSubscriptionPeriod(item.period)}
            </Text>
            {item.period !== 'monthly' && (
              <Text style={styles.monthlyPrice}>
                {formatCurrency(impact.monthlyAmount)} / mois
              </Text>
            )}
          </View>

          <View style={styles.impactInfo}>
            <Text style={styles.impactLabel}>Impact annuel :</Text>
            <Text style={styles.impactAmount}>
              {formatCurrency(impact.yearlyAmount)}
            </Text>
            <Text style={styles.impactHours}>
              ≈ {impact.hoursPerYear.toFixed(0)}h de travail
            </Text>
          </View>
        </View>

        {/* Prochaine facture */}
        <View style={styles.nextBilling}>
          <Text style={styles.nextBillingLabel}>
            Prochaine facture : {new Date(item.nextBillDate).toLocaleDateString('fr-FR')}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>💳</Text>
      <Text style={styles.emptyTitle}>Aucun abonnement</Text>
      <Text style={styles.emptyText}>
        {filterCategory !== 'all' || !showInactive
          ? 'Aucun abonnement ne correspond à vos critères'
          : 'Commencez par ajouter votre premier abonnement'
        }
      </Text>
      {filterCategory === 'all' && showInactive === false && (
        <Button
          title="Ajouter un abonnement"
          onPress={() => setShowAddForm(true)}
          theme={theme}
          style={styles.emptyButton}
        />
      )}
    </View>
  );

  if (isLoading && subscriptions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner 
          fullScreen 
          text="Chargement des abonnements..." 
          theme={theme} 
        />
      </SafeAreaView>
    );
  }

  const filteredSubscriptions = getFilteredSubscriptions();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>💳 Mes Abonnements</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddForm(!showAddForm)}
          >
            <Text style={styles.addButtonText}>
              {showAddForm ? '✕' : '+'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Résumé des coûts */}
        <View style={styles.costsContainer}>
          <View style={styles.costItem}>
            <Text style={styles.costAmount}>
              {formatCurrency(monthlyTotal)}
            </Text>
            <Text style={styles.costLabel}>Par mois</Text>
          </View>
          <View style={styles.costItem}>
            <Text style={styles.costAmount}>
              {formatCurrency(yearlyTotal)}
            </Text>
            <Text style={styles.costLabel}>Par an</Text>
          </View>
          <View style={styles.costItem}>
            <Text style={styles.costCount}>{activeCount}</Text>
            <Text style={styles.costLabel}>Actifs</Text>
          </View>
        </View>
      </View>

      {/* Formulaire d'ajout */}
      {showAddForm && (
        <View style={styles.addForm}>
          <Text style={styles.formTitle}>🆕 Nouvel abonnement</Text>
          
          <Input
            label="Nom de l'abonnement"
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            placeholder="Ex: Netflix, Spotify..."
            error={formErrors.name}
            theme={theme}
          />

          <View style={styles.formRow}>
            <Input
              label="Prix"
              value={formData.price}
              onChangeText={(text) => setFormData(prev => ({ ...prev, price: text }))}
              placeholder="0.00"
              keyboardType="numeric"
              error={formErrors.price}
              theme={theme}
              containerStyle={styles.priceInput}
            />

            {/* Sélection de période */}
            <View style={styles.periodSelector}>
              <Text style={styles.inputLabel}>Période</Text>
              <View style={styles.periodButtons}>
                {(['weekly', 'monthly', 'yearly'] as SubscriptionPeriod[]).map((period) => (
                  <TouchableOpacity
                    key={period}
                    style={[
                      styles.periodButton,
                      formData.period === period && styles.periodButtonActive
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, period }))}
                  >
                    <Text style={[
                      styles.periodButtonText,
                      formData.period === period && styles.periodButtonTextActive
                    ]}>
                      {period === 'weekly' ? 'Sem.' :
                       period === 'monthly' ? 'Mois' : 'An'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Sélection de catégorie */}
          <View style={styles.categorySelector}>
            <Text style={styles.inputLabel}>Catégorie</Text>
            <View style={styles.categoryGrid}>
              {SUBSCRIPTION_CATEGORIES.slice(0, 6).map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryCard,
                    formData.category === category.id && styles.categoryCardActive
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, category: category.id }))}
                >
                  <Text style={styles.categoryCardIcon}>{category.icon}</Text>
                  <Text style={styles.categoryCardText}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Budget catégorie */}
          <View style={styles.budgetSelector}>
            <Text style={styles.inputLabel}>Catégorie budgétaire</Text>
            <View style={styles.budgetButtons}>
              {(['needs', 'wants', 'savings'] as ExpenseCategory[]).map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.budgetButton,
                    formData.budgetCategory === category && styles.budgetButtonActive,
                    { borderColor: getBudgetCategoryColor(category) }
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, budgetCategory: category }))}
                >
                  <Text style={[
                    styles.budgetButtonText,
                    formData.budgetCategory === category && { 
                      color: getBudgetCategoryColor(category) 
                    }
                  ]}>
                    {category === 'needs' ? 'Besoin' :
                     category === 'wants' ? 'Envie' : 'Épargne'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Input
            label="Description (optionnel)"
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            placeholder="Détails supplémentaires..."
            theme={theme}
          />

          <View style={styles.formActions}>
            <Button
              title="Annuler"
              onPress={() => setShowAddForm(false)}
              variant="secondary"
              theme={theme}
              style={styles.formButton}
            />
            <Button
              title="Ajouter"
              onPress={handleAddSubscription}
              theme={theme}
              style={styles.formButton}
            />
          </View>
        </View>
      )}

      {/* Filtres */}
      <View style={styles.filtersContainer}>
        <View style={styles.filterRow}>
          <View style={styles.showInactiveToggle}>
            <Text style={styles.toggleLabel}>Voir inactifs</Text>
            <Switch
              value={showInactive}
              onValueChange={setShowInactive}
              trackColor={{ 
                false: theme.colors.borderLight, 
                true: theme.colors.primary 
              }}
              thumbColor={showInactive ? '#FFFFFF' : theme.colors.textTertiary}
            />
          </View>
        </View>

        <View style={styles.categoryFilters}>
          {(['all', ...SUBSCRIPTION_CATEGORIES.slice(0, 4).map(c => c.id)] as const).map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterChip,
                filterCategory === category && styles.filterChipActive
              ]}
              onPress={() => setFilterCategory(category as any)}
            >
              <Text style={[
                styles.filterChipText,
                filterCategory === category && styles.filterChipTextActive
              ]}>
                {category === 'all' ? 'Tous' :
                 SUBSCRIPTION_CATEGORIES.find(c => c.id === category)?.name || category}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Liste des abonnements */}
      <FlatList
        data={filteredSubscriptions}
        renderItem={renderSubscriptionItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const createSubscriptionsStyles = (theme: Theme) =>
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
    
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.medium,
    },
    
    title: {
      fontSize: theme.fontSizes.xlarge,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.text,
    },
    
    addButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    addButtonText: {
      color: '#FFFFFF',
      fontSize: theme.fontSizes.large,
      fontWeight: theme.fontWeights.bold,
    },
    
    costsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    
    costItem: {
      alignItems: 'center',
    },
    
    costAmount: {
      fontSize: theme.fontSizes.large,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.primary,
    },
    
    costCount: {
      fontSize: theme.fontSizes.large,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.text,
    },
    
    costLabel: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.tiny,
    },
    
    addForm: {
      backgroundColor: theme.colors.surface,
      margin: theme.spacing.large,
      borderRadius: theme.borderRadius.large,
      padding: theme.spacing.large,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    
    formTitle: {
      fontSize: theme.fontSizes.large,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.large,
      textAlign: 'center',
    },
    
    formRow: {
      flexDirection: 'row',
      gap: theme.spacing.medium,
      alignItems: 'flex-end',
    },
    
    priceInput: {
      flex: 1,
    },
    
    periodSelector: {
      flex: 1,
    },
    
    inputLabel: {
      fontSize: theme.fontSizes.medium,
      fontWeight: theme.fontWeights.medium,
      color: theme.colors.text,
      marginBottom: theme.spacing.small,
    },
    
    periodButtons: {
      flexDirection: 'row',
      borderRadius: theme.borderRadius.medium,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
    },
    
    periodButton: {
      flex: 1,
      paddingVertical: theme.spacing.medium,
      paddingHorizontal: theme.spacing.small,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
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
    
    categorySelector: {
      marginTop: theme.spacing.medium,
    },
    
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.small,
      marginTop: theme.spacing.small,
    },
    
    categoryCard: {
      width: '30%',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.medium,
      alignItems: 'center',
    },
    
    categoryCardActive: {
      backgroundColor: theme.colors.primaryLight,
      borderColor: theme.colors.primary,
    },
    
    categoryCardIcon: {
      fontSize: theme.fontSizes.large,
      marginBottom: theme.spacing.tiny,
    },
    
    categoryCardText: {
      fontSize: theme.fontSizes.tiny,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    
    budgetSelector: {
      marginTop: theme.spacing.medium,
    },
    
    budgetButtons: {
      flexDirection: 'row',
      gap: theme.spacing.small,
      marginTop: theme.spacing.small,
    },
    
    budgetButton: {
      flex: 1,
      borderWidth: 1,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.medium,
      alignItems: 'center',
    },
    
    budgetButtonActive: {
      backgroundColor: theme.colors.primaryLight,
    },
    
    budgetButtonText: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.textSecondary,
      fontWeight: theme.fontWeights.medium,
    },
    
    formActions: {
      flexDirection: 'row',
      gap: theme.spacing.medium,
      marginTop: theme.spacing.large,
    },
    
    formButton: {
      flex: 1,
    },
    
    filtersContainer: {
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.large,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    
    filterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.medium,
    },
    
    showInactiveToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.medium,
    },
    
    toggleLabel: {
      fontSize: theme.fontSizes.regular,
      color: theme.colors.text,
    },
    
    categoryFilters: {
      flexDirection: 'row',
      gap: theme.spacing.small,
    },
    
    filterChip: {
      paddingVertical: theme.spacing.small,
      paddingHorizontal: theme.spacing.medium,
      borderRadius: theme.borderRadius.large,
      backgroundColor: theme.colors.borderLight,
    },
    
    filterChipActive: {
      backgroundColor: theme.colors.primary,
    },
    
    filterChipText: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.textSecondary,
      fontWeight: theme.fontWeights.medium,
    },
    
    filterChipTextActive: {
      color: '#FFFFFF',
    },
    
    listContainer: {
      padding: theme.spacing.large,
      paddingTop: theme.spacing.medium,
    },
    
    subscriptionItem: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.medium,
      marginBottom: theme.spacing.medium,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    
    subscriptionItemInactive: {
      opacity: 0.6,
    },
    
    subscriptionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.medium,
    },
    
    subscriptionInfo: {
      flex: 1,
    },
    
    subscriptionTitle: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.small,
    },
    
    subscriptionIcon: {
      fontSize: theme.fontSizes.large,
      marginRight: theme.spacing.small,
    },
    
    subscriptionName: {
      fontSize: theme.fontSizes.regular,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.text,
      flex: 1,
    },
    
    inactiveLabel: {
      fontSize: theme.fontSizes.tiny,
      color: theme.colors.textTertiary,
      backgroundColor: theme.colors.borderLight,
      paddingHorizontal: theme.spacing.small,
      paddingVertical: theme.spacing.tiny,
      borderRadius: theme.borderRadius.small,
    },
    
    subscriptionDescription: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.small,
    },
    
    subscriptionMeta: {
      flexDirection: 'row',
      gap: theme.spacing.medium,
    },
    
    subscriptionCategory: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.textTertiary,
    },
    
    budgetCategory: {
      fontSize: theme.fontSizes.small,
      fontWeight: theme.fontWeights.medium,
    },
    
    subscriptionActions: {
      alignItems: 'center',
    },
    
    subscriptionPricing: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.small,
    },
    
    priceInfo: {
      flex: 1,
    },
    
    originalPrice: {
      fontSize: theme.fontSizes.regular,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.text,
    },
    
    monthlyPrice: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.textSecondary,
    },
    
    impactInfo: {
      alignItems: 'flex-end',
    },
    
    impactLabel: {
      fontSize: theme.fontSizes.tiny,
      color: theme.colors.textTertiary,
    },
    
    impactAmount: {
      fontSize: theme.fontSizes.medium,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.warning,
    },
    
    impactHours: {
      fontSize: theme.fontSizes.tiny,
      color: theme.colors.textTertiary,
    },
    
    nextBilling: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.borderLight,
      paddingTop: theme.spacing.small,
    },
    
    nextBillingLabel: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    
    emptyState: {
      alignItems: 'center',
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
    
    emptyButton: {
      paddingHorizontal: theme.spacing.xlarge,
    },
    
    errorContainer: {
      backgroundColor: theme.colors.dangerLight,
      padding: theme.spacing.medium,
      marginHorizontal: theme.spacing.large,
      borderRadius: theme.borderRadius.medium,
      borderWidth: 1,
      borderColor: theme.colors.danger,
    },
    
    errorText: {
      color: theme.colors.danger,
      fontSize: theme.fontSizes.small,
      textAlign: 'center',
    },
  });