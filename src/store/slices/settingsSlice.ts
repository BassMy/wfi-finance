// src/store/slices/settingsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { UserSettings, LoadingState } from '../../types';
import { AuthService } from '../../services/firebase/auth.service';
import { APP_CONFIG, STORAGE_KEYS } from '../../utils/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const authService = AuthService.getInstance();

// Actions asynchrones
export const loadSettings = createAsyncThunk(
  'settings/loadSettings',
  async (_, { rejectWithValue }) => {
    try {
      // Charger depuis le profil utilisateur Firebase
      const userData = await authService.getCurrentUserData();
      if (userData?.settings) {
        return userData.settings;
      }

      // Fallback: charger depuis le stockage local
      const localSettings = await loadLocalSettings();
      return localSettings;
    } catch (error) {
      console.warn('Failed to load settings:', error);
      return getDefaultSettings();
    }
  }
);

export const saveSettings = createAsyncThunk(
  'settings/saveSettings',
  async (settings: Partial<UserSettings>, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const currentSettings = state.settings.settings;
      const newSettings = { ...currentSettings, ...settings };

      // Sauvegarder dans le profil utilisateur Firebase
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        await authService.updateProfile({ settings: newSettings });
      }

      // Sauvegarder localement aussi
      await saveLocalSettings(newSettings);

      return newSettings;
    } catch (error) {
      return rejectWithValue('Erreur lors de la sauvegarde des paramètres');
    }
  }
);

export const resetSettings = createAsyncThunk(
  'settings/resetSettings',
  async (_, { rejectWithValue }) => {
    try {
      const defaultSettings = getDefaultSettings();

      // Sauvegarder dans le profil utilisateur Firebase
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        await authService.updateProfile({ settings: defaultSettings });
      }

      // Sauvegarder localement
      await saveLocalSettings(defaultSettings);

      return defaultSettings;
    } catch (error) {
      return rejectWithValue('Erreur lors de la réinitialisation des paramètres');
    }
  }
);

export const updateTheme = createAsyncThunk(
  'settings/updateTheme',
  async (darkMode: boolean, { dispatch }) => {
    await dispatch(saveSettings({ darkMode }));
    return darkMode;
  }
);

export const updateLanguage = createAsyncThunk(
  'settings/updateLanguage',
  async (language: 'fr' | 'en', { dispatch }) => {
    await dispatch(saveSettings({ language }));
    return language;
  }
);

export const updateCurrency = createAsyncThunk(
  'settings/updateCurrency',
  async (currency: 'EUR' | 'USD' | 'GBP', { dispatch }) => {
    await dispatch(saveSettings({ currency }));
    return currency;
  }
);

export const updateNotifications = createAsyncThunk(
  'settings/updateNotifications',
  async (notifications: boolean, { dispatch }) => {
    await dispatch(saveSettings({ notifications }));
    return notifications;
  }
);

export const updateBudgetMethod = createAsyncThunk(
  'settings/updateBudgetMethod',
  async (budgetMethod: string, { dispatch }) => {
    await dispatch(saveSettings({ budgetMethod }));
    return budgetMethod;
  }
);

// Fonctions utilitaires
const getDefaultSettings = (): UserSettings => ({
  currency: APP_CONFIG.defaultCurrency,
  darkMode: false,
  notifications: true,
  language: APP_CONFIG.defaultLanguage,
  budgetMethod: 'classic_50_30_20',
});

const loadLocalSettings = async (): Promise<UserSettings> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.theme);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to load local settings:', error);
  }
  return getDefaultSettings();
};

const saveLocalSettings = async (settings: UserSettings): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.theme, JSON.stringify(settings));
  } catch (error) {
    console.warn('Failed to save local settings:', error);
  }
};

interface SettingsState extends LoadingState {
  settings: UserSettings;
  isInitialized: boolean;
  hasUnsavedChanges: boolean;
}

