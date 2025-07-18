// src/hooks/useAuth.ts
import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { 
  loginUser, 
  registerUser, 
  logoutUser, 
  updateUserProfile,
  clearError,
  setUser 
} from '../store/slices/authSlice';
import { AuthService } from '../services/firebase/auth.service';
import { LoginCredentials, RegisterCredentials } from '../types/auth.types';
import { User } from '../types/user.types';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const authState = useAppSelector((state) => state.auth);
  const authService = AuthService.getInstance();

  /**
   * Connexion utilisateur
   */
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      const result = await dispatch(loginUser(credentials));
      return loginUser.fulfilled.match(result);
    } catch (error) {
      console.error('Login error in hook:', error);
      return false;
    }
  }, [dispatch]);

  /**
   * Inscription utilisateur
   */
  const register = useCallback(async (credentials: RegisterCredentials) => {
    try {
      const result = await dispatch(registerUser(credentials));
      return registerUser.fulfilled.match(result);
    } catch (error) {
      console.error('Register error in hook:', error);
      return false;
    }
  }, [dispatch]);

  /**
   * Déconnexion utilisateur
   */
  const logout = useCallback(async () => {
    try {
      const result = await dispatch(logoutUser());
      return logoutUser.fulfilled.match(result);
    } catch (error) {
      console.error('Logout error in hook:', error);
      return false;
    }
  }, [dispatch]);

  /**
   * Mettre à jour le profil utilisateur
   */
  const updateProfile = useCallback(async (updates: Partial<User>) => {
    try {
      const result = await dispatch(updateUserProfile(updates));
      return updateUserProfile.fulfilled.match(result);
    } catch (error) {
      console.error('Update profile error in hook:', error);
      return false;
    }
  }, [dispatch]);

  /**
   * Réinitialiser le mot de passe
   */
  const resetPassword = useCallback(async (email: string) => {
    try {
      const result = await authService.resetPassword(email);
      return result.success;
    } catch (error) {
      console.error('Reset password error in hook:', error);
      return false;
    }
  }, [authService]);

  /**
   * Supprimer le compte utilisateur
   */
  const deleteAccount = useCallback(async () => {
    try {
      const result = await authService.deleteAccount();
      if (result.success) {
        dispatch(setUser(null));
      }
      return result.success;
    } catch (error) {
      console.error('Delete account error in hook:', error);
      return false;
    }
  }, [authService, dispatch]);

  /**
   * Effacer les erreurs
   */
  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  /**
   * Vérifier si l'utilisateur est authentifié
   */
  const checkIsAuthenticated = useCallback(() => {
    return authState.isAuthenticated && !!authState.user;
  }, [authState.isAuthenticated, authState.user]);

  /**
   * Obtenir l'utilisateur actuel
   */
  const getCurrentUser = useCallback(() => {
    return authState.user;
  }, [authState.user]);

  /**
   * Obtenir le token d'authentification
   */
  const getAuthToken = useCallback(async () => {
    try {
      return await authService.getAuthToken();
    } catch (error) {
      console.error('Get auth token error in hook:', error);
      return null;
    }
  }, [authService]);

  /**
   * Recharger les données utilisateur
   */
  const refreshUser = useCallback(async () => {
    try {
      const userData = await authService.getCurrentUserData();
      if (userData) {
        dispatch(setUser(userData));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Refresh user error in hook:', error);
      return false;
    }
  }, [authService, dispatch]);

  /**
   * Vérifier si l'email est disponible
   */
  const checkEmailAvailability = useCallback(async (email: string) => {
    try {
      // Cette fonctionnalité nécessiterait une API dédiée
      // Pour l'instant, on retourne toujours true
      return true;
    } catch (error) {
      console.error('Check email availability error in hook:', error);
      return false;
    }
  }, []);

  /**
   * Mettre à jour les paramètres utilisateur
   */
  const updateSettings = useCallback(async (settings: any) => {
    try {
      const currentUser = authState.user;
      if (!currentUser) return false;

      const result = await updateProfile({
        ...currentUser,
        settings: { ...currentUser.settings, ...settings },
      });

      return result;
    } catch (error) {
      console.error('Update settings error in hook:', error);
      return false;
    }
  }, [authState.user, updateProfile]);

  /**
   * Obtenir les informations de profil
   */
  const getProfileInfo = useCallback(() => {
    const user = authState.user;
    if (!user) return null;

    return {
      fullName: `${user.firstName} ${user.lastName}`,
      initials: `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase(),
      email: user.email,
      photoURL: user.photoURL,
      memberSince: new Date(user.createdAt).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
      }),
    };
  }, [authState.user]);

  /**
   * Vérifier les permissions utilisateur
   */
  const hasPermission = useCallback((permission: string) => {
    // Pour l'instant, tous les utilisateurs ont toutes les permissions
    // Cette logique peut être étendue selon les besoins
    return checkIsAuthenticated();
  }, [checkIsAuthenticated]);

  /**
   * Obtenir les statistiques utilisateur
   */
  const getUserStats = useCallback(() => {
    const user = authState.user;
    if (!user) return null;

    const accountAge = Math.floor(
      (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      accountAge,
      accountAgeText: accountAge < 30 
        ? `${accountAge} jour${accountAge > 1 ? 's' : ''}` 
        : `${Math.floor(accountAge / 30)} mois`,
      lastUpdate: new Date(user.updatedAt).toLocaleDateString('fr-FR'),
    };
  }, [authState.user]);

  return {
    // État
    user: authState.user,
    isLoading: authState.isLoading,
    error: authState.error,
    isAuthenticated: authState.isAuthenticated,

    // Actions principales
    login,
    register,
    logout,
    updateProfile,
    resetPassword,
    deleteAccount,

    // Actions utilitaires
    clearAuthError,
    refreshUser,
    checkEmailAvailability,
    updateSettings,
    getAuthToken,

    // Getters
    getCurrentUser,
    getProfileInfo,
    getUserStats,
    checkIsAuthenticated,
    hasPermission,
  };
};