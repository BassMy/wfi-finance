// src/screens/auth/ForgotPasswordScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { AuthService } from '../../services/firebase/auth.service';
import { Theme, lightTheme } from '../../styles/theme';
import { validateEmail } from '../../utils/validation';

interface ForgotPasswordScreenProps {
  onNavigateToLogin: () => void;
  theme?: Theme;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  onNavigateToLogin,
  theme = lightTheme,
}) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const authService = AuthService.getInstance();
  const styles = createForgotPasswordStyles(theme);

  const handleResetPassword = async () => {
    setError('');

    if (!email.trim()) {
      setError('Veuillez saisir votre adresse email');
      return;
    }

    if (!validateEmail(email)) {
      setError('Format d\'email invalide');
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.resetPassword(email);
      
      if (result.success) {
        Alert.alert(
          'Email envoyé !',
          'Un email de réinitialisation a été envoyé à votre adresse. Vérifiez votre boîte de réception.',
          [
            {
              text: 'OK',
              onPress: onNavigateToLogin,
            },
          ]
        );
      } else {
        setError(result.error || 'Erreur lors de l\'envoi');
      }
    } catch (error) {
      setError('Une erreur inattendue s\'est produite');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.icon}>🔑</Text>
          <Text style={styles.title}>Mot de passe oublié ?</Text>
          <Text style={styles.subtitle}>
            Saisissez votre adresse email pour recevoir un lien de réinitialisation
          </Text>
        </View>

        {/* Formulaire */}
        <View style={styles.formContainer}>
          <Input
            label="Adresse email"
            value={email}
            onChangeText={setEmail}
            placeholder="votre@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            leftIcon="📧"
            error={error}
            theme={theme}
          />

          <Button
            title="Envoyer le lien"
            onPress={handleResetPassword}
            loading={isLoading}
            disabled={isLoading}
            fullWidth
            theme={theme}
            style={styles.resetButton}
          />
        </View>

        {/* Retour */}
        <View style={styles.backSection}>
          <Text style={styles.backText}>
            Vous vous souvenez de votre mot de passe ?
          </Text>
          <Button
            title="← Retour à la connexion"
            onPress={onNavigateToLogin}
            variant="secondary"
            theme={theme}
          />
        </View>

        {/* Conseils */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>💡 Conseils</Text>
          <Text style={styles.tipText}>
            • Vérifiez votre dossier spam/courrier indésirable{'\n'}
            • Le lien est valide pendant 1 heure{'\n'}
            • Contactez le support si vous ne recevez rien
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const createForgotPasswordStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    
    content: {
      flex: 1,
      paddingHorizontal: theme.spacing.large,
      justifyContent: 'center',
    },
    
    header: {
      alignItems: 'center',
      marginBottom: theme.spacing.xlarge,
    },
    
    icon: {
      fontSize: 60,
      marginBottom: theme.spacing.medium,
    },
    
    title: {
      fontSize: theme.fontSizes.xlarge,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: theme.spacing.medium,
    },
    
    subtitle: {
      fontSize: theme.fontSizes.regular,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: theme.fontSizes.large,
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
    
    resetButton: {
      marginTop: theme.spacing.medium,
    },
    
    backSection: {
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.large,
      padding: theme.spacing.large,
      marginBottom: theme.spacing.large,
      borderWidth: theme.isDark ? 1 : 0,
      borderColor: theme.colors.border,
    },
    
    backText: {
      fontSize: theme.fontSizes.regular,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.medium,
      textAlign: 'center',
    },
    
    tipsSection: {
      backgroundColor: theme.isDark ? theme.colors.primaryLight : '#EFF6FF',
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.large,
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    
    tipsTitle: {
      fontSize: theme.fontSizes.medium,
      fontWeight: theme.fontWeights.semibold,
      color: theme.colors.primary,
      marginBottom: theme.spacing.small,
    },
    
    tipText: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.primary,
      lineHeight: theme.fontSizes.regular,
    },
  });