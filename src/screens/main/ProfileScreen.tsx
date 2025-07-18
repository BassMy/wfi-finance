// src/screens/main/ProfileScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Alert,
  Image,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useAuth } from '../../hooks/useAuth';
import { 
  updateTheme,
  updateLanguage,
  updateCurrency,
  updateNotifications,
  resetSettings
} from '../../store/slices/settingsSlice';
import { logoutUser } from '../../store/slices/authSlice';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Theme } from '../../styles/theme';
import { formatCurrency } from '../../utils/formatting';
import { CURRENCIES, LANGUAGES, BUDGET_METHODS } from '../../utils/constants';

interface ProfileScreenProps {
  theme: Theme;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ theme }) => {
  const dispatch = useAppDispatch();
  const { user, logout, updateProfile, deleteAccount } = useAuth();
  
  // Redux state
  const settings = useAppSelector(state => state.settings.settings);
  const budget = useAppSelector(state => state.budget.budget);
  const expenses = useAppSelector(state => state.expenses.expenses);
  const subscriptions = useAppSelector(state => state.subscriptions.subscriptions);
  const settingsLoading = useAppSelector(state => state.settings.isLoading);

  // Local state
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });
  const [showDangerZone, setShowDangerZone] = useState(false);

  const styles = createProfileStyles(theme);

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      const success = await updateProfile({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
      });

      if (success) {
        setShowEditProfile(false);
        Alert.alert('Succès', 'Profil mis à jour avec succès');
      } else {
        Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur inattendue s\'est produite');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnecter',
          style: 'destructive',
          onPress: async () => {
            const success = await logout();
            if (!success) {
              Alert.alert('Erreur', 'Impossible de se déconnecter');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Cette action est irréversible. Toutes vos données seront définitivement supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirmation finale',
              'Tapez "SUPPRIMER" pour confirmer la suppression de votre compte',
              [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Confirmer',
                  style: 'destructive',
                  onPress: async () => {
                    const success = await deleteAccount();
                    if (!success) {
                      Alert.alert('Erreur', 'Impossible de supprimer le compte');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Réinitialiser les paramètres',
      'Tous vos paramètres seront remis aux valeurs par défaut.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          onPress: () => {
            dispatch(resetSettings());
            Alert.alert('Succès', 'Paramètres réinitialisés');
          },
        },
      ]
    );
  };

  const getUserStats = () => {
    if (!user) return null;

    const accountAge = Math.floor(
      (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const activeSubscriptions = subscriptions.filter(sub => sub.isActive).length;

    return {
      accountAge,
      totalExpenses,
      expenseCount: expenses.length,
      activeSubscriptions,
      memberSince: new Date(user.createdAt).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
      }),
    };
  };

  const stats = getUserStats();

  const renderProfileSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>👤 Mon Profil</Text>
      
      <View style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.memberSince}>
              Membre depuis {stats?.memberSince}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setShowEditProfile(!showEditProfile)}
          >
            <Text style={styles.editButtonText}>
              {showEditProfile ? '✕' : '✏️'}
            </Text>
          </TouchableOpacity>
        </View>

        {showEditProfile && (
          <View style={styles.editForm}>
            <Input
              label="Prénom"
              value={profileData.firstName}
              onChangeText={(text) => setProfileData(prev => ({ ...prev, firstName: text }))}
              theme={theme}
            />
            
            <Input
              label="Nom"
              value={profileData.lastName}
              onChangeText={(text) => setProfileData(prev => ({ ...prev, lastName: text }))}
              theme={theme}
            />

            <View style={styles.editActions}>
              <Button
                title="Annuler"
                onPress={() => setShowEditProfile(false)}
                variant="secondary"
                theme={theme}
                style={styles.editButton}
              />
              <Button
                title="Sauvegarder"
                onPress={handleUpdateProfile}
                theme={theme}
                style={styles.editButton}
              />
            </View>
          </View>
        )}
      </View>
    </View>
  );

  const renderStatsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📊 Mes Statistiques</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>💸</Text>
          <Text style={styles.statValue}>{stats?.expenseCount || 0}</Text>
          <Text style={styles.statLabel}>Dépenses</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>💳</Text>
          <Text style={styles.statValue}>{stats?.activeSubscriptions || 0}</Text>
          <Text style={styles.statLabel}>Abonnements</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>📈</Text>
          <Text style={styles.statValue}>
            {formatCurrency(stats?.totalExpenses || 0, settings.currency, { compact: true })}
          </Text>
          <Text style={styles.statLabel}>Total dépensé</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>⏰</Text>
          <Text style={styles.statValue}>{stats?.accountAge || 0}</Text>
          <Text style={styles.statLabel}>Jours d'utilisation</Text>
        </View>
      </View>
    </View>
  );

  const renderSettingsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>⚙️ Paramètres</Text>
      
      {/* Apparence */}
      <View style={styles.settingsGroup}>
        <Text style={styles.groupTitle}>🎨 Apparence</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Mode sombre</Text>
            <Text style={styles.settingDescription}>
              Interface adaptée à la luminosité ambiante
            </Text>
          </View>
          <Switch
            value={settings.darkMode}
            onValueChange={(value) => dispatch(updateTheme(value))}
            trackColor={{ 
              false: theme.colors.borderLight, 
              true: theme.colors.primary 
            }}
            thumbColor={settings.darkMode ? '#FFFFFF' : theme.colors.textTertiary}
          />
        </View>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Langue</Text>
            <Text style={styles.settingDescription}>
              {LANGUAGES.find(l => l.code === settings.language)?.name || 'Français'}
            </Text>
          </View>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Localisation */}
      <View style={styles.settingsGroup}>
        <Text style={styles.groupTitle}>🌍 Localisation</Text>
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Devise</Text>
            <Text style={styles.settingDescription}>
              {CURRENCIES.find(c => c.code === settings.currency)?.name || 'Euro'} 
              ({CURRENCIES.find(c => c.code === settings.currency)?.symbol || '€'})
            </Text>
          </View>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Notifications */}
      <View style={styles.settingsGroup}>
        <Text style={styles.groupTitle}>🔔 Notifications</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Notifications push</Text>
            <Text style={styles.settingDescription}>
              Rappels et alertes budgétaires
            </Text>
          </View>
          <Switch
            value={settings.notifications}
            onValueChange={(value) => dispatch(updateNotifications(value))}
            trackColor={{ 
              false: theme.colors.borderLight, 
              true: theme.colors.success 
            }}
            thumbColor={settings.notifications ? '#FFFFFF' : theme.colors.textTertiary}
          />
        </View>
      </View>

      {/* Budget */}
      <View style={styles.settingsGroup}>
        <Text style={styles.groupTitle}>💰 Budget</Text>
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Méthode budgétaire</Text>
            <Text style={styles.settingDescription}>
              {BUDGET_METHODS.find(m => m.id === settings.budgetMethod)?.name || 'Non définie'}
            </Text>
          </View>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>

        {budget && (
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Salaire mensuel</Text>
              <Text style={styles.settingDescription}>
                {formatCurrency(budget.salary)}
              </Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderActionsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🔧 Actions</Text>
      
      <View style={styles.actionsGroup}>
        <Button
          title="📊 Exporter mes données"
          onPress={() => Alert.alert('Info', 'Fonctionnalité à venir')}
          variant="secondary"
          theme={theme}
          style={styles.actionButton}
        />
        
        <Button
          title="🔄 Synchroniser"
          onPress={() => Alert.alert('Info', 'Synchronisation en cours...')}
          variant="secondary"
          theme={theme}
          style={styles.actionButton}
        />
        
        <Button
          title="📖 Guide d'utilisation"
          onPress={() => Alert.alert('Info', 'Guide à venir')}
          variant="secondary"
          theme={theme}
          style={styles.actionButton}
        />
        
        <Button
          title="💬 Support & Feedback"
          onPress={() => Alert.alert('Info', 'support@workforit.com')}
          variant="secondary"
          theme={theme}
          style={styles.actionButton}
        />

        <Button
          title="⚠️ Réinitialiser les paramètres"
          onPress={handleResetSettings}
          variant="warning"
          theme={theme}
          style={styles.actionButton}
        />
      </View>
    </View>
  );

  const renderDangerZoneSection = () => (
    <View style={styles.section}>
      <TouchableOpacity 
        style={styles.dangerZoneHeader}
        onPress={() => setShowDangerZone(!showDangerZone)}
      >
        <Text style={styles.dangerZoneTitle}>⚠️ Zone de danger</Text>
        <Text style={styles.dangerZoneArrow}>
          {showDangerZone ? '▼' : '▶'}
        </Text>
      </TouchableOpacity>
      
      {showDangerZone && (
        <View style={styles.dangerZoneContent}>
          <Text style={styles.dangerZoneWarning}>
            ⚠️ Ces actions sont irréversibles. Procédez avec prudence.
          </Text>
          
          <Button
            title="🚪 Se déconnecter"
            onPress={handleLogout}
            variant="secondary"
            theme={theme}
            style={styles.dangerButton}
          />
          
          <Button
            title="🗑️ Supprimer mon compte"
            onPress={handleDeleteAccount}
            variant="danger"
            theme={theme}
            style={styles.dangerButton}
          />
        </View>
      )}
    </View>
  );

  const renderAppInfoSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>ℹ️ À propos</Text>
      
      <View style={styles.appInfoCard}>
        <View style={styles.appInfoHeader}>
          <Text style={styles.appLogo}>💼</Text>
          <View style={styles.appInfoText}>
            <Text style={styles.appName}>WorkForIt</Text>
            <Text style={styles.appVersion}>Version 1.0.0</Text>
          </View>
        </View>
        
        <Text style={styles.appDescription}>
          L'application qui vous aide à visualiser le coût réel de vos dépenses 
          en temps de travail et à optimiser votre budget.
        </Text>
        
        <View style={styles.appLinks}>
          <TouchableOpacity style={styles.appLink}>
            <Text style={styles.appLinkText}>📄 Conditions d'utilisation</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.appLink}>
            <Text style={styles.appLinkText}>🔒 Politique de confidentialité</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.appLink}>
            <Text style={styles.appLinkText}>🌟 Noter l'application</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner 
          fullScreen 
          text="Chargement du profil..." 
          theme={theme} 
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {renderProfileSection()}
        {renderStatsSection()}
        {renderSettingsSection()}
        {renderActionsSection()}
        {renderDangerZoneSection()}
        {renderAppInfoSection()}
        
        {/* Espace en bas pour éviter que le contenu soit coupé */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {settingsLoading && (
        <View style={styles.loadingOverlay}>
          <LoadingSpinner theme={theme} />
        </View>
      )}
    </SafeAreaView>
  );
};

const createProfileStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    
    scrollView: {
      flex: 1,
    },
    
    section: {
      padding: theme.spacing.large,
      paddingBottom: 0,
    },
    
    sectionTitle: {
      fontSize: theme.fontSizes.large,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.large,
    },
    
    profileCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.large,
      padding: theme.spacing.large,
      marginBottom: theme.spacing.large,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.isDark ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    
    profileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    
    avatarContainer: {
      marginRight: theme.spacing.medium,
    },
    
    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
    },
    
    avatarPlaceholder: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    avatarText: {
      fontSize: theme.fontSizes.large,
      fontWeight: theme.fontWeights.bold,
      color: '#FFFFFF',
    },
    
    profileInfo: {
      flex: 1,
    },
    
    userName: {
      fontSize: theme.fontSizes.large,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.text,
    },
    
    userEmail: {
      fontSize: theme.fontSizes.regular,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.tiny,
    },
    
    memberSince: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.textTertiary,
      marginTop: theme.spacing.tiny,
    },
    
    editButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    editButtonText: {
      fontSize: theme.fontSizes.medium,
    },
    
    editForm: {
      marginTop: theme.spacing.large,
      paddingTop: theme.spacing.large,
      borderTopWidth: 1,
      borderTopColor: theme.colors.borderLight,
    },
    
    editActions: {
      flexDirection: 'row',
      gap: theme.spacing.medium,
      marginTop: theme.spacing.medium,
    },
    
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.medium,
      marginBottom: theme.spacing.large,
    },
    
    statCard: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.medium,
      alignItems: 'center',
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    
    statIcon: {
      fontSize: 32,
      marginBottom: theme.spacing.small,
    },
    
    statValue: {
      fontSize: theme.fontSizes.large,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.text,
    },
    
    statLabel: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: theme.spacing.tiny,
    },
    
    settingsGroup: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.medium,
      marginBottom: theme.spacing.medium,
      overflow: 'hidden',
    },
    
    groupTitle: {
      fontSize: theme.fontSizes.medium,
      fontWeight: theme.fontWeights.semibold,
      color: theme.colors.text,
      padding: theme.spacing.medium,
      backgroundColor: theme.colors.borderLight,
    },
    
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.medium,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight,
    },
    
    settingInfo: {
      flex: 1,
    },
    
    settingLabel: {
      fontSize: theme.fontSizes.regular,
      fontWeight: theme.fontWeights.medium,
      color: theme.colors.text,
    },
    
    settingDescription: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.tiny,
    },
    
    settingArrow: {
      fontSize: theme.fontSizes.large,
      color: theme.colors.textTertiary,
    },
    
    actionsGroup: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.medium,
      gap: theme.spacing.medium,
      marginBottom: theme.spacing.large,
    },
    
    actionButton: {
      justifyContent: 'flex-start',
    },
    
    dangerZoneHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.dangerLight,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.medium,
      borderWidth: 1,
      borderColor: theme.colors.danger,
    },
    
    dangerZoneTitle: {
      fontSize: theme.fontSizes.regular,
      fontWeight: theme.fontWeights.semibold,
      color: theme.colors.danger,
    },
    
    dangerZoneArrow: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.danger,
    },
    
    dangerZoneContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.medium,
      marginTop: theme.spacing.small,
      borderWidth: 1,
      borderColor: theme.colors.danger,
    },
    
    dangerZoneWarning: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.danger,
      textAlign: 'center',
      marginBottom: theme.spacing.medium,
      lineHeight: theme.fontSizes.regular,
    },
    
    dangerButton: {
      marginBottom: theme.spacing.small,
    },
    
    appInfoCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.large,
      marginBottom: theme.spacing.large,
    },
    
    appInfoHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.medium,
    },
    
    appLogo: {
      fontSize: 40,
      marginRight: theme.spacing.medium,
    },
    
    appInfoText: {
      flex: 1,
    },
    
    appName: {
      fontSize: theme.fontSizes.large,
      fontWeight: theme.fontWeights.bold,
      color: theme.colors.text,
    },
    
    appVersion: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.tiny,
    },
    
    appDescription: {
      fontSize: theme.fontSizes.regular,
      color: theme.colors.textSecondary,
      lineHeight: theme.fontSizes.large,
      marginBottom: theme.spacing.medium,
    },
    
    appLinks: {
      gap: theme.spacing.small,
    },
    
    appLink: {
      paddingVertical: theme.spacing.small,
    },
    
    appLinkText: {
      fontSize: theme.fontSizes.regular,
      color: theme.colors.primary,
    },
    
    bottomSpacer: {
      height: theme.spacing.huge,
    },
    
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.overlay,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });