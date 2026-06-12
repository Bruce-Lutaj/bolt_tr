import React from 'react';
import { TextInput as RNTextInput, View, Text, StyleSheet, type TextInputProps } from 'react-native';
import { colors, radius, spacing, fontSize } from '../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string | null;
}

export function Input({ label, error, style, ...props }: InputProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <RNTextInput
        placeholderTextColor={colors.textMuted}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  label: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.xs, fontWeight: '500' },
  input: {
    height: 52, backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.surfaceBorder,
    paddingHorizontal: spacing.lg, fontSize: fontSize.base, color: colors.text,
  },
  inputError: { borderColor: colors.danger },
  error: { fontSize: fontSize.xs, color: colors.danger, marginTop: spacing.xs },
});
