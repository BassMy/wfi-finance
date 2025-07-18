// src/services/firebase/auth.service.ts
import firebaseConfig from './config';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { User, LoginCredentials, RegisterCredentials, ApiResponse } from '../../types';
import { FirestoreService } from './firestore.service';

export class AuthService {
  private static instance: AuthService;
  private firestoreService: FirestoreService;

  private constructor() {
    this.firestoreService = FirestoreService.getInstance();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Créer un compte utilisateur
   */
  async register(credentials: RegisterCredentials): Promise<ApiResponse<User>> {
    try {
      console.log('🔐 Registering user:', credentials.email);

      // Créer le compte Firebase Auth
      const userCredential = await firebaseConfig.auth.createUserWithEmailAndPassword(
        credentials.email,
        credentials.password
      );

      if (!userCredential.user) {
        throw new Error('Failed to create user account');
      }

      // Mettre à jour le profil Firebase
      await userCredential.user.updateProfile({
        displayName: `${credentials.firstName} ${credentials.lastName}`,
      });

      // Créer le document utilisateur dans Firestore
      const userData: User = {
        uid: userCredential.user.uid,
        email: credentials.email,
        firstName: credentials.firstName,
        lastName: credentials.lastName,
        photoURL: userCredential.user.photoURL || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        settings: {
          currency: 'EUR',
          darkMode: false,
          notifications: true,
          language: 'fr',
          budgetMethod: 'classic_50_30_20',
        },
      };

      await this.firestoreService.createDocument('users', userData.uid, userData);

      // Analytics
      await firebaseConfig.analytics.logEvent('sign_up', {
        method: 'email',
      });

      console.log('✅ User registered successfully');
      return {
        success: true,
        data: userData,
        message: 'Compte créé avec succès',
      };
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      
      // Analytics
      await firebaseConfig.crashlytics.recordError(error);

      return {
        success: false,
        error: this.getErrorMessage(error.code),
      };
    }
  }

  /**
   * Connexion utilisateur
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<User>> {
    try {
      console.log('🔐 Logging in user:', credentials.email);

      const userCredential = await firebaseConfig.auth.signInWithEmailAndPassword(
        credentials.email,
        credentials.password
      );

      if (!userCredential.user) {
        throw new Error('Failed to sign in');
      }

      // Récupérer les données utilisateur depuis Firestore
      const userDoc = await this.firestoreService.getDocument('users', userCredential.user.uid);
      
      if (!userDoc.exists) {
        throw new Error('User data not found');
      }

      const userData = userDoc.data() as User;

      // Mettre à jour lastLoginAt
      await this.firestoreService.updateDocument('users', userData.uid, {
        lastLoginAt: new Date().toISOString(),
      });

      // Analytics
      await firebaseConfig.analytics.logEvent('login', {
        method: 'email',
      });

      console.log('✅ User logged in successfully');
      return {
        success: true,
        data: userData,
        message: 'Connexion réussie',
      };
    } catch (error: any) {
      console.error('❌ Login error:', error);
      
      await firebaseConfig.crashlytics.recordError(error);

      return {
        success: false,
        error: this.getErrorMessage(error.code),
      };
    }
  }

  /**
   * Déconnexion
   */
  async logout(): Promise<ApiResponse<null>> {
    try {
      console.log('🚪 Logging out user');

      await firebaseConfig.auth.signOut();

      // Analytics
      await firebaseConfig.analytics.logEvent('logout');

      console.log('✅ User logged out successfully');
      return {
        success: true,
        message: 'Déconnexion réussie',
      };
    } catch (error: any) {
      console.error('❌ Logout error:', error);
      
      await firebaseConfig.crashlytics.recordError(error);

      return {
        success: false,
        error: 'Erreur lors de la déconnexion',
      };
    }
  }

  /**
   * Réinitialisation de mot de passe
   */
  async resetPassword(email: string): Promise<ApiResponse<null>> {
    try {
      console.log('🔑 Sending password reset email to:', email);

      await firebaseConfig.auth.sendPasswordResetEmail(email);

      // Analytics
      await firebaseConfig.analytics.logEvent('password_reset_request', {
        email,
      });

      console.log('✅ Password reset email sent');
      return {
        success: true,
        message: 'Email de réinitialisation envoyé',
      };
    } catch (error: any) {
      console.error('❌ Password reset error:', error);
      
      await firebaseConfig.crashlytics.recordError(error);

      return {
        success: false,
        error: this.getErrorMessage(error.code),
      };
    }
  }

  /**
   * Mettre à jour le profil utilisateur
   */
  async updateProfile(updates: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const currentUser = firebaseConfig.auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      console.log('👤 Updating user profile');

      // Mettre à jour Firebase Auth si nécessaire
      if (updates.firstName || updates.lastName) {
        await currentUser.updateProfile({
          displayName: `${updates.firstName || ''} ${updates.lastName || ''}`.trim(),
        });
      }

      // Mettre à jour Firestore
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await this.firestoreService.updateDocument('users', currentUser.uid, updateData);

      // Récupérer les données mises à jour
      const userDoc = await this.firestoreService.getDocument('users', currentUser.uid);
      const userData = userDoc.data() as User;

      // Analytics
      await firebaseConfig.analytics.logEvent('profile_update');

      console.log('✅ Profile updated successfully');
      return {
        success: true,
        data: userData,
        message: 'Profil mis à jour',
      };
    } catch (error: any) {
      console.error('❌ Profile update error:', error);
      
      await firebaseConfig.crashlytics.recordError(error);

      return {
        success: false,
        error: 'Erreur lors de la mise à jour du profil',
      };
    }
  }

