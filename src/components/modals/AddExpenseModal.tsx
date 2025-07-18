// src/components/modals/AddExpenseModal.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { useAppDispatch } from '../../store/hooks';
import { useAuth } from '../../hooks/useAuth';
import { addExpense } from '../../store/slices/expensesSlice';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Theme } from '../../styles/theme';
import { ExpenseCategory, ExpenseInput } from '../../types/expense.types.ts';
import { validateAmount, validateDescription } from '../../utils/validation';

interface AddExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  theme: Theme;
  initialCategory?: ExpenseCategory;
  onSuccess?: (expense: any) => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  visible,
  onClose,
  theme,
  initialCategory = 'needs',
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const { user } = useAuth();

  // Animation values
  const [slideAnim] = useState(new Animated.Value(0));
  const [opacityAnim] = useState(new Animated.Value(0));

  // Form state
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: initialCategory,
    date: new Date().toISOString().split('T')[0],
  });

  const [formErrors, setFormErrors] = useState({
    description: '',
    amount: '',
  });

  const [isLoading, setIsLoading] = useState(false);

  const styles = createModalStyles(theme);

  // Animation d'ouverture/fermeture
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Réinitialiser le formulaire quand la modal s'ouvre
  useEffect(() => {
    if (visible) {
      setFormData({
        description: '',
        amount: '',
        category: initialCategory,
        date: new Date().toISOString().split('T')[0],
      });
      setFormErrors({ description: '', amount: '' });
    }
  }, [visible, initialCategory]);

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

  const handleSubmit = async () => {
    if (!validateForm() || !user) return;

    setIsLoading(true);

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
        onSuccess?.(result.payload);
        onClose();
        Alert.alert('Succès', 'Dépense ajoutée avec succès !');
      } else {
        Alert.alert('Erreur', 'Impossible d\'ajouter la dépense');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur inattendue s\'est produite');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    onClose();
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
      default: return theme.colors.primary;
    }
  };

  const getCategoryName = (category: ExpenseCategory) => {
    switch (category) {
      case 'needs': return 'Besoin';
      case 'wants': return 'Envie';
      case 'savings': return 'Épargne';
      default: return 'Dépense';
    }
  };

  // Suggestions de dépenses courantes
  const commonExpenses = [
    { description: 'Courses alimentaires', category: 'needs' as ExpenseCategory },
    { description: 'Essence', category: 'needs' as ExpenseCategory },
    { description: 'Restaurant', category: 'wants' as ExpenseCategory },
    { description: 'Café', category: 'wants' as ExpenseCategory },
    { description: 'Cinéma', category: 'wants' as ExpenseCategory },
    { description: 'Épargne mensuelle', category: 'savings' as ExpenseCategory },
  ];

  const handleSuggestionPress = (suggestion: typeof commonExpenses[0]) => {
    setFormData(prev => ({
      ...prev,
      description: suggestion.description,
      category: suggestion.category,
    }));
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View 
          style={[
            styles.overlay,
            {
              opacity: opacityAnim,
            }
          ]}
        >
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.keyboardView}
            >
              <Animated.View
                style={[
                  styles.modalContainer,
                  {
                    transform: [
                      {
                        translateY: slideAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [300, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {/* Header */}
                <View style={styles.header}>
                  <Text style={styles.title}>💸 Nouvelle dépense</Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={handleClose}
                    disabled={isLoading}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.content}>
                  {/* Formulaire */}
                  <Input
                    label="Description"
                    value={formData.description}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                    placeholder="Ex: Courses, Restaurant..."
                    error={formErrors.description}
                    theme={theme}
                    autoFocus={true}
                  />

                  <View style={styles.amountRow}>
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

                    <View style={styles.dateContainer}>
                      <Text style={styles.inputLabel}>Date</Text>
                      <TouchableOpacity style={styles.dateButton}>
                        <Text style={styles.dateText}>
                          {new Date(formData.date).toLocaleDateString('fr-FR')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Sélecteur de catégorie */}
                  <View style={styles.categorySection}>
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
                          <Text style={styles.categoryIcon}>
                            {getCategoryIcon(category)}
                          </Text>
                          <Text style={[
                            styles.categoryText,
                            formData.category === category && { 
                              color: getCategoryColor(category),
                              fontWeight: theme.fontWeights.bold 
                            }
                          ]}>
                            {getCategoryName(category)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Suggestions */}
                  <View style={styles.suggestionsSection}>
                    <Text style={styles.suggestionsTitle}>💡 Suggestions</Text>
                    <View style={styles.suggestionsList}>
                      {commonExpenses.slice(0, 4).map((suggestion, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.suggestionButton}
                          onPress={() => handleSuggestionPress(suggestion)}
                        >
                          <Text style={styles.suggestionIcon}>
                            {getCategoryIcon(suggestion.category)}
                          </Text>
                          <Text style={styles.suggestionText}>
                            {suggestion.description}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={styles.actions}>
                    <Button
                      title="Annuler"
                      onPress={handleClose}
                      variant="secondary"
                      theme={theme}
                      style={styles.actionButton}
                      disabled={isLoading}
                    />
                    <Button
                      title="Ajouter"
                      onPress={handleSubmit}
                      theme={theme}
                      style={styles.actionButton}
                      loading={isLoading}
                      disabled={isLoading}
                    />
                  </View>
                </View>
              </Animated.View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const createModalStyles = (theme: Theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: theme.colors.overlay,
      justifyContent: 'flex-end',
    },
    
    keyboardView: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    
    modalContainer: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: theme.borderRadius.xlarge,
      borderTopRightRadius: theme.borderRadius.xlarge,
      maxHeight: '90%',
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 12,
    },
    
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.large,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight,
    },
    
    title: {
      fontSize: theme.fontSizes.large,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.text,
    },
    
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.borderLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    closeButtonText: {
      fontSize: theme.fontSizes.regular,
      color: theme.colors.textSecondary,
    },
    
    content: {
      padding: theme.spacing.large,
    },
    
    amountRow: {
      flexDirection: 'row',
      gap: theme.spacing.medium,
      alignItems: 'flex-end',
    },
    
    amountInput: {
      flex: 2,
    },
    
    dateContainer: {
      flex: 1,
    },
    
    inputLabel: {
      fontSize: theme.fontSizes.medium,
      fontWeight: theme.fontWeights.medium,
      color: theme.colors.text,
      marginBottom: theme.spacing.small,
    },
    
    dateButton: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.medium,
      backgroundColor: theme.colors.background,
      minHeight: 44,
      justifyContent: 'center',
    },
    
    dateText: {
      fontSize: theme.fontSizes.regular,
      color: theme.colors.text,
    },
    
    categorySection: {
      marginTop: theme.spacing.medium,
    },
    
    categoryButtons: {
      flexDirection: 'row',
      gap: theme.spacing.small,
      marginTop: theme.spacing.small,
    },
    
    categoryButton: {
      flex: 1,
      borderWidth: 2,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.medium,
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    
    categoryButtonActive: {
      backgroundColor: theme.colors.primaryLight,
    },
    
    categoryIcon: {
      fontSize: theme.fontSizes.large,
      marginBottom: theme.spacing.tiny,
    },
    
    categoryText: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.textSecondary,
      fontWeight: theme.fontWeights.medium,
    },
    
    suggestionsSection: {
      marginTop: theme.spacing.large,
    },
    
    suggestionsTitle: {
      fontSize: theme.fontSizes.medium,
      fontWeight: theme.fontWeights.semibold,
      color: theme.colors.text,
      marginBottom: theme.spacing.medium,
    },
    
    suggestionsList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.small,
    },
    
    suggestionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.borderLight,
      borderRadius: theme.borderRadius.large,
      paddingVertical: theme.spacing.small,
      paddingHorizontal: theme.spacing.medium,
    },
    
    suggestionIcon: {
      fontSize: theme.fontSizes.small,
      marginRight: theme.spacing.small,
    },
    
    suggestionText: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.text,
    },
    
    actions: {
      flexDirection: 'row',
      gap: theme.spacing.medium,
      marginTop: theme.spacing.xlarge,
    },
    
    actionButton: {
      flex: 1,
    },
  });