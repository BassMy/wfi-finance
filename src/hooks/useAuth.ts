// src/hooks/useAuth.ts
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loginUser, registerUser, logoutUser, clearAuth } from '../store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, isLoading, isAuthenticated, error } = useAppSelector(state => state.auth);

  const login = async (credentials: { email: string; password: string }) => {
    try {
      const result = await dispatch(loginUser(credentials));
      return loginUser.fulfilled.match(result);
    } catch (error) {
      return false;
    }
  };

  const register = async (credentials: { 
    email: string; 
    password: string; 
    firstName: string; 
    lastName: string; 
  }) => {
    try {
      const result = await dispatch(registerUser(credentials));
      return registerUser.fulfilled.match(result);
    } catch (error) {
      return false;
    }
  };

  const logout = async () => {
    try {
      const result = await dispatch(logoutUser());
      return logoutUser.fulfilled.match(result);
    } catch (error) {
      return false;
    }
  };

  const updateProfile = async (updates: { firstName?: string; lastName?: string }) => {
    try {
      // Simulation de mise à jour de profil
      await new Promise(resolve => setTimeout(resolve, 300));
      return true;
    } catch (error) {
      return false;
    }
  };

  const deleteAccount = async () => {
    try {
      // Simulation de suppression de compte
      await new Promise(resolve => setTimeout(resolve, 500));
      dispatch(clearAuth());
      return true;
    } catch (error) {
      return false;
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    error,
    login,
    register,
    logout,
    updateProfile,
    deleteAccount,
  };
};