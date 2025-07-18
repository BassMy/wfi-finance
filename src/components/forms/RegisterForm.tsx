// src/components/forms/RegisterForm.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Theme } from '../../styles/theme';
import { RegisterCredentials } from '../../types/auth.types';
import { validateEmail } from '../../utils/validation';

interface RegisterFormProps {
  onSubmit: (userData: RegisterCredentials) => Promise<boolean>;
  onLogin: () => void;
  theme: Theme;
  loading?: boolean;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSubmit,
  onLogin,
  theme,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    company: '',
    profession: '',
  });

  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    profession: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const styles = createRegisterFormStyles(theme);

  const validateForm = () => {
    const newErrors = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      profession: '',
    };
    let isValid = true;

    // Validation prénom
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis';
      isValid = false;
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'Le prénom doit faire au moins 2 caractères';
      isValid = false;
    }

    // Validation nom
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom est requis';
      isValid = false;
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Le nom doit faire au moins 2 caractères';
      isValid = false;
    }

    // Validation email
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
      isValid = false;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Format email invalide';
      isValid = false;
    }

    // Validation mot de passe
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
      isValid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = 'Le mot de passe doit faire au moins 8 caractères';
      isValid = false;
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre';
      isValid = false;
    }

    // Validation confirmation mot de passe
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirmez votre mot de passe';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      isValid = false;
    }

    // Validation téléphone (optionnel)
    if (formData.phone && !/^(\+33|0)[1-9](\d{8})$/.test(formData.phone)) {
      newErrors.phone = 'Format de téléphone invalide';
      isValid = false;
    }

    // Validation profession
    if (!formData.profession.trim()) {
      newErrors.profession = 'La profession est requise';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Erreur', 'Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    setIsSubmitting(true);

    try {
      const userData: RegisterCredentials = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      };

      const success = await onSubmit(userData);
      
      if (success) {
        // Réinitialiser le formulaire après succès
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: '',
          phone: '',
          company: '',
          profession: '',
        });
        setErrors({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: '',
          phone: '',
          profession: '',
        });
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur inattendue s\'est produite');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Effacer l'erreur du champ modifié
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getPasswordStrength = () => {
    const password = formData.password;
    if (!password) return { strength: 0, label: '', color: theme.colors.textTertiary };

    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

    if (score <= 2) return { strength: score, label: 'Faible', color: theme.colors.danger };
    if (score <= 3) return { strength: score, label: 'Moyen', color: theme.colors.warning };
    return { strength: score, label: 'Fort', color: theme.colors.success };
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>🎯 Inscription</Text>
            <Text style={styles.subtitle}>
              Créez votre compte Work for It
            </Text>
          </View>

          {/* Informations personnelles */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👤 Informations personnelles</Text>
            
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Input
                  label="Prénom *"
                  value={formData.firstName}
                  onChangeText={(value) => handleInputChange('firstName', value)}
                  placeholder="Votre prénom"
                  autoCapitalize="words"
                  leftIcon="👤"
                  error={errors.firstName}
                  theme={theme}
                />
              </View>
              <View style={styles.halfInput}>
                <Input
                  label="Nom *"
                  value={formData.lastName}
                  onChangeText={(value) => handleInputChange('lastName', value)}
                  placeholder="Votre nom"
                  autoCapitalize="words"
                  leftIcon="👤"
                  error={errors.lastName}
                  theme={theme}
                />
              </View>
            </View>

            <Input
              label="Adresse email *"
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
          </View>

          {/* Sécurité */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔒 Sécurité</Text>
            
            <Input
              label="Mot de passe *"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              autoComplete="new-password"
              leftIcon="🔒"
              rightIcon={showPassword ? "👁️" : "👁️‍🗨️"}
              error={errors.password}
              theme={theme}
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            {/* Indicateur de force du mot de passe */}
            {formData.password && (
              <View style={styles.passwordStrength}>
                <View style={styles.strengthBar}>
                  <View 
                    style={[
                      styles.strengthFill,
                      { 
                        width: `${(getPasswordStrength().strength / 5) * 100}%`,
                        backgroundColor: getPasswordStrength().color 
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.strengthLabel, { color: getPasswordStrength().color }]}>
                  {getPasswordStrength().label}
                </Text>
              </View>
            )}

            <Input
              label="Confirmer le mot de passe *"
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              placeholder="••••••••"
              secureTextEntry={!showConfirmPassword}
              autoComplete="new-password"
              leftIcon="🔒"
              rightIcon={showConfirmPassword ? "👁️" : "👁️‍🗨️"}
              error={errors.confirmPassword}
              theme={theme}
              onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
            />
          </View>

          {/* Informations professionnelles */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💼 Informations professionnelles</Text>
            
            <Input
              label="Profession *"
              value={formData.profession}
              onChangeText={(value) => handleInputChange('profession', value)}
              placeholder="Ex: Développeur, Manager..."
              autoCapitalize="words"
              leftIcon="💼"
              error={errors.profession}
              theme={theme}
            />

            <Input
              label="Entreprise (optionnel)"
              value={formData.company}
              onChangeText={(value) => handleInputChange('company', value)}
              placeholder="Nom de votre entreprise"
              autoCapitalize="words"
              leftIcon="🏢"
              theme={theme}
            />

            <Input
              label="Téléphone (optionnel)"
              value={formData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              placeholder="06 12 34 56 78"
              keyboardType="phone-pad"
              leftIcon="📱"
              error={errors.phone}
              theme={theme}
            />
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              title="Créer mon compte"
              onPress={handleSubmit}
              loading={isSubmitting || loading}
              disabled={isSubmitting || loading}
              fullWidth
              theme={theme}
              style={styles.submitButton}
            />

            <View style={styles.loginLink}>
              <Text style={styles.loginText}>Déjà un compte ? </Text>
              <Button
                title="Se connecter"
                onPress={onLogin}
                variant="secondary"
                size="small"
                theme={theme}
                disabled={isSubmitting || loading}
              />
            </View>
          </View>

          {/* Aide */}
          <View style={styles.helpSection}>
            <Text style={styles.helpTitle}>💡 Conseils</Text>
            <Text style={styles.helpText}>
              • Utilisez un mot de passe fort avec majuscules, minuscules et chiffres{'\n'}
              • Votre email servira d'identifiant de connexion{'\n'}
              • Toutes les informations peuvent être modifiées plus tard
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const createRegisterFormStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    
    scrollView: {
      flex: 1,
    },
    
    form: {
      padding: theme.spacing.large,
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
    
    section: {
      marginBottom: theme.spacing.xlarge,
    },
    
    sectionTitle: {
      fontSize: theme.fontSizes.medium,
      fontWeight: theme.fontWeights.semibold,
      color: theme.colors.text,
      marginBottom: theme.spacing.medium,
    },
    
    row: {
      flexDirection: 'row',
      gap: theme.spacing.medium,
    },
    
    halfInput: {
      flex: 1,
    },
    
    passwordStrength: {
      marginTop: theme.spacing.small,
      marginBottom: theme.spacing.medium,
    },
    
    strengthBar: {
      height: 4,
      backgroundColor: theme.colors.border,
      borderRadius: 2,
      overflow: 'hidden',
      marginBottom: theme.spacing.tiny,
    },
    
    strengthFill: {
      height: '100%',
      borderRadius: 2,
    },
    
    strengthLabel: {
      fontSize: theme.fontSizes.tiny,
      fontWeight: theme.fontWeights.medium,
    },
    
    actions: {
      marginTop: theme.spacing.large,
    },
    
    submitButton: {
      marginBottom: theme.spacing.large,
    },
    
    loginLink: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    
    loginText: {
      fontSize: theme.fontSizes.regular,
      color: theme.colors.textSecondary,
    },
    
    helpSection: {
      backgroundColor: theme.colors.primaryLight,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.medium,
      marginTop: theme.spacing.large,
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
  });