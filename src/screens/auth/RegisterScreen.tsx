// src/screens/auth/RegisterScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { registerUser, clearError } from '../../store/slices/authSlice';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Theme, lightTheme } from '../../styles/theme';
import { validateEmail } from '../../utils/validation';

interface RegisterScreenProps {
  onNavigateToLogin: () => void;
  theme?: Theme;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onNavigateToLogin,
  theme = lightTheme,
}) => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const styles = createRegisterStyles(theme);

  const validateForm = () => {
    const newErrors = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    };
    let isValid = true;

    // Validation prénom
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Prénom requis';
      isValid = false;
    }

    // Validation nom
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Nom requis';
      isValid = false;
    }

    // Validation email
    if (!formData.email.trim()) {
      newErrors.email = 'Email requis';
      isValid = false;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Format email invalide';
      isValid = false;
    }

    // Validation mot de passe
    if (!formData.password) {
      newErrors.password = 'Mot de passe requis';
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Minimum 6 caractères';
      isValid = false;
    }

    // Validation confirmation mot de passe
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirmation requise';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const { confirmPassword, ...registerData } = formData;
      const result = await dispatch(registerUser(registerData));
      
      if (registerUser.fulfilled.match(result)) {
        Alert.alert(
          'Compte créé !',
          'Votre compte a été créé avec succès. Bienvenue !',
          [{ text: 'Commencer', style: 'default' }]
        );
      } else {
        const errorMessage = result.payload as string;
        Alert.alert('Erreur d\'inscription', errorMessage);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur inattendue s\'est produite');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Effacer l'erreur du champ modifié
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Effacer l'erreur globale
    if (error) {
      dispatch(clearError());
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoIcon}>🎯</Text>
              <Text style={styles.logoText}>Créer un compte</Text>
            </View>
            <Text style={styles.subtitle}>
              Rejoignez des milliers d'utilisateurs qui maîtrisent leurs finances
            </Text>
          </View>

          {/* Formulaire */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>📝 Inscription</Text>
            
            <View style={styles.nameContainer}>
              <Input
                label="Prénom"
                value={formData.firstName}
                onChangeText={(value) => handleInputChange('firstName', value)}
                placeholder="John"
                autoCapitalize="words"
                leftIcon="👤"
                error={errors.firstName}
                theme={theme}
                containerStyle={styles.nameInput}
              />
              
              <Input
                label="Nom"
                value={formData.lastName}
                onChangeText={(value) => handleInputChange('lastName', value)}
                placeholder="Doe"
                autoCapitalize="words"
                leftIcon="👤"
                error={errors.lastName}
                theme={theme}
                containerStyle={styles.nameInput}
              />
            </View>

            <Input
              label="Adresse email"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              placeholder="votre@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              leftIcon="📧"
              error={errors.email}
              theme={theme}
            />

            <Input
              label="Mot de passe"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              placeholder="••••••••"
              secureTextEntry
              leftIcon="🔒"
              error={errors.password}
              helperText="Minimum 6 caractères"
              theme={theme}
            />

            <Input
              label="Confirmer le mot de passe"
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              placeholder="••••••••"
              secureTextEntry
              leftIcon="🔒"
              error={errors.confirmPassword}
              theme={theme}
            />

            <Button
              title="Créer mon compte"
              onPress={handleRegister}
              loading={isLoading}
              disabled={isLoading}
              fullWidth
              variant="success"
              theme={theme}
              style={styles.registerButton}
            />
          </View>

          {/* Section connexion */}
          <View style={styles.loginSection}>
            <Text style={styles.loginText}>
              Déjà un compte ?
            </Text>
            <Button
              title="Se connecter"
              onPress={onNavigateToLogin}
              variant="secondary"
              theme={theme}
              style={styles.loginButton}
            />
          </View>

          {/* Avantages */}
          <View style={styles.benefitsSection}>
            <Text style={styles.benefitsTitle}>🎁 Pourquoi WorkForIt ?</Text>
            <View style={styles.benefitsList}>
              <Text style={styles.benefitItem}>
                💳 Gestion complète de vos abonnements
              </Text>
              <Text style={styles.benefitItem}>
                📊 Calcul de votre taux horaire réel
              </Text>
              <Text style={styles.benefitItem}>
                🎯 Méthodes budgétaires personnalisées
              </Text>
              <Text style={styles.benefitItem}>
                ☁️ Synchronisation multi-appareils
              </Text>
              <Text style={styles.benefitItem}>
                🔒 Données sécurisées et privées
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Loading overlay */}
      {isLoading && (
        <LoadingSpinner
          fullScreen
          text="Création du compte..."
          theme={theme}
        />
      )}
    </SafeAreaView>
  );
};

const createRegisterStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    
    keyboardView: {
      flex: 1,
    },
    
    scrollView: {
      flex: 1,
    },
    
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: theme.spacing.large,
      paddingBottom: theme.spacing.huge,
    },
    
    header: {
      alignItems: 'center',
      marginTop: theme.spacing.xlarge,
      marginBottom: theme.spacing.large,
    },
    
    logoContainer: {
      alignItems: 'center',
      marginBottom: theme.spacing.medium,
    },
    
    logoIcon: {
      fontSize: 50,
      marginBottom: theme.spacing.small,
    },
    
    logoText: {
      fontSize: theme.fontSizes.xlarge,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.text,
      textAlign: 'center',
    },
    
    subtitle: {
      fontSize: theme.fontSizes.medium,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: theme.fontSizes.large,
    },
    
    formContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.large,
      padding: theme.spacing.large,
      marginBottom: theme.spacing.large,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.isDark ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: theme.isDark ? 1 : 0,
      borderColor: theme.colors.border,
    },
    
    title: {
      fontSize: theme.fontSizes.large,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: theme.spacing.large,
    },
    
    nameContainer: {
      flexDirection: 'row',
      gap: theme.spacing.medium,
    },
    
    nameInput: {
      flex: 1,
    },
    
    registerButton: {
      marginTop: theme.spacing.medium,
    },
    
    loginSection: {
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.large,
      padding: theme.spacing.large,
      marginBottom: theme.spacing.large,
      borderWidth: theme.isDark ? 1 : 0,
      borderColor: theme.colors.border,
    },
    
    loginText: {
      fontSize: theme.fontSizes.regular,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.medium,
    },
    
    loginButton: {
      minWidth: 200,
    },
    
    benefitsSection: {
      backgroundColor: theme.isDark ? theme.colors.successLight : '#F0FDF4',
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.large,
      borderWidth: 1,
      borderColor: theme.colors.success,
    },
    
    benefitsTitle: {
      fontSize: theme.fontSizes.medium,
      fontWeight: theme.fontWeights.semibold,
      color: theme.colors.success,
      textAlign: 'center',
      marginBottom: theme.spacing.medium,
    },
    
    benefitsList: {
      gap: theme.spacing.small,
    },
    
    benefitItem: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.success,
      lineHeight: theme.fontSizes.regular,
    },
  });