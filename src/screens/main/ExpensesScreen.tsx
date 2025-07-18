// src/screens/main/ExpensesScreen.tsx
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
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useAuth } from '../../hooks/useAuth';
import { fetchExpenses, addExpense, deleteExpense } from '../../store/slices/expensesSlice';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Theme } from '../../styles/theme';
import { Expense, ExpenseCategory, ExpenseInput } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatting';
import { validateAmount, validateDescription } from '../../utils/validation';

interface ExpensesScreenProps {
  theme: Theme;
}

export const ExpensesScreen: React.FC<ExpensesScreenProps> = ({ theme }) => {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  
  // Redux state
  const expenses = useAppSelector(state => state.expenses.expenses);
  const totals = useAppSelector(state => state.expenses.totals);
  const isLoading = useAppSelector(state => state.expenses.isLoading);
  const error = useAppSelector(state => state.expenses.error);

  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');

  // Formulaire d'ajout
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'needs' as ExpenseCategory,
    date: new Date().toISOString().split('T')[0],
  });
  const [formErrors, setFormErrors] = useState({
    description: '',
    amount: '',
  });

  const styles = createExpensesStyles(theme);

  // Charger les dépenses
  useEffect(() => {
    if (user) {
      dispatch(fetchExpenses(user.uid));
    }
  }, [user, dispatch]);

  const onRefresh = async () => {
    if (!user) return;
    setRefreshing(true);
    await dispatch(fetchExpenses(user.uid));
    setRefreshing(false);
  };

  // Filtrer et trier les dépenses
  const getFilteredExpenses = () => {
    let filtered = expenses;

    // Filtre par recherche
    if (searchQuery) {
      filtered = filtered.filter(expense =>
        expense.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtre par catégorie
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(expense => expense.category === selectedCategory);
    }

    // Tri
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else {
        return b.amount - a.amount;
      }
    });

    return filtered;
  };

  // Validation du formulaire
  const validateForm = () => {
    const newErrors = { description: '', amount: '' };
    let isValid = true;

    const descValidation = validateDescription(formData.description);
    if (!descValidation.isValid) {
      newErrors.description = descValidation.error || '';
      isValid = false;
    }

    const amountValidation = validateAmount(parseFloat(formData.amount));
    if (!amountValidation.isValid) {
      newErrors.amount = amountValidation.error || '';
      isValid = false;
    }

    setFormErrors(newErrors);
    return isValid;
  };

  // Ajouter une dépense
  const handleAddExpense = async () => {
    if (!validateForm() || !user) return;

    const expenseData: ExpenseInput = {
      description: formData.description.trim(),
      amount: parseFloat(formData.amount),
      category: formData.category,
      date: formData.date,
    };

    try {
      const result = await dispatch(addExpense({ 
        userId: user.uid, 
        expense: expenseData 
      }));
      
      if (addExpense.fulfilled.match(result)) {
        // Réinitialiser le formulaire
        setFormData({
          description: '',
          amount: '',
          category: 'needs',
          date: new Date().toISOString().split('T')[0],
        });
        setShowAddForm(false);
        Alert.alert('Succès', 'Dépense ajoutée avec succès !');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ajouter la dépense');
    }
  };

  // Supprimer une dépense
  const handleDeleteExpense = (expense: Expense) => {
    Alert.alert(
      'Supprimer la dépense',
      `Êtes-vous sûr de vouloir supprimer "${expense.description}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            try {
              await dispatch(deleteExpense({ 
                expenseId: expense.id, 
                userId: user.uid 
              }));
              Alert.alert('Succès', 'Dépense supprimée');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer la dépense');
            }
          },
        },
      ]
    );
  };

  const getCategoryIcon = (category: ExpenseCategory) => {
    switch (category) {
      case 'needs': return '🏠';
      case 'wants': return '🎯';
      case 'savings': return '💎';
      default: return '💸';
    }
  };

  const getCategoryColor = (category: ExpenseCategory) => {
    switch (category) {
      case 'needs': return theme.colors.needs;
      case 'wants': return theme.colors.wants;
      case 'savings': return theme.colors.savings;
      default: return theme.colors.textSecondary;
    }
  };

  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <TouchableOpacity 
      style={styles.expenseItem}
      onLongPress={() => handleDeleteExpense(item)}
    >
      <View style={styles.expenseHeader}>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseDescription}>{item.description}</Text>
          <Text style={styles.expenseDate}>
            {formatDate(item.date, 'medium')}
          </Text>
        </View>
        <View style={styles.expenseAmount}>
          <Text style={styles.expensePrice}>
            {formatCurrency(item.amount)}
          </Text>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryIcon}>
              {getCategoryIcon(item.category)}
            </Text>
            <Text style={[
              styles.categoryText,
              { color: getCategoryColor(item.category) }
            ]}>
              {item.category === 'needs' ? 'Besoin' : 
               item.category === 'wants' ? 'Envie' : 'Épargne'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>💸</Text>
      <Text style={styles.emptyTitle}>Aucune dépense</Text>
      <Text style={styles.emptyText}>
        {searchQuery || selectedCategory !== 'all' 
          ? 'Aucune dépense ne correspond à vos critères'
          : 'Commencez par ajouter votre première dépense'
        }
      </Text>
      {!searchQuery && selectedCategory === 'all' && (
        <Button
          title="Ajouter une dépense"
          onPress={() => setShowAddForm(true)}
          theme={theme}
          style={styles.emptyButton}
        />
      )}
    </View>
  );

  if (isLoading && expenses.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner 
          fullScreen 
          text="Chargement des dépenses..." 
          theme={theme} 
        />
      </SafeAreaView>
    );
  }

  const filteredExpenses = getFilteredExpenses();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>💸 Mes Dépenses</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddForm(!showAddForm)}
          >
            <Text style={styles.addButtonText}>
              {showAddForm ? '✕' : '+'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Résumé des totaux */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalItem}>
            <Text style={styles.totalAmount}>
              {formatCurrency(totals.total)}
            </Text>
            <Text style={styles.totalLabel}>Total ce mois</Text>
          </View>
          <View style={styles.totalItem}>
            <Text style={styles.totalCount}>{expenses.length}</Text>
            <Text style={styles.totalLabel}>Dépenses</Text>
          </View>
        </View>
      </View>

      {/* Formulaire d'ajout */}
      {showAddForm && (
        <View style={styles.addForm}>
          <Text style={styles.formTitle}>🆕 Nouvelle dépense</Text>
          
          <Input
            label="Description"
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            placeholder="Ex: Courses, Restaurant..."
            error={formErrors.description}
            theme={theme}
          />

          <View style={styles.formRow}>
            <Input
              label="Montant"
              value={formData.amount}
              onChangeText={(text) => setFormData(prev => ({ ...prev, amount: text }))}
              placeholder="0.00"
              keyboardType="numeric"
              error={formErrors.amount}
              theme={theme}
              containerStyle={styles.amountInput}
            />

            <View style={styles.dateInput}>
              <Text style={styles.inputLabel}>Date</Text>
              <Input
                value={formData.date}
                onChangeText={(text) => setFormData(prev => ({ ...prev, date: text }))}
                placeholder="YYYY-MM-DD"
                theme={theme}
              />
            </View>
          </View>

          {/* Sélection de catégorie */}
          <View style={styles.categorySelector}>
            <Text style={styles.inputLabel}>Catégorie</Text>
            <View style={styles.categoryButtons}>
              {(['needs', 'wants', 'savings'] as ExpenseCategory[]).map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    formData.category === category && styles.categoryButtonActive,
                    { borderColor: getCategoryColor(category) }
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, category }))}
                >
                  <Text style={styles.categoryButtonIcon}>
                    {getCategoryIcon(category)}
                  </Text>
                  <Text style={[
                    styles.categoryButtonText,
                    formData.category === category && { color: getCategoryColor(category) }
                  ]}>
                    {category === 'needs' ? 'Besoin' : 
                     category === 'wants' ? 'Envie' : 'Épargne'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

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
              onPress={handleAddExpense}
              theme={theme}
              style={styles.formButton}
            />
          </View>
        </View>
      )}

      {/* Filtres et recherche */}
      <View style={styles.filtersContainer}>
        <Input
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Rechercher une dépense..."
          leftIcon="🔍"
          theme={theme}
          containerStyle={styles.searchInput}
        />

        <View style={styles.filterButtons}>
          {(['all', 'needs', 'wants', 'savings'] as const).map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterButton,
                selectedCategory === category && styles.filterButtonActive
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.filterButtonText,
                selectedCategory === category && styles.filterButtonTextActive
              ]}>
                {category === 'all' ? 'Toutes' :
                 category === 'needs' ? '🏠 Besoins' :
                 category === 'wants' ? '🎯 Envies' : '💎 Épargne'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Trier par :</Text>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'date' && styles.sortButtonActive]}
            onPress={() => setSortBy('date')}
          >
            <Text style={styles.sortButtonText}>Date</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'amount' && styles.sortButtonActive]}
            onPress={() => setSortBy('amount')}
          >
            <Text style={styles.sortButtonText}>Montant</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Liste des dépenses */}
      <FlatList
        data={filteredExpenses}
        renderItem={renderExpenseItem}
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

const createExpensesStyles = (theme: Theme) =>
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
    
    totalsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    
    totalItem: {
      alignItems: 'center',
    },
    
    totalAmount: {
      fontSize: theme.fontSizes.large,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.primary,
    },
    
    totalCount: {
      fontSize: theme.fontSizes.large,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.text,
    },
    
    totalLabel: {
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
    },
    
    amountInput: {
      flex: 1,
    },
    
    dateInput: {
      flex: 1,
    },
    
    inputLabel: {
      fontSize: theme.fontSizes.medium,
      fontWeight: theme.fontWeights.medium,
      color: theme.colors.text,
      marginBottom: theme.spacing.small,
    },
    
    categorySelector: {
      marginTop: theme.spacing.medium,
    },
    
    categoryButtons: {
      flexDirection: 'row',
      gap: theme.spacing.small,
      marginTop: theme.spacing.small,
    },
    
    categoryButton: {
      flex: 1,
      borderWidth: 1,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.medium,
      alignItems: 'center',
    },
    
    categoryButtonActive: {
      backgroundColor: theme.colors.primaryLight,
    },
    
    categoryButtonIcon: {
      fontSize: theme.fontSizes.large,
      marginBottom: theme.spacing.tiny,
    },
    
    categoryButtonText: {
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
    
    searchInput: {
      marginBottom: theme.spacing.medium,
    },
    
    filterButtons: {
      flexDirection: 'row',
      gap: theme.spacing.small,
      marginBottom: theme.spacing.medium,
    },
    
    filterButton: {
      flex: 1,
      paddingVertical: theme.spacing.small,
      paddingHorizontal: theme.spacing.medium,
      borderRadius: theme.borderRadius.medium,
      backgroundColor: theme.colors.borderLight,
      alignItems: 'center',
    },
    
    filterButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    
    filterButtonText: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.textSecondary,
      fontWeight: theme.fontWeights.medium,
    },
    
    filterButtonTextActive: {
      color: '#FFFFFF',
    },
    
    sortContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.small,
    },
    
    sortLabel: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.textSecondary,
    },
    
    sortButton: {
      paddingVertical: theme.spacing.small,
      paddingHorizontal: theme.spacing.medium,
      borderRadius: theme.borderRadius.small,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    
    sortButtonActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    
    sortButtonText: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.textSecondary,
    },
    
    listContainer: {
      padding: theme.spacing.large,
      paddingTop: theme.spacing.medium,
    },
    
    expenseItem: {
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
    
    expenseHeader: {
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
    
    categoryTag: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing.tiny,
    },
    
    categoryIcon: {
      fontSize: theme.fontSizes.small,
      marginRight: theme.spacing.tiny,
    },
    
    categoryText: {
      fontSize: theme.fontSizes.tiny,
      fontWeight: theme.fontWeights.medium,
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