// src/components/modals/BudgetMethodModal.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Alert,
} from 'react-native';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Theme } from '../../styles/theme';
import { BudgetMethod } from '../../types';
import { BUDGET_METHODS } from '../../utils/constants';
import { formatPercentage } from '../../utils/formatting';

interface BudgetMethodModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (method: BudgetMethod) => void;
  selectedMethod?: BudgetMethod;
  theme: Theme;
  allowCustom?: boolean;
}

export const BudgetMethodModal: React.FC<BudgetMethodModalProps> = ({
  visible,
  onClose,
  onSelect,
  selectedMethod,
  theme,
  allowCustom = true,
}) => {
  // Animation values
  const [slideAnim] = useState(new Animated.Value(0));
  const [opacityAnim] = useState(new Animated.Value(0));

  // State
  const [activeTab, setActiveTab] = useState<'predefined' | 'custom'>('predefined');
  const [customMethod, setCustomMethod] = useState({
    name: '',
    description: '',
    needs: '50',
    wants: '30',
    savings: '20',
  });
  const [customErrors, setCustomErrors] = useState({
    name: '',
    percentages: '',
  });

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

  const validateCustomMethod = () => {
    const errors = { name: '', percentages: '' };
    let isValid = true;

    if (!customMethod.name.trim()) {
      errors.name = 'Nom requis';
      isValid = false;
    }

    const needs = parseFloat(customMethod.needs) || 0;
    const wants = parseFloat(customMethod.wants) || 0;
    const savings = parseFloat(customMethod.savings) || 0;
    const total = needs + wants + savings;

    if (Math.abs(total - 100) > 0.1) {
      errors.percentages = `Total: ${total.toFixed(1)}% (doit être 100%)`;
      isValid = false;
    }

    if (needs < 0 || wants < 0 || savings < 0) {
      errors.percentages = 'Les pourcentages ne peuvent pas être négatifs';
      isValid = false;
    }

    setCustomErrors(errors);
    return isValid;
  };

  const handleCustomMethodSubmit = () => {
    if (!validateCustomMethod()) return;

    const method: BudgetMethod = {
      id: `custom_${Date.now()}`,
      name: customMethod.name.trim(),
      description: customMethod.description.trim() || 'Méthode personnalisée',
      needs: parseFloat(customMethod.needs),
      wants: parseFloat(customMethod.wants),
      savings: parseFloat(customMethod.savings),
      isCustom: true,
    };

    onSelect(method);
    onClose();
  };

  const handleMethodSelect = (method: BudgetMethod) => {
    onSelect(method);
    onClose();
  };

  const renderMethodCard = (method: BudgetMethod) => {
    const isSelected = selectedMethod?.id === method.id;

    return (
      <TouchableOpacity
        key={method.id}
        style={[
          styles.methodCard,
          isSelected && styles.methodCardSelected
        ]}
        onPress={() => handleMethodSelect(method)}
      >
        <View style={styles.methodHeader}>
          <Text style={styles.methodName}>{method.name}</Text>
          {isSelected && (
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeText}>✓</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.methodDescription}>{method.description}</Text>
        
        <View style={styles.methodBreakdown}>
          <View style={styles.breakdownItem}>
            <View style={[styles.breakdownColor, { backgroundColor: theme.colors.needs }]} />
            <Text style={styles.breakdownLabel}>Besoins</Text>
            <Text style={styles.breakdownValue}>{formatPercentage(method.needs)}</Text>
          </View>
          
          <View style={styles.breakdownItem}>
            <View style={[styles.breakdownColor, { backgroundColor: theme.colors.wants }]} />
            <Text style={styles.breakdownLabel}>Envies</Text>
            <Text style={styles.breakdownValue}>{formatPercentage(method.wants)}</Text>
          </View>
          
          <View style={styles.breakdownItem}>
            <View style={[styles.breakdownColor, { backgroundColor: theme.colors.savings }]} />
            <Text style={styles.breakdownLabel}>Épargne</Text>
            <Text style={styles.breakdownValue}>{formatPercentage(method.savings)}</Text>
          </View>
        </View>

        {/* Visualisation graphique */}
        <View style={styles.methodVisual}>
          <View 
            style={[
              styles.visualBar,
              { 
                flex: method.needs,
                backgroundColor: theme.colors.needs 
              }
            ]} 
          />
          <View 
            style={[
              styles.visualBar,
              { 
                flex: method.wants,
                backgroundColor: theme.colors.wants 
              }
            ]} 
          />
          <View 
            style={[
              styles.visualBar,
              { 
                flex: method.savings,
                backgroundColor: theme.colors.savings 
              }
            ]} 
          />
        </View>

        {/* Conseils pour chaque méthode */}
        <View style={styles.methodTips}>
          {method.id === 'classic_50_30_20' && (
            <Text style={styles.tipText}>
              💡 Idéal pour débuter et maintenir un équilibre sain
            </Text>
          )}
          {method.id === 'aggressive_savings' && (
            <Text style={styles.tipText}>
              🎯 Parfait pour atteindre rapidement vos objectifs d'épargne
            </Text>
          )}
          {method.id === 'balanced_lifestyle' && (
            <Text style={styles.tipText}>
              🌟 Équilibre entre plaisir et responsabilité financière
            </Text>
          )}
          {method.id === 'student_budget' && (
            <Text style={styles.tipText}>
              🎓 Adapté aux contraintes des revenus étudiants
            </Text>
          )}
          {method.id === 'family_focused' && (
            <Text style={styles.tipText}>
              👨‍👩‍👧‍👦 Priorité aux besoins familiaux essentiels
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderPredefinedMethods = () => (
    <ScrollView 
      style={styles.methodsList}
      showsVerticalScrollIndicator={false}
    >
      {BUDGET_METHODS.map(renderMethodCard)}
    </ScrollView>
  );

  const renderCustomMethod = () => (
    <ScrollView 
      style={styles.customContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.customForm}>
        <Text style={styles.customTitle}>
          🎨 Créer une méthode personnalisée
        </Text>
        <Text style={styles.customSubtitle}>
          Définissez vos propres pourcentages selon vos besoins
        </Text>

        <Input
          label="Nom de la méthode"
          value={customMethod.name}
          onChangeText={(text) => setCustomMethod(prev => ({ ...prev, name: text }))}
          placeholder="Ex: Ma méthode personnelle"
          error={customErrors.name}
          theme={theme}
        />

        <Input
          label="Description (optionnel)"
          value={customMethod.description}
          onChangeText={(text) => setCustomMethod(prev => ({ ...prev, description: text }))}
          placeholder="Décrivez votre approche..."
          theme={theme}
        />

        <Text style={styles.percentagesTitle}>
          Répartition des pourcentages
        </Text>

        <View style={styles.percentageInputs}>
          <View style={styles.percentageGroup}>
            <View style={styles.percentageHeader}>
              <View style={[styles.percentageColor, { backgroundColor: theme.colors.needs }]} />
              <Text style={styles.percentageLabel}>Besoins</Text>
            </View>
            <Input
              value={customMethod.needs}
              onChangeText={(text) => setCustomMethod(prev => ({ ...prev, needs: text }))}
              placeholder="50"
              keyboardType="numeric"
              theme={theme}
              rightIcon="%"
            />
          </View>

          <View style={styles.percentageGroup}>
            <View style={styles.percentageHeader}>
              <View style={[styles.percentageColor, { backgroundColor: theme.colors.wants }]} />
              <Text style={styles.percentageLabel}>Envies</Text>
            </View>
            <Input
              value={customMethod.wants}
              onChangeText={(text) => setCustomMethod(prev => ({ ...prev, wants: text }))}
              placeholder="30"
              keyboardType="numeric"
              theme={theme}
              rightIcon="%"
            />
          </View>

          <View style={styles.percentageGroup}>
            <View style={styles.percentageHeader}>
              <View style={[styles.percentageColor, { backgroundColor: theme.colors.savings }]} />
              <Text style={styles.percentageLabel}>Épargne</Text>
            </View>
            <Input
              value={customMethod.savings}
              onChangeText={(text) => setCustomMethod(prev => ({ ...prev, savings: text }))}
              placeholder="20"
              keyboardType="numeric"
              theme={theme}
              rightIcon="%"
            />
          </View>
        </View>

        {customErrors.percentages && (
          <Text style={styles.percentageError}>{customErrors.percentages}</Text>
        )}

        {/* Aperçu en temps réel */}
        <View style={styles.previewContainer}>
          <Text style={styles.previewTitle}>Aperçu</Text>
          <View style={styles.previewVisual}>
            <View 
              style={[
                styles.previewBar,
                { 
                  flex: parseFloat(customMethod.needs) || 0,
                  backgroundColor: theme.colors.needs 
                }
              ]} 
            />
            <View 
              style={[
                styles.previewBar,
                { 
                  flex: parseFloat(customMethod.wants) || 0,
                  backgroundColor: theme.colors.wants 
                }
              ]} 
            />
            <View 
              style={[
                styles.previewBar,
                { 
                  flex: parseFloat(customMethod.savings) || 0,
                  backgroundColor: theme.colors.savings 
                }
              ]} 
            />
          </View>
          
          <Text style={styles.previewTotal}>
            Total: {(
              (parseFloat(customMethod.needs) || 0) +
              (parseFloat(customMethod.wants) || 0) +
              (parseFloat(customMethod.savings) || 0)
            ).toFixed(1)}%
          </Text>
        </View>

        <Button
          title="Créer cette méthode"
          onPress={handleCustomMethodSubmit}
          theme={theme}
          style={styles.createButton}
          disabled={!customMethod.name.trim()}
        />
      </View>
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View 
          style={[
            styles.overlay,
            {
              opacity: opacityAnim,
            }
          ]}
        >
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modalContainer,
                {
                  transform: [
                    {
                      translateY: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [500, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>💰 Méthodes budgétaires</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Tabs */}
              <View style={styles.tabs}>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    activeTab === 'predefined' && styles.tabActive
                  ]}
                  onPress={() => setActiveTab('predefined')}
                >
                  <Text style={[
                    styles.tabText,
                    activeTab === 'predefined' && styles.tabTextActive
                  ]}>
                    Prédéfinies
                  </Text>
                </TouchableOpacity>
                
                {allowCustom && (
                  <TouchableOpacity
                    style={[
                      styles.tab,
                      activeTab === 'custom' && styles.tabActive
                    ]}
                    onPress={() => setActiveTab('custom')}
                  >
                    <Text style={[
                      styles.tabText,
                      activeTab === 'custom' && styles.tabTextActive
                    ]}>
                      Personnalisée
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Content */}
              <View style={styles.content}>
                {activeTab === 'predefined' ? renderPredefinedMethods() : renderCustomMethod()}
              </View>
            </Animated.View>
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
      justifyContent: 'center',
      padding: theme.spacing.large,
    },
    
    modalContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.xlarge,
      maxHeight: '85%',
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
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
    
    tabs: {
      flexDirection: 'row',
      backgroundColor: theme.colors.borderLight,
      margin: theme.spacing.large,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.tiny,
    },
    
    tab: {
      flex: 1,
      paddingVertical: theme.spacing.medium,
      alignItems: 'center',
      borderRadius: theme.borderRadius.small,
    },
    
    tabActive: {
      backgroundColor: theme.colors.primary,
    },
    
    tabText: {
      fontSize: theme.fontSizes.regular,
      fontWeight: theme.fontWeights.medium,
      color: theme.colors.textSecondary,
    },
    
    tabTextActive: {
      color: '#FFFFFF',
    },
    
    content: {
      flex: 1,
    },
    
    methodsList: {
      flex: 1,
      padding: theme.spacing.large,
      paddingTop: 0,
    },
    
    methodCard: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.large,
      marginBottom: theme.spacing.medium,
      borderWidth: 2,
      borderColor: theme.colors.border,
    },
    
    methodCardSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryLight,
    },
    
    methodHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.small,
    },
    
    methodName: {
      fontSize: theme.fontSizes.regular,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.text,
    },
    
    selectedBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.colors.success,
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    selectedBadgeText: {
      color: '#FFFFFF',
      fontSize: theme.fontSizes.small,
      fontWeight: theme.fontWeights.bold,
    },
    
    methodDescription: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.medium,
    },
    
    methodBreakdown: {
      gap: theme.spacing.small,
      marginBottom: theme.spacing.medium,
    },
    
    breakdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    
    breakdownColor: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: theme.spacing.small,
    },
    
    breakdownLabel: {
      flex: 1,
      fontSize: theme.fontSizes.small,
      color: theme.colors.text,
    },
    
    breakdownValue: {
      fontSize: theme.fontSizes.small,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.text,
    },
    
    methodVisual: {
      flexDirection: 'row',
      height: 8,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: theme.spacing.medium,
    },
    
    visualBar: {
      height: '100%',
    },
    
    methodTips: {
      backgroundColor: theme.colors.primaryLight,
      borderRadius: theme.borderRadius.small,
      padding: theme.spacing.medium,
    },
    
    tipText: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.primary,
      textAlign: 'center',
    },
    
    customContainer: {
      flex: 1,
    },
    
    customForm: {
      padding: theme.spacing.large,
    },
    
    customTitle: {
      fontSize: theme.fontSizes.large,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: theme.spacing.small,
    },
    
    customSubtitle: {
      fontSize: theme.fontSizes.regular,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.large,
    },
    
    percentagesTitle: {
      fontSize: theme.fontSizes.regular,
      fontWeight: theme.fontWeights.semibold,
      color: theme.colors.text,
      marginBottom: theme.spacing.medium,
      marginTop: theme.spacing.medium,
    },
    
    percentageInputs: {
      gap: theme.spacing.medium,
    },
    
    percentageGroup: {
      flex: 1,
    },
    
    percentageHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.small,
    },
    
    percentageColor: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: theme.spacing.small,
    },
    
    percentageLabel: {
      fontSize: theme.fontSizes.medium,
      fontWeight: theme.fontWeights.medium,
      color: theme.colors.text,
    },
    
    percentageError: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.danger,
      textAlign: 'center',
      marginTop: theme.spacing.small,
      fontWeight: theme.fontWeights.medium,
    },
    
    previewContainer: {
      backgroundColor: theme.colors.borderLight,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.medium,
      marginTop: theme.spacing.large,
      marginBottom: theme.spacing.large,
    },
    
    previewTitle: {
      fontSize: theme.fontSizes.medium,
      fontWeight: theme.fontWeights.semibold,
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: theme.spacing.medium,
    },
    
    previewVisual: {
      flexDirection: 'row',
      height: 12,
      borderRadius: 6,
      overflow: 'hidden',
      marginBottom: theme.spacing.small,
    },
    
    previewBar: {
      height: '100%',
    },
    
    previewTotal: {
      fontSize: theme.fontSizes.regular,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.text,
      textAlign: 'center',
    },
    
    createButton: {
      marginTop: theme.spacing.medium,
    },
  });