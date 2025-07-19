// src/store/slices/settingsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Types simplifiés intégrés
interface UserSettings {
  currency: 'EUR' | 'USD' | 'GBP';
  darkMode: boolean;
  notifications: boolean;
  language: 'fr' | 'en';
  budgetMethod: string;
}

// Configuration par défaut
const APP_CONFIG = {
  defaultCurrency: 'EUR' as const,
  defaultLanguage: 'fr' as const,
};

// Actions asynchrones simplifiées
export const loadSettings = createAsyncThunk<UserSettings, void>(
  'settings/loadSettings',
  async (_, { rejectWithValue }) => {
    try {
      // Simulation de chargement depuis le stockage local
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Essayer de charger depuis localStorage
      const stored = localStorage.getItem('workforit_settings');
      if (stored) {
        return JSON.parse(stored);
      }

      // Paramètres par défaut
      return getDefaultSettings();
    } catch (error) {
      console.warn('Failed to load settings:', error);
      return getDefaultSettings();
    }
  }
);

export const saveSettings = createAsyncThunk<UserSettings, Partial<UserSettings>>(
  'settings/saveSettings',
  async (settings, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any;
      const currentSettings = state.settings.settings;
      const newSettings = { ...currentSettings, ...settings };

      // Simulation de sauvegarde
      await new Promise(resolve => setTimeout(resolve, 100));

      // Sauvegarder dans localStorage
      localStorage.setItem('workforit_settings', JSON.stringify(newSettings));

      return newSettings;
    } catch (error) {
      return rejectWithValue('Erreur lors de la sauvegarde des paramètres');
    }
  }
);

export const resetSettings = createAsyncThunk<UserSettings, void>(
  'settings/resetSettings',
  async (_, { rejectWithValue }) => {
    try {
      const defaultSettings = getDefaultSettings();

      // Simulation de reset
      await new Promise(resolve => setTimeout(resolve, 100));

      // Sauvegarder les paramètres par défaut
      localStorage.setItem('workforit_settings', JSON.stringify(defaultSettings));

      return defaultSettings;
    } catch (error) {
      return rejectWithValue('Erreur lors de la réinitialisation des paramètres');
    }
  }
);

// Actions rapides pour les paramètres fréquents
export const updateTheme = createAsyncThunk<boolean, boolean>(
  'settings/updateTheme',
  async (darkMode, { dispatch }) => {
    await dispatch(saveSettings({ darkMode }));
    return darkMode;
  }
);

export const updateLanguage = createAsyncThunk<'fr' | 'en', 'fr' | 'en'>(
  'settings/updateLanguage',
  async (language, { dispatch }) => {
    await dispatch(saveSettings({ language }));
    return language;
  }
);

export const updateCurrency = createAsyncThunk<'EUR' | 'USD' | 'GBP', 'EUR' | 'USD' | 'GBP'>(
  'settings/updateCurrency',
  async (currency, { dispatch }) => {
    await dispatch(saveSettings({ currency }));
    return currency;
  }
);

export const updateNotifications = createAsyncThunk<boolean, boolean>(
  'settings/updateNotifications',
  async (notifications, { dispatch }) => {
    await dispatch(saveSettings({ notifications }));
    return notifications;
  }
);

// Fonction utilitaire
const getDefaultSettings = (): UserSettings => ({
  currency: APP_CONFIG.defaultCurrency,
  darkMode: false,
  notifications: true,
  language: APP_CONFIG.defaultLanguage,
  budgetMethod: 'classic_50_30_20',
});

interface SettingsState {
  settings: UserSettings;
  isInitialized: boolean;
  hasUnsavedChanges: boolean;
  isLoading: boolean;
  error: string | null;
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
      .addCase(resetSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings = action.payload;
        state.hasUnsavedChanges = false;
      })
      .addCase(resetSettings.rejected, (state, action) => {
        state.isLoading = false;
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