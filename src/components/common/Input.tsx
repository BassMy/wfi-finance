// src/components/common/Input.tsx
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { Theme, lightTheme } from '../../styles/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  theme?: Theme;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  theme = lightTheme,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const styles = createInputStyles(theme);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const renderRightIcon = () => {
    if (!rightIcon) return null;

    if (onRightIconPress) {
      return (
        <TouchableOpacity
          onPress={onRightIconPress}
          style={styles.rightIconButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.rightIcon}>{rightIcon}</Text>
        </TouchableOpacity>
      );
    }

    return (
      <Text style={styles.rightIcon}>{rightIcon}</Text>
    );
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, error && styles.labelError]}>
          {label}
        </Text>
      )}
      
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
        ]}
      >
        {leftIcon && (
          <Text style={styles.leftIcon}>{leftIcon}</Text>
        )}
        
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={theme.colors.textTertiary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        
        {renderRightIcon()}
      </View>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      
      {helperText && !error && (
        <Text style={styles.helperText}>{helperText}</Text>
      )}
    </View>
  );
};

const createInputStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      marginBottom: theme.spacing.regular,
    },
    
    label: {
      fontSize: theme.fontSizes.medium,
      fontWeight: theme.fontWeights.medium,
      color: theme.colors.text,
      marginBottom: theme.spacing.small,
    },
    
    labelError: {
      color: theme.colors.danger,
    },
    
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.medium,
      backgroundColor: theme.colors.surface,
      minHeight: 44,
    },
    
    inputContainerFocused: {
      borderColor: theme.colors.primary,
      borderWidth: 2,
    },
    
    inputContainerError: {
      borderColor: theme.colors.danger,
    },
    
    input: {
      flex: 1,
      paddingHorizontal: theme.spacing.medium,
      paddingVertical: theme.spacing.medium,
      fontSize: theme.fontSizes.regular,
      color: theme.colors.text,
    },
    
    leftIcon: {
      paddingLeft: theme.spacing.medium,
      fontSize: theme.fontSizes.large,
      color: theme.colors.textSecondary,
    },
    
    rightIcon: {
      fontSize: theme.fontSizes.large,
      color: theme.colors.textSecondary,
    },
    
    rightIconButton: {
      paddingHorizontal: theme.spacing.medium,
      paddingVertical: theme.spacing.small,
      justifyContent: 'center',
      alignItems: 'center',
    },
    
    errorText: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.danger,
      marginTop: theme.spacing.tiny,
    },
    
    helperText: {
      fontSize: theme.fontSizes.small,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.tiny,
    },
  });