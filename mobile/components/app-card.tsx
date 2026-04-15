import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { palette, radii, shadows } from '@/constants/theme';

export function AppCard({ children }: PropsWithChildren) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    padding: 18,
    ...shadows.card,
  },
});
