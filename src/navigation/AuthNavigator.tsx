// src/navigation/AuthNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { Theme } from '../styles/theme';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

interface AuthNavigatorProps {
  theme: Theme;
}

export const AuthNavigator: React.FC<AuthNavigatorProps> = ({ theme }) => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        cardStyle: { backgroundColor: theme.colors.background },
      }}
      initialRouteName="Login"
    >
      <Stack.Screen name="Login">
        {({ navigation }) => (
          <LoginScreen
            onNavigateToRegister={() => navigation.navigate('Register')}
            onNavigateToForgotPassword={() => navigation.navigate('ForgotPassword')}
            theme={theme}
          />
        )}
      </Stack.Screen>
      
      <Stack.Screen name="Register">
        {({ navigation }) => (
          <RegisterScreen
            onNavigateToLogin={() => navigation.navigate('Login')}
            theme={theme}
          />
        )}
      </Stack.Screen>
      
      <Stack.Screen name="ForgotPassword">
        {({ navigation }) => (
          <ForgotPasswordScreen
            onNavigateToLogin={() => navigation.navigate('Login')}
            theme={theme}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};