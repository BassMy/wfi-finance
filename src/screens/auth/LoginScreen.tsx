// src/screens/auth/LoginScreen.tsx
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
import { loginUser, clearError } from '../../store/slices/authSlice';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Theme, lightTheme } from '../../styles/theme';
import { validateEmail } from '../../utils/validation';

interface LoginScreenProps {
  onNavigateToRegister: () => void;
  onNavigateToForgotPassword: () => void;
  theme?: Theme;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onNavigateToRegister,
  onNavigateToForgotPassword,
  theme = lightTheme,
}) => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });

  const styles = createLoginStyles(theme);

  const validateForm = () => {
    const newErrors = { email: '', password: '' };
    let isValid = true;

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

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const result = await dispatch(loginUser(formData));
      
      if (loginUser.fulfilled.match(result)) {
        // La connexion a réussi, la navigation sera gérée par le composant parent
        console.log('✅ Login successful');
      } else {
        // Afficher l'erreur
        const errorMessage = result.payload as string;
        Alert.alert('Erreur de connexion', errorMessage);
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
          {/* Header avec logo */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoIcon}>💼</Text>
              <Text style={styles.logoText}>WorkForIt</Text>
            </View>
            <Text style={styles.subtitle}>
              Gérez vos finances intelligemment
            </Text>
          </View>

          {/* Formulaire */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>🔐 Connexion</Text>
            
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
              theme={theme}
            />

            <Button
              title="Se connecter"
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
              fullWidth
              theme={theme}
              style={styles.loginButton}
            />

            {/* Lien mot de passe oublié */}
            <Button
              title="Mot de passe oublié ?"
              onPress={onNavigateToForgotPassword}
              variant="secondary"
              size="small"
              theme={theme}
              style={styles.forgotButton}
            />
          </View>

          {/* Section inscription */}
          <View style={styles.registerSection}>
            <Text style={styles.registerText}>
              Pas encore de compte ?
            </Text>
            <Button
              title="Créer un compte"
              onPress={onNavigateToRegister}
              variant="secondary"
              theme={theme}
              style={styles.registerButton}
            />
          </View>

          {/* Compte de démonstration */}
          <View style={styles.demoSection}>
            <Text style={styles.demoTitle}>🧪 Compte de démonstration</Text>
            <Text style={styles.demoText}>
              Email : demo@workforit.com{'\n'}
              Mot de passe : demo123
            </Text>
            <Button
              title="Utiliser le compte démo"
              onPress={() => {
                setFormData({
                  email: 'demo@workforit.com',
                  password: 'demo123',
                });
              }}
              variant="warning"
              size="small"
              theme={theme}
              style={styles.demoButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Loading overlay */}
      {isLoading && (
        <LoadingSpinner
          fullScreen
          text="Connexion en cours..."
          theme={theme}
        />
      )}
    </SafeAreaView>
  );
};

const createLoginStyles = (theme: Theme) =>
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
      marginTop: theme.spacing.huge,
      marginBottom: theme.spacing.xlarge,
    },
    
    logoContainer: {
      alignItems: 'center',
      marginBottom: theme.spacing.medium,
    },
    
    logoIcon: {
      fontSize: 60,
      marginBottom: theme.spacing.small,
    },
    
    logoText: {
      fontSize: theme.fontSizes.huge,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.primary,
      letterSpacing: 1,
    },
    
    subtitle: {
      fontSize: theme.fontSizes.regular,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    
    formContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.large,
      padding: theme.spacing.xlarge,
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
      fontSize: theme.fontSizes.xlarge,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: theme.spacing.xlarge,
    },
    
    loginButton: {
      marginTop: theme.spacing.medium,
      marginBottom: theme.spacing.medium,
    },
    
    forgotButton: {
      alignSelf: 'center',
    },
    
    registerSection: {
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.large,
      padding: theme.spacing.large,
      marginBottom: theme.spacing.large,
      borderWidth: theme.isDark ? 1 : 0,
      borderColor: theme.colors.border,
    },
    
    registerText: {
      fontSize: theme.fontSizes.regular,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.medium,
    },
    
    registerButton: {
      minWidth: 200,
    },
    
    demoSection: {
      backgroundColor: theme.isDark ? theme.colors.warningLight : '#FEF3C7',
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.large,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.warning,
    },
    
    demoTitle: {
      fontSize: theme.fontSizes.medium,
      fontWeight: theme.fontWeights.semibold,
      color: theme.colors.warning,
      marginBottom: theme.spacing.small,
    },
    
    demoText: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.warning,
      textAlign: 'center',
      marginBottom: theme.spacing.medium,
      lineHeight: theme.fontSizes.large,
    },
    
    demoButton: {
      paddingHorizontal: theme.spacing.large,
    },
  });