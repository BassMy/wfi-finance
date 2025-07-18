// src/components/common/LoadingSpinner.tsx
import React from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
} from 'react-native';
import { Theme, lightTheme } from '../../styles/theme';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  fullScreen?: boolean;
  theme?: Theme;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color,
  text,
  fullScreen = false,
  theme = lightTheme,
}) => {
  const styles = createLoadingStyles(theme);
  const spinnerColor = color || theme.colors.primary;

  if (fullScreen) {
    return (
      <View style={styles.fullScreenContainer}>
        <View style={styles.content}>
          <ActivityIndicator size={size} color={spinnerColor} />
          {text && (
            <Text style={styles.text}>{text}</Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={spinnerColor} />
      {text && (
        <Text style={styles.text}>{text}</Text>
      )}
    </View>
  );
};

const createLoadingStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.large,
    },
    
    fullScreenContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.overlay,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    
    content: {
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.xlarge,
      borderRadius: theme.borderRadius.large,
      alignItems: 'center',
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 8,
    },
    
    text: {
      marginTop: theme.spacing.medium,
      fontSize: theme.fontSizes.regular,
      color: theme.colors.text,
      textAlign: 'center',
    },
  });