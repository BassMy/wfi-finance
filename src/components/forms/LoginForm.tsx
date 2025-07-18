// src/components/forms/LoginForm.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Theme } from '../../styles/theme';
import { LoginCredentials } from '../../types/auth.types';
import { validateEmail } from '../../utils/validation';

interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => Promise<boolean>;
  onForgotPassword: () => void;
  theme: Theme;
  loading?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  onForgotPassword,
  theme,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const styles = createLoginFormStyles(theme);

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

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const success = await onSubmit(formData);
      if (!success) {
        Alert.alert('Erreur', 'Identifiants incorrects');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur inattendue s\'est produite');
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Effacer l'erreur du champ modifié
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const fillDemoCredentials = () => {
    setFormData({
      email: 'demo@workforit.com',
      password: 'demo123',
    });
    setErrors({ email: '', password: '' });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.form}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🔐 Connexion</Text>
          <Text style={styles.subtitle}>
            Heureux de vous revoir !
          </Text>
        </View>

        {/* Champs du formulaire */}
        <View style={styles.fields}>
          <Input
            label="Adresse email"
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            placeholder="votre@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            leftIcon="📧"
            error={errors.email}
            theme={theme}
          />

          <Input
            label="Mot de passe"
            value={formData.password}
            onChangeText={(value) => handleInputChange('password', value)}
            placeholder="••••••••"
            secureTextEntry={!showPassword}
            autoComplete="password"
            leftIcon="🔒"
            rightIcon={showPassword ? "👁️" : "👁️‍🗨️"}
            error={errors.password}
            theme={theme}
            onRightIconPress={() => setShowPassword(!showPassword)}
          />
        </View>

        {/* Options */}
        <View style={styles.options}>
          <TouchableOpacity
            style={styles.rememberContainer}
            onPress={() => setRememberMe(!rememberMe)}
          >
            <View style={[
              styles.checkbox,
              rememberMe && styles.checkboxChecked
            ]}>
              {rememberMe && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </View>
            <Text style={styles.rememberText}>Se souvenir de moi</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onForgotPassword}
            style={styles.forgotButton}
          >
            <Text style={styles.forgotText}>
              Mot de passe oublié ?
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bouton de connexion */}
        <Button
          title="Se connecter"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          fullWidth
          theme={theme}
          style={styles.submitButton}
        />

        {/* Compte démo */}
        <View style={styles.demoSection}>
          <Text style={styles.demoTitle}>🧪 Compte de démonstration</Text>
          <Text style={styles.demoDescription}>
            Testez l'application avec des données d'exemple
          </Text>
          <Button
            title="Utiliser le compte démo"
            onPress={fillDemoCredentials}
            variant="warning"
            size="small"
            theme={theme}
            style={styles.demoButton}
          />
        </View>

        {/* Aide à la connexion */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>💡 Aide à la connexion</Text>
          <Text style={styles.helpText}>
            • Vérifiez que votre email est correct{'\n'}
            • Le mot de passe est sensible à la casse{'\n'}
            • Utilisez "Mot de passe oublié" si nécessaire
          </Text>
        </View>

        {/* Indicateurs de sécurité */}
        <View style={styles.securitySection}>
          <View style={styles.securityItem}>
            <Text style={styles.securityIcon}>🔒</Text>
            <Text style={styles.securityText}>
              Connexion sécurisée SSL
            </Text>
          </View>
          <View style={styles.securityItem}>
            <Text style={styles.securityIcon}>🛡️</Text>
            <Text style={styles.securityText}>
              Données protégées
            </Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const createLoginFormStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    
    form: {
      flex: 1,
      padding: theme.spacing.large,
      justifyContent: 'center',
    },
    
    header: {
      alignItems: 'center',
      marginBottom: theme.spacing.xlarge,
    },
    
    title: {
      fontSize: theme.fontSizes.xlarge,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.small,
    },
    
    subtitle: {
      fontSize: theme.fontSizes.regular,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    
    fields: {
      marginBottom: theme.spacing.large,
    },
    
    options: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.xlarge,
    },
    
    rememberContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    
    checkbox: {
      width: 20,
      height: 20,
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderRadius: 4,
      marginRight: theme.spacing.small,
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    checkboxChecked: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    
    checkmark: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: theme.fontWeights.bold,
    },
    
    rememberText: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.text,
    },
    
    forgotButton: {
      paddingVertical: theme.spacing.small,
    },
    
    forgotText: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.primary,
      fontWeight: theme.fontWeights.medium,
    },
    
    submitButton: {
      marginBottom: theme.spacing.xlarge,
    },
    
    demoSection: {
      backgroundColor: theme.colors.warningLight,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.large,
      marginBottom: theme.spacing.large,
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
    
    demoDescription: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.warning,
      textAlign: 'center',
      marginBottom: theme.spacing.medium,
    },
    
    demoButton: {
      paddingHorizontal: theme.spacing.xlarge,
    },
    
    helpSection: {
      backgroundColor: theme.colors.primaryLight,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.medium,
      marginBottom: theme.spacing.medium,
    },
    
    helpTitle: {
      fontSize: theme.fontSizes.small,
      fontWeight: theme.fontWeights.semibold,
      color: theme.colors.primary,
      marginBottom: theme.spacing.small,
    },
    
    helpText: {
      fontSize: theme.fontSizes.tiny,
      color: theme.colors.primary,
      lineHeight: theme.fontSizes.small,
    },
    
    securitySection: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: theme.spacing.large,
    },
    
    securityItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    
    securityIcon: {
      fontSize: theme.fontSizes.small,
      marginRight: theme.spacing.tiny,
    },
    
    securityText: {
      fontSize: theme.fontSizes.tiny,
      color: theme.colors.textTertiary,
    },
  });