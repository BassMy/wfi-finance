// src/navigation/AppNavigator.tsx
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setUser } from '../store/slices/authSlice';
import { AuthNavigator } from './AuthNavigator';
import { TabNavigator } from './TabNavigator';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { AuthService } from '../services/firebase/auth.service';
import { Theme, lightTheme, darkTheme } from '../styles/theme';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

interface AppNavigatorProps {
  isDarkMode?: boolean;
}

export const AppNavigator: React.FC<AppNavigatorProps> = ({ isDarkMode = false }) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [isLoading, setIsLoading] = useState(true);
  
  const theme = isDarkMode ? darkTheme : lightTheme;
  const authService = AuthService.getInstance();

  // Écouter les changements d'authentification
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Récupérer les données complètes de l'utilisateur
          const userData = await authService.getCurrentUserData();
          if (userData) {
            dispatch(setUser(userData));
          }
        } else {
          dispatch(setUser(null));
        }
      } catch (error) {
        console.error('Error getting user data:', error);
        dispatch(setUser(null));
      } finally {
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, [dispatch]);

  // Écran de chargement initial
  if (isLoading) {
    return (
      <LoadingSpinner
        fullScreen
        text="Vérification de la connexion..."
        theme={theme}
      />
    );
  }

  return (
    <NavigationContainer
      theme={{
        dark: isDarkMode,
        colors: {
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.text,
          border: theme.colors.border,
          notification: theme.colors.danger,
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
        }}
      >
        {isAuthenticated ? (
          <Stack.Screen name="Main">
            {() => <TabNavigator theme={theme} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Auth">
            {() => <AuthNavigator theme={theme} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};