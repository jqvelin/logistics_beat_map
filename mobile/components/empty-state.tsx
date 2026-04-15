import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette, radii } from '@/constants/theme';

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onPress?: () => void;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onPress,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onPress ? (
        <Pressable style={styles.button} onPress={onPress}>
          <Text style={styles.buttonLabel}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  title: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  button: {
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: radii.pill,
    backgroundColor: palette.purple,
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