const initialState: SettingsState = {
  settings: getDefaultSettings(),
  isInitialized: false,
  hasUnsavedChanges: false,
  isLoading: false,
  error: null,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setSettings: (state, action: PayloadAction<UserSettings>) => {
      state.settings = action.payload;
      state.isInitialized = true;
      state.hasUnsavedChanges = false;
    },

    updateSettingsLocal: (state, action: PayloadAction<Partial<UserSettings>>) => {
      state.settings = { ...state.settings, ...action.payload };
      state.hasUnsavedChanges = true;
    },

    clearUnsavedChanges: (state) => {
      state.hasUnsavedChanges = false;
    },

    toggleDarkMode: (state) => {
      state.settings.darkMode = !state.settings.darkMode;
      state.hasUnsavedChanges = true;
    },

    toggleNotifications: (state) => {
      state.settings.notifications = !state.settings.notifications;
      state.hasUnsavedChanges = true;
    },

    clearSettingsError: (state) => {
      state.error = null;
    },

    resetToDefaults: (state) => {
      state.settings = getDefaultSettings();
      state.hasUnsavedChanges = true;
    },
  },

  extraReducers: (builder) => {
    // Load settings
    builder
      .addCase(loadSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings = action.payload;
        state.isInitialized = true;
        state.hasUnsavedChanges = false;
      })
      .addCase(loadSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isInitialized = true;
      });

    // Save settings
    builder
      .addCase(saveSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings = action.payload;
        state.hasUnsavedChanges = false;
      })
      .addCase(saveSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Reset settings
    builder
      .addCase(resetSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
        state.hasUnsavedChanges = false;
      })
      .addCase(resetSettings.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Update theme
    builder
      .addCase(updateTheme.fulfilled, (state, action) => {
        state.settings.darkMode = action.payload;
        state.hasUnsavedChanges = false;
      });

    // Update language
    builder
      .addCase(updateLanguage.fulfilled, (state, action) => {
        state.settings.language = action.payload;
        state.hasUnsavedChanges = false;
      });

    // Update currency
    builder
      .addCase(updateCurrency.fulfilled, (state, action) => {
        state.settings.currency = action.payload;
        state.hasUnsavedChanges = false;
      });

    // Update notifications
    builder
      .addCase(updateNotifications.fulfilled, (state, action) => {
        state.settings.notifications = action.payload;
        state.hasUnsavedChanges = false;
      });

    // Update budget method
    builder
      .addCase(updateBudgetMethod.fulfilled, (state, action) => {
        state.settings.budgetMethod = action.payload;
        state.hasUnsavedChanges = false;
      });
  },
});

export const {
  setSettings,
  updateSettingsLocal,
  clearUnsavedChanges,
  toggleDarkMode,
  toggleNotifications,
  clearSettingsError,
  resetToDefaults,
} = settingsSlice.actions;

export default settingsSlice.reducer;

// Selectors
export const selectSettings = (state: { settings: SettingsState }) => state.settings.settings;
export const selectDarkMode = (state: { settings: SettingsState }) => state.settings.settings.darkMode;
export const selectLanguage = (state: { settings: SettingsState }) => state.settings.settings.language;
export const selectCurrency = (state: { settings: SettingsState }) => state.settings.settings.currency;
export const selectNotifications = (state: { settings: SettingsState }) => state.settings.settings.notifications;
export const selectBudgetMethod = (state: { settings: SettingsState }) => state.settings.settings.budgetMethod;
export const selectSettingsLoading = (state: { settings: SettingsState }) => state.settings.isLoading;
export const selectSettingsError = (state: { settings: SettingsState }) => state.settings.error;
export const selectSettingsInitialized = (state: { settings: SettingsState }) => state.settings.isInitialized;
export const selectHasUnsavedChanges = (state: { settings: SettingsState }) => state.settings.hasUnsavedChanges;

// Computed selectors
export const selectTheme = (state: { settings: SettingsState }) => {
  const darkMode = selectDarkMode(state);
  return darkMode ? 'dark' : 'light';
};

export const selectLocalization = (state: { settings: SettingsState }) => {
  const language = selectLanguage(state);
  const currency = selectCurrency(state);
  
  return {
    language,
    currency,
    locale: language === 'fr' ? 'fr-FR' : 'en-US',
    currencySymbol: currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '£',
  };
};

export const selectUserPreferences = (state: { settings: SettingsState }) => {
  const settings = selectSettings(state);
  
  return {
    appearance: {
      darkMode: settings.darkMode,
      language: settings.language,
    },
    financial: {
      currency: settings.currency,
      budgetMethod: settings.budgetMethod,
    },
    notifications: {
      enabled: settings.notifications,
    },
  };
};