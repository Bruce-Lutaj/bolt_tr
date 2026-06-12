import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, fontSize, spacing } from '../theme';

export function LoadingScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  empty: { alignItems: 'center', paddingVertical: spacing.xxxl },
  emptyText: { fontSize: fontSize.sm, color: colors.textMuted },
  errorContainer: { backgroundColor: colors.dangerMuted, borderRadius: 8, padding: spacing.md, marginBottom: spacing.lg },
  errorText: { fontSize: fontSize.sm, color: colors.danger },
});
