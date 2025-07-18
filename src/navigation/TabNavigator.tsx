// src/navigation/TabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { HomeScreen } from '../screens/main/HomeScreen';
import { ExpensesScreen } from '../screens/main/ExpensesScreen';
import { SubscriptionsScreen } from '../screens/main/SubscriptionsScreen';
import { AnalyticsScreen } from '../screens/main/AnalyticsScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { Theme } from '../styles/theme';

export type TabParamList = {
  Home: undefined;
  Expenses: undefined;
  Subscriptions: undefined;
  Analytics: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

interface TabNavigatorProps {
  theme: Theme;
}

interface TabBarIconProps {
  icon: string;
  label: string;
  focused: boolean;
  theme: Theme;
}

const TabBarIcon: React.FC<TabBarIconProps> = ({ icon, label, focused, theme }) => {
  const styles = createTabIconStyles(theme);
  
  return (
    <View style={styles.container}>
      <Text style={[styles.icon, focused && styles.iconFocused]}>
        {icon}
      </Text>
      <Text style={[styles.label, focused && styles.labelFocused]}>
        {label}
      </Text>
      {focused && <View style={styles.indicator} />}
    </View>
  );
};

const createTabIconStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.small,
      minHeight: 50,
    },
    icon: {
      fontSize: 20,
      marginBottom: 2,
      opacity: 0.6,
    },
    iconFocused: {
      opacity: 1,
    },
    label: {
      fontSize: 10,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    labelFocused: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    indicator: {
      position: 'absolute',
      bottom: 0,
      width: 4,
      height: 4,
      backgroundColor: theme.colors.primary,
      borderRadius: 2,
    },
  });

export const TabNavigator: React.FC<TabNavigatorProps> = ({ theme }) => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 20,
          paddingTop: 8,
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
      }}
    >
      <Tab.Screen
        name="Home"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              icon="🏠"
              label="Accueil"
              focused={focused}
              theme={theme}
            />
          ),
        }}
      >
        {() => <HomeScreen theme={theme} />}
      </Tab.Screen>

      <Tab.Screen
        name="Expenses"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              icon="💸"
              label="Dépenses"
              focused={focused}
              theme={theme}
            />
          ),
        }}
      >
        {() => <ExpensesScreen theme={theme} />}
      </Tab.Screen>

      <Tab.Screen
        name="Subscriptions"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              icon="💳"
              label="Abonnements"
              focused={focused}
              theme={theme}
            />
          ),
        }}
      >
        {() => <SubscriptionsScreen theme={theme} />}
      </Tab.Screen>

      <Tab.Screen
        name="Analytics"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              icon="📊"
              label="Analyses"
              focused={focused}
              theme={theme}
            />
          ),
        }}
      >
        {() => <AnalyticsScreen theme={theme} />}
      </Tab.Screen>

      <Tab.Screen
        name="Profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              icon="👤"
              label="Profil"
              focused={focused}
              theme={theme}
            />
          ),
        }}
      >
        {() => <ProfileScreen theme={theme} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};