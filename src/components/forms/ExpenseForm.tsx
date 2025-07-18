// src/components/forms/ExpenseForm.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Theme } from '../../styles/theme';
import { ExpenseCategory, ExpenseInput } from '../../types/expense.types';
import { validateAmount, validateDescription } from '../../utils/validation';
import { formatCurrency } from '../../utils/formatting';


interface ExpenseFormProps {
  onSubmit: (expense: ExpenseInput) => Promise<boolean>;
  onCancel?: () => void;
  initialData?: Partial<ExpenseInput>;
  theme: Theme;
  showCancel?: boolean;
  submitText?: string;
  loading?: boolean;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  theme,
  showCancel = true,
  submitText = 'Ajouter la dépense',
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    description: initialData?.description || '',
    amount: initialData?.amount?.toString() || '',
    category: initialData?.category || 'needs' as ExpenseCategory,
    date: initialData?.date || new Date().toISOString().split('T')[0],
    tags: initialData?.tags || [],
  });

  const [errors, setErrors] = useState({
    description: '',
    amount: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const styles = createExpenseFormStyles(theme);

  // Suggestions de dépenses courantes par catégorie
  const suggestions = {
    needs: [
      'Courses alimentaires', 'Essence', 'Pharmacie', 'Transport', 
      'Facture électricité', 'Loyer', 'Assurance', 'Médecin'
    ],
    wants: [
      'Restaurant', 'Cinéma', 'Shopping', 'Café', 'Livre', 
      'Jeu vidéo', 'Concert', 'Sortie'
    ],
    savings: [
      'Épargne mensuelle', 'Investissement', 'Plan retraite', 
      'Assurance vie', 'Livret A', 'Actions'
    ],
  };

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

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const expenseData: ExpenseInput = {
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        category: formData.category,
        date: formData.date,
        tags: formData.tags.filter(tag => tag.trim().length > 0),
      };

      const success = await onSubmit(expenseData);
      
      if (success) {
        // Réinitialiser le formulaire après succès
        setFormData({
          description: '',
          amount: '',
          category: 'needs',
          date: new Date().toISOString().split('T')[0],
          tags: [],
        });
        setErrors({ description: '', amount: '' });
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'ajout');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    setFormData(prev => ({ ...prev, description: suggestion }));
  };

  const getCategoryInfo = (category: ExpenseCategory) => {
    switch (category) {
      case 'needs':
        return { icon: '🏠', name: 'Besoin', color: theme.colors.needs };
      case 'wants':
        return { icon: '🎯', name: 'Envie', color: theme.colors.wants };
      case 'savings':
        return { icon: '💎', name: 'Épargne', color: theme.colors.savings };
      default:
        return { icon: '💸', name: 'Dépense', color: theme.colors.primary };
    }
  };

  // Calcul du temps de travail nécessaire (estimation à 15€/h)
  const getWorkTimeEstimate = () => {
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) return null;
    
    const estimatedHourlyRate = 15; // À remplacer par le vrai taux de l'utilisateur
    const hours = amount / estimatedHourlyRate;
    
    if (hours < 1) {
      return `${Math.round(hours * 60)} minutes de travail`;
    } else if (hours < 8) {
      return `${hours.toFixed(1)} heures de travail`;
    } else {
      return `${(hours / 8).toFixed(1)} jours de travail`;
    }
  };

  return (
    <View style={styles.container}>
      {/* Description */}
      <Input
        label="Description de la dépense"
        value={formData.description}
        onChangeText={(text) => {
          setFormData(prev => ({ ...prev, description: text }));
          if (errors.description) {
            setErrors(prev => ({ ...prev, description: '' }));
          }
        }}
        placeholder="Ex: Courses, Restaurant..."
        error={errors.description}
        theme={theme}
        leftIcon="📝"
      />

      {/* Suggestions */}
      {suggestions[formData.category].length > 0 && !formData.description && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>💡 Suggestions pour {getCategoryInfo(formData.category).name.toLowerCase()}s :</Text>
          <View style={styles.suggestionsList}>
            {suggestions[formData.category].slice(0, 4).map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionChip}
                onPress={() => handleSuggestionPress(suggestion)}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Montant et Date */}
      <View style={styles.row}>
        <View style={styles.amountContainer}>
          <Input
            label="Montant"
            value={formData.amount}
            onChangeText={(text) => {
              setFormData(prev => ({ ...prev, amount: text }));
              if (errors.amount) {
                setErrors(prev => ({ ...prev, amount: '' }));
              }
            }}
            placeholder="0.00"
            keyboardType="numeric"
            error={errors.amount}
            theme={theme}
            leftIcon="💰"
            rightIcon="€"
          />
          
          {/* Estimation temps de travail */}
          {getWorkTimeEstimate() && (
            <Text style={styles.workTimeEstimate}>
              ⏰ {getWorkTimeEstimate()}
            </Text>
          )}
        </View>

        <View style={styles.dateContainer}>
          <Text style={styles.inputLabel}>Date</Text>
          <TouchableOpacity style={styles.dateButton}>
            <Text style={styles.dateIcon}>📅</Text>
            <Text style={styles.dateText}>
              {new Date(formData.date).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit'
              })}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sélecteur de catégorie */}
      <View style={styles.categorySection}>
        <Text style={styles.inputLabel}>Catégorie</Text>
        <View style={styles.categoryButtons}>
          {(['needs', 'wants', 'savings'] as ExpenseCategory[]).map((category) => {
            const info = getCategoryInfo(category);
            const isSelected = formData.category === category;
            
            return (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  isSelected && styles.categoryButtonActive,
                  { borderColor: info.color }
                ]}
                onPress={() => setFormData(prev => ({ ...prev, category }))}
              >
                <Text style={styles.categoryIcon}>{info.icon}</Text>
                <Text style={[
                  styles.categoryText,
                  isSelected && { color: info.color, fontWeight: theme.fontWeights.bold }
                ]}>
                  {info.name}
                </Text>
                {isSelected && (
                  <View style={[styles.categoryIndicator, { backgroundColor: info.color }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Aperçu de la dépense */}
      {formData.description && formData.amount && (
        <View style={styles.previewContainer}>
          <Text style={styles.previewTitle}>📋 Aperçu</Text>
          <View style={styles.previewContent}>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Description :</Text>
              <Text style={styles.previewValue}>{formData.description}</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Montant :</Text>
              <Text style={[styles.previewValue, styles.previewAmount]}>
                {formatCurrency(parseFloat(formData.amount) || 0)}
              </Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Catégorie :</Text>
              <View style={styles.previewCategory}>
                <Text style={styles.previewCategoryIcon}>
                  {getCategoryInfo(formData.category).icon}
                </Text>
                <Text style={styles.previewValue}>
                  {getCategoryInfo(formData.category).name}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {showCancel && (
          <Button
            title="Annuler"
            onPress={onCancel || (() => {})}
            variant="secondary"
            theme={theme}
            style={styles.actionButton}
            disabled={isSubmitting || loading}
          />
        )}
        <Button
          title={submitText}
          onPress={handleSubmit}
          theme={theme}
          style={[
            styles.actionButton,
            ...(showCancel ? [] : [styles.fullWidthButton])
          ]}
          loading={isSubmitting || loading}
          disabled={isSubmitting || loading || !formData.description.trim() || !formData.amount}
        />
      </View>

      {/* Conseils selon la catégorie */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>💡 Conseil</Text>
        {formData.category === 'needs' && (
          <Text style={styles.tipsText}>
            Les besoins sont essentiels à votre survie et bien-être. Privilégiez la qualité sur la quantité.
          </Text>
        )}
        {formData.category === 'wants' && (
          <Text style={styles.tipsText}>
            Les envies apportent du plaisir ! Assurez-vous de rester dans votre budget alloué.
          </Text>
        )}
        {formData.category === 'savings' && (
          <Text style={styles.tipsText}>
            Excellente habitude ! Chaque euro épargné aujourd'hui travaille pour votre avenir.
          </Text>
        )}
      </View>
    </View>
  );
};

const createExpenseFormStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      padding: theme.spacing.large,
    },
    
    suggestionsContainer: {
      marginBottom: theme.spacing.large,
    },
    
    suggestionsTitle: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.small,
    },
    
    suggestionsList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.small,
    },
    
    suggestionChip: {
      backgroundColor: theme.colors.primaryLight,
      borderRadius: theme.borderRadius.large,
      paddingVertical: theme.spacing.small,
      paddingHorizontal: theme.spacing.medium,
    },
    
    suggestionText: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.primary,
      fontWeight: theme.fontWeights.medium,
    },
    
    row: {
      flexDirection: 'row',
      gap: theme.spacing.medium,
      alignItems: 'flex-start',
    },
    
    amountContainer: {
      flex: 2,
    },
    
    workTimeEstimate: {
      fontSize: theme.fontSizes.tiny,
      color: theme.colors.warning,
      marginTop: theme.spacing.tiny,
      fontStyle: 'italic',
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
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.medium,
      backgroundColor: theme.colors.surface,
      minHeight: 44,
    },
    
    dateIcon: {
      fontSize: theme.fontSizes.regular,
      marginRight: theme.spacing.small,
    },
    
    dateText: {
      fontSize: theme.fontSizes.regular,
      color: theme.colors.text,
    },
    
    categorySection: {
      marginTop: theme.spacing.large,
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
      position: 'relative',
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
    
    categoryIndicator: {
      position: 'absolute',
      top: -2,
      right: -2,
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    
    previewContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.large,
      marginTop: theme.spacing.large,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    
    previewTitle: {
      fontSize: theme.fontSizes.regular,
      fontWeight: theme.fontWeights.semibold,
      color: theme.colors.text,
      marginBottom: theme.spacing.medium,
    },
    
    previewContent: {
      gap: theme.spacing.small,
    },
    
    previewRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    
    previewLabel: {
      fontSize: theme.fontSizes.regular,
      color: theme.colors.textSecondary,
    },
    
    previewValue: {
      fontSize: theme.fontSizes.regular,
      fontWeight: theme.fontWeights.medium,
      color: theme.colors.text,
    },
    
    previewAmount: {
      fontSize: theme.fontSizes.large,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.primary,
    },
    
    previewCategory: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    
    previewCategoryIcon: {
      fontSize: theme.fontSizes.regular,
      marginRight: theme.spacing.small,
    },
    
    actions: {
      flexDirection: 'row',
      gap: theme.spacing.medium,
      marginTop: theme.spacing.xlarge,
    },
    
    actionButton: {
      flex: 1,
    },
    
    fullWidthButton: {
      flex: undefined,
      width: '100%',
    },
    
    tipsContainer: {
      backgroundColor: theme.colors.primaryLight,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.medium,
      marginTop: theme.spacing.large,
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    
    tipsTitle: {
      fontSize: theme.fontSizes.medium,
      fontWeight: theme.fontWeights.semibold,
      color: theme.colors.primary,
      marginBottom: theme.spacing.small,
    },
    
    tipsText: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.primary,
      lineHeight: theme.fontSizes.regular,
    },
  });