import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/screen';
import { palette } from '@/constants/theme';

type LoadingScreenProps = {
  label?: string;
  omitBottomSafeArea?: boolean;
};

export function LoadingScreen({
  label = 'Загружаем учебный маршрут...',
  omitBottomSafeArea,
}: LoadingScreenProps) {
  return (
    <Screen omitBottomSafeArea={omitBottomSafeArea}>
      <View style={styles.container}>
        <ActivityIndicator size="large" color={palette.purple} />
        <Text style={styles.label}>{label}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  label: {
    color: palette.textMuted,
    fontSize: 15,
    textAlign: 'center',
  },
});
