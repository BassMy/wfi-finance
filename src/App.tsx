// src/App.tsx - Version progressive
import React, { useEffect, useState } from 'react';
import { StatusBar, View, Text, TouchableOpacity, Alert } from 'react-native';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { useTheme } from './hooks/useTheme';
import { useAuth } from './hooks/useAuth';
import { useAppDispatch } from './store/hooks';
import { loadSettings } from './store/slices/settingsSlice';

// Essayons d'importer vos écrans un par un
let LoginScreen: any = null;
let HomeScreen: any = null;

try {
  const loginModule = require('./screens/auth/LoginScreen');
  LoginScreen = loginModule.LoginScreen;
} catch (error) {
  console.warn('LoginScreen not found:', error);
}

try {
  const homeModule = require('./screens/main/HomeScreen');
  HomeScreen = homeModule.HomeScreen;
} catch (error) {
  console.warn('HomeScreen not found:', error);
}

// Écran de login simple de fallback
const FallbackLoginScreen: React.FC<{ theme: any }> = ({ theme }) => {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('demo@workforit.com');
  const [password, setPassword] = useState('demo123');

  const handleLogin = async () => {
    const success = await login({ email, password });
    if (success) {
      Alert.alert('Succès', 'Connexion réussie !');
    } else {
      Alert.alert('Erreur', 'Échec de la connexion');
    }
  };

  return (
    <View style={{
      flex: 1,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      paddingHorizontal: 24,
    }}>
      <Text style={{
        fontSize: 60,
        textAlign: 'center',
        marginBottom: 16,
      }}>💼</Text>
      
      <Text style={{
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        color: theme.colors.primary,
        marginBottom: 8,
      }}>WorkForIt</Text>
      
      <Text style={{
        fontSize: 16,
        textAlign: 'center',
        color: theme.colors.textSecondary,
        marginBottom: 32,
      }}>Connectez-vous pour continuer</Text>

      <View style={{
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
      }}>
        <Text style={{
          fontSize: 24,
          fontWeight: 'bold',
          textAlign: 'center',
          color: theme.colors.text,
          marginBottom: 24,
        }}>🔐 Connexion</Text>

        <TouchableOpacity
          style={{
            backgroundColor: theme.colors.primary,
            borderRadius: 8,
            padding: 16,
            alignItems: 'center',
          }}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={{
            color: 'white',
            fontSize: 16,
            fontWeight: '600',
          }}>
            {isLoading ? 'Connexion...' : 'Se connecter (démo)'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Écran principal simple de fallback  
const FallbackHomeScreen: React.FC<{ theme: any }> = ({ theme }) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    const success = await logout();
    if (success) {
      Alert.alert('Déconnecté', 'Vous avez été déconnecté avec succès');
    }
  };

  return (
    <View style={{
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingHorizontal: 24,
      paddingTop: 40,
    }}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
      }}>
        <Text style={{
          fontSize: 18,
          fontWeight: 'bold',
          color: theme.colors.text,
        }}>
          Bonjour {user?.firstName} ! 👋
        </Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={{
            fontSize: 14,
            fontWeight: '500',
            color: theme.colors.danger,
          }}>
            Déconnexion
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
      }}>
        <Text style={{
          fontSize: 18,
          fontWeight: 'bold',
          color: theme.colors.text,
          marginBottom: 16,
        }}>🎉 Application opérationnelle !</Text>
        
        <Text style={{
          fontSize: 14,
          color: theme.colors.textSecondary,
          marginBottom: 8,
        }}>✅ Redux Store configuré</Text>
        
        <Text style={{
          fontSize: 14,
          color: theme.colors.textSecondary,
          marginBottom: 8,
        }}>✅ Authentification fonctionnelle</Text>
        
        <Text style={{
          fontSize: 14,
          color: theme.colors.textSecondary,
          marginBottom: 8,
        }}>✅ Thème clair/sombre</Text>
        
        <Text style={{
          fontSize: 14,
          color: theme.colors.textSecondary,
          marginBottom: 16,
        }}>✅ Base pour vos vrais écrans</Text>

        <Text style={{
          fontSize: 12,
          color: theme.colors.textTertiary,
          fontStyle: 'italic',
        }}>
          Maintenant, vous pouvez intégrer progressivement vos écrans réels !
        </Text>
      </View>
    </View>
  );
};

// Composant principal
const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    dispatch(loadSettings());
  }, [dispatch]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar 
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      
      {isAuthenticated ? (
        // Essayer d'utiliser votre HomeScreen, sinon fallback
        HomeScreen ? (
          <HomeScreen theme={theme} />
        ) : (
          <FallbackHomeScreen theme={theme} />
        )
      ) : (
        // Essayer d'utiliser votre LoginScreen, sinon fallback
        LoginScreen ? (
          <LoginScreen
            onNavigateToRegister={() => console.log('Navigate to register')}
            onNavigateToForgotPassword={() => console.log('Navigate to forgot password')}
            theme={theme}
          />
        ) : (
          <FallbackLoginScreen theme={theme} />
        )
      )}
    </View>
  );
};

// App principal
function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;