import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet, type ViewStyle } from 'react-native';
import { colors, radius, spacing, fontSize } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export function Button({ title, onPress, variant = 'primary', disabled, loading, style }: ButtonProps) {
  const bg = variant === 'primary' ? colors.primary
    : variant === 'secondary' ? colors.surface
    : variant === 'danger' ? colors.danger
    : colors.transparent;
  const textColor = variant === 'ghost' ? colors.primaryText : colors.white;
  const borderColor = variant === 'secondary' ? colors.surfaceBorder : variant === 'ghost' ? colors.transparent : bg;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, borderColor, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
  },
  text: { fontSize: fontSize.base, fontWeight: '600' },
});
