// src/services/firebase/config.ts
import { initializeApp, getApps } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';

// Configuration Firebase (automatique avec les fichiers google-services.json et GoogleService-Info.plist)
class FirebaseConfig {
  private static instance: FirebaseConfig;
  
  private constructor() {
    this.initializeFirebase();
  }

  public static getInstance(): FirebaseConfig {
    if (!FirebaseConfig.instance) {
      FirebaseConfig.instance = new FirebaseConfig();
    }
    return FirebaseConfig.instance;
  }

  private initializeFirebase() {
    // Firebase s'initialise automatiquement avec React Native Firebase
    console.log('🔥 Firebase initialized');
    
    // Configuration Firestore
    if (__DEV__) {
      // En développement, on peut utiliser l'émulateur
      // firestore().useEmulator('localhost', 8080);
    }
    
    // Configuration Analytics
    analytics().setAnalyticsCollectionEnabled(true);
    
    // Configuration Crashlytics
    crashlytics().setCrashlyticsCollectionEnabled(true);
  }

  // Getters pour les services Firebase
  get auth() {
    return auth();
  }

  get firestore() {
    return firestore();
  }

  get analytics() {
    return analytics();
  }

  get crashlytics() {
    return crashlytics();
  }

  // Méthode pour vérifier la connexion
  async checkConnection(): Promise<boolean> {
    try {
      await this.firestore.disableNetwork();
      await this.firestore.enableNetwork();
      return true;
    } catch (error) {
      console.error('Firebase connection error:', error);
      return false;
    }
  }
}

export default FirebaseConfig.getInstance();