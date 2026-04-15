import { StyleSheet, Text } from 'react-native';
import { AppCard } from '@/components/app-card';
import { Screen } from '@/components/screen';
import { palette } from '@/constants/theme';

export default function CommunityScreen() {
  return (
    <Screen backgroundColor={palette.background}>
      <Text style={styles.title}>Сообщество</Text>
      <Text style={styles.subtitle}>
        Здесь позже появятся клубы, общий рейтинг и обсуждение практических кейсов.
      </Text>

      <AppCard>
        <Text style={styles.cardTitle}>Скоро в приложении</Text>
        <Text style={styles.cardDescription}>
          Пока что основной упор сделан на обучение, уроки и персональный прогресс.
        </Text>
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: palette.text,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  cardTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '800',
  },
  cardDescription: {
    marginTop: 8,
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});
