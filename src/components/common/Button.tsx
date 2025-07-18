// src/components/common/Button.tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Theme, lightTheme } from '../../styles/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: string;
  theme?: Theme;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  theme = lightTheme,
  style,
  textStyle,
}) => {
  const styles = createButtonStyles(theme);

  const getVariantStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondary;
      case 'success':
        return styles.success;
      case 'warning':
        return styles.warning;
      case 'danger':
        return styles.danger;
      default:
        return styles.primary;
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return styles.small;
      case 'large':
        return styles.large;
      default:
        return styles.medium;
    }
  };

  const getTextVariantStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryText;
      default:
        return styles.primaryText;
    }
  };

  const getSizeTextStyle = () => {
    switch (size) {
      case 'small':
        return styles.smallText;
      case 'large':
        return styles.largeText;
      default:
        return styles.mediumText;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.base,
        getVariantStyle(),
        getSizeStyle(),
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'secondary' ? theme.colors.primary : '#FFFFFF'}
          size="small"
        />
      ) : (
        <>
          {icon && (
            <Text style={[styles.icon, getSizeTextStyle()]}>{icon}</Text>
          )}
          <Text
            style={[
              styles.text,
              getTextVariantStyle(),
              getSizeTextStyle(),
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const createButtonStyles = (theme: Theme) =>
  StyleSheet.create({
    base: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.borderRadius.medium,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    
    // Variants
    primary: {
      backgroundColor: theme.colors.primary,
    },
    secondary: {
      backgroundColor: 'transparent',
      borderColor: theme.colors.primary,
    },
    success: {
      backgroundColor: theme.colors.success,
    },
    warning: {
      backgroundColor: theme.colors.warning,
    },
    danger: {
      backgroundColor: theme.colors.danger,
    },
    
    // Sizes
    small: {
      paddingVertical: theme.spacing.small,
      paddingHorizontal: theme.spacing.medium,
      minHeight: 36,
    },
    medium: {
      paddingVertical: theme.spacing.medium,
      paddingHorizontal: theme.spacing.large,
      minHeight: 44,
    },
    large: {
      paddingVertical: theme.spacing.large,
      paddingHorizontal: theme.spacing.xlarge,
      minHeight: 52,
    },
    
    // States
    disabled: {
      opacity: 0.5,
    },
    fullWidth: {
      width: '100%',
    },
    
    // Text styles
    text: {
      fontWeight: theme.fontWeights.semibold,
      textAlign: 'center',
    },
    primaryText: {
      color: '#FFFFFF',
    },
    secondaryText: {
      color: theme.colors.primary,
    },
    
    smallText: {
      fontSize: theme.fontSizes.small,
    },
    mediumText: {
      fontSize: theme.fontSizes.regular,
    },
    largeText: {
      fontSize: theme.fontSizes.large,
    },
    
    icon: {
      marginRight: theme.spacing.small,
    },
  });