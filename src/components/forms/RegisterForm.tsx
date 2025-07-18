// src/forms/registerForms.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { FormService, FormState } from '../services/forms';

interface RegisterFormProps {
  onSubmit: (userData: any) => void;
  isLoading?: boolean;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSubmit, isLoading = false }) => {
  const [formState, setFormState] = useState<FormState>({
    firstName: {
      value: '',
      touched: false,
      rules: [
        FormService.commonRules.required('Le prénom est requis'),
        { minLength: 2, message: 'Le prénom doit faire au moins 2 caractères' },
      ],
    },
    lastName: {
      value: '',
      touched: false,
      rules: [
        FormService.commonRules.required('Le nom est requis'),
        { minLength: 2, message: 'Le nom doit faire au moins 2 caractères' },
      ],
    },
    email: {
      value: '',
      touched: false,
      rules: [
        FormService.commonRules.required('L\'email est requis'),
        FormService.commonRules.email(),
      ],
    },
    password: {
      value: '',
      touched: false,
      rules: [
        FormService.commonRules.required('Le mot de passe est requis'),
        { minLength: 8, message: 'Le mot de passe doit faire au moins 8 caractères' },
        {
          pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          message: 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre',
        },
      ],
    },
    confirmPassword: {
      value: '',
      touched: false,
      rules: [
        FormService.commonRules.required('Confirmez votre mot de passe'),
        {
          custom: (value) => value === formState.password?.value,
          message: 'Les mots de passe ne correspondent pas',
        },
      ],
    },
    phone: {
      value: '',
      touched: false,
      rules: [
        {
          pattern: /^(\+33|0)[1-9](\d{8})$/,
          message: 'Format de téléphone invalide',
        },
      ],
    },
    company: {
      value: '',
      touched: false,
      rules: [],
    },
    profession: {
      value: '',
      touched: false,
      rules: [
        FormService.commonRules.required('La profession est requise'),
      ],
    },
  });

  const updateField = (fieldName: string, value: string) => {
    setFormState(prev => FormService.updateField(prev, fieldName, value));
  };

  const handleBlur = (fieldName: string) => {
    setFormState(prev => FormService.touchField(prev, fieldName));
  };

  const handleSubmit = () => {
    const { isValid, errors } = FormService.validateForm(formState);
    
    if (!isValid) {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      const touchedState = { ...formState };
      Object.keys(touchedState).forEach(key => {
        touchedState[key] = { ...touchedState[key], touched: true, error: errors[key] };
      });
      setFormState(touchedState);
      
      Alert.alert('Erreur', 'Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    const values = FormService.getFormValues(formState);
    onSubmit(values);
  };

  const renderInput = (
    fieldName: string,
    placeholder: string,
    secureTextEntry: boolean = false,
    keyboardType: any = 'default'
  ) => {
    const field = formState[fieldName];
    const hasError = field.touched && field.error;

    return (
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, hasError && styles.inputError]}
          placeholder={placeholder}
          value={field.value}
          onChangeText={(value) => updateField(fieldName, value)}
          onBlur={() => handleBlur(fieldName)}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={secureTextEntry ? 'none' : 'words'}
        />
        {hasError && <Text style={styles.errorText}>{field.error}</Text>}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.form}>
        <Text style={styles.title}>Inscription</Text>
        
        {renderInput('firstName', 'Prénom *')}
        {renderInput('lastName', 'Nom *')}
        {renderInput('email', 'Email *', false, 'email-address')}
        {renderInput('password', 'Mot de passe *', true)}
        {renderInput('confirmPassword', 'Confirmer le mot de passe *', true)}
        {renderInput('phone', 'Téléphone', false, 'phone-pad')}
        {renderInput('company', 'Entreprise (optionnel)')}
        {renderInput('profession', 'Profession *')}

        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? 'Inscription...' : 'S\'inscrire'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export const LoginForm: React.FC<{
  onSubmit: (credentials: { email: string; password: string }) => void;
  isLoading?: boolean;
}> = ({ onSubmit, isLoading = false }) => {
  const [formState, setFormState] = useState<FormState>({
    email: {
      value: '',
      touched: false,
      rules: [
        FormService.commonRules.required('L\'email est requis'),
        FormService.commonRules.email(),
      ],
    },
    password: {
      value: '',
      touched: false,
      rules: [
        FormService.commonRules.required('Le mot de passe est requis'),
      ],
    },
  });

  const updateField = (fieldName: string, value: string) => {
    setFormState(prev => FormService.updateField(prev, fieldName, value));
  };

  const handleBlur = (fieldName: string) => {
    setFormState(prev => FormService.touchField(prev, fieldName));
  };

  const handleSubmit = () => {
    const { isValid, errors } = FormService.validateForm(formState);
    
    if (!isValid) {
      const touchedState = { ...formState };
      Object.keys(touchedState).forEach(key => {
        touchedState[key] = { ...touchedState[key], touched: true, error: errors[key] };
      });
      setFormState(touchedState);
      return;
    }

    const values = FormService.getFormValues(formState);
    onSubmit(values);
  };

  const renderInput = (
    fieldName: string,
    placeholder: string,
    secureTextEntry: boolean = false,
    keyboardType: any = 'default'
  ) => {
    const field = formState[fieldName];
    const hasError = field.touched && field.error;

    return (
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, hasError && styles.inputError]}
          placeholder={placeholder}
          value={field.value}
          onChangeText={(value) => updateField(fieldName, value)}
          onBlur={() => handleBlur(fieldName)}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={secureTextEntry ? 'none' : 'none'}
        />
        {hasError && <Text style={styles.errorText}>{field.error}</Text>}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>Connexion</Text>
        
        {renderInput('email', 'Email', false, 'email-address')}
        {renderInput('password', 'Mot de passe', true)}

        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
    padding: 20,
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  submitButton: {
    backgroundColor: '#3498db',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});