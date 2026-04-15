import type { PropsWithChildren } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';
import { palette } from '@/constants/theme';

type ScreenProps = PropsWithChildren<{
  backgroundColor?: string;
  padded?: boolean;
}>;

export function Screen({
  children,
  backgroundColor = palette.background,
  padded = true,
}: ScreenProps) {
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <View style={[styles.content, padded && styles.padded]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: 20,
  },
});