  /**
   * Supprimer le compte utilisateur
   */
  async deleteAccount(): Promise<ApiResponse<null>> {
    try {
      const currentUser = firebaseConfig.auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      console.log('🗑️ Deleting user account');

      // Supprimer toutes les données utilisateur de Firestore
      await this.firestoreService.deleteUserData(currentUser.uid);

      // Supprimer le compte Firebase Auth
      await currentUser.delete();

      // Analytics
      await firebaseConfig.analytics.logEvent('account_delete');

      console.log('✅ Account deleted successfully');
      return {
        success: true,
        message: 'Compte supprimé avec succès',
      };
    } catch (error: any) {
      console.error('❌ Account deletion error:', error);
      
      await firebaseConfig.crashlytics.recordError(error);

      return {
        success: false,
        error: 'Erreur lors de la suppression du compte',
      };
    }
  }

  /**
   * Obtenir l'utilisateur actuel
   */
  getCurrentUser(): FirebaseAuthTypes.User | null {
    return firebaseConfig.auth.currentUser;
  }

  /**
   * Obtenir les données complètes de l'utilisateur actuel
   */
  async getCurrentUserData(): Promise<User | null> {
    try {
      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        return null;
      }

      const userDoc = await this.firestoreService.getDocument('users', currentUser.uid);
      
      if (!userDoc.exists) {
        return null;
      }

      return userDoc.data() as User;
    } catch (error) {
      console.error('❌ Error getting current user data:', error);
      return null;
    }
  }

  /**
   * Écouter les changements d'authentification
   */
  onAuthStateChanged(callback: (user: FirebaseAuthTypes.User | null) => void) {
    return firebaseConfig.auth.onAuthStateChanged(callback);
  }

  /**
   * Vérifier si l'utilisateur est connecté
   */
  isAuthenticated(): boolean {
    return !!firebaseConfig.auth.currentUser;
  }

  /**
   * Obtenir le token d'authentification
   */
  async getAuthToken(): Promise<string | null> {
    try {
      const currentUser = firebaseConfig.auth.currentUser;
      if (!currentUser) {
        return null;
      }

      return await currentUser.getIdToken();
    } catch (error) {
      console.error('❌ Error getting auth token:', error);
      return null;
    }
  }

  /**
   * Convertir les codes d'erreur Firebase en messages lisibles
   */
  private getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'Cette adresse email est déjà utilisée';
      case 'auth/invalid-email':
        return 'Adresse email invalide';
      case 'auth/weak-password':
        return 'Le mot de passe doit contenir au moins 6 caractères';
      case 'auth/user-not-found':
        return 'Aucun compte trouvé avec cette adresse email';
      case 'auth/wrong-password':
        return 'Mot de passe incorrect';
      case 'auth/too-many-requests':
        return 'Trop de tentatives. Réessayez plus tard';
      case 'auth/network-request-failed':
        return 'Erreur de connexion réseau';
      case 'auth/user-disabled':
        return 'Ce compte a été désactivé';
      default:
        return 'Une erreur inattendue s\'est produite';
    }
  }
}

export default AuthService.getInstance();