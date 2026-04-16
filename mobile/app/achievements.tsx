import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { LoadingScreen } from '@/components/loading-screen';
import { Screen } from '@/components/screen';
import { gradients, palette, radii, shadows, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import type { AchievementDefinition } from '@/lib/types';

export default function AchievementsScreen() {
  const { token } = useAuth();
  const [achievements, setAchievements] = useState<AchievementDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) {
      return;
    }
    setLoading(true);
    try {
      const rows = await api.getAchievements(token);
      setAchievements(rows);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const ordered = useMemo(() => {
    const unlocked = achievements
      .filter((a) => a.unlocked)
      .sort((a, b) => (b.unlockedAt ?? '').localeCompare(a.unlockedAt ?? ''));
    const locked = achievements.filter((a) => !a.unlocked);
    return [...unlocked, ...locked];
  }, [achievements]);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  if (loading) {
    return <LoadingScreen label="Загружаем достижения..." />;
  }

  return (
    <Screen backgroundColor={palette.background} padded={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <LinearGradient colors={gradients.header} style={styles.hero}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.back}>‹ Назад</Text>
          </Pressable>
          <Text style={styles.heroTitle}>Достижения</Text>
          <Text style={styles.heroSubtitle}>
            Получено: {unlockedCount} из {Math.max(achievements.length, 1)} · разблокированные
            показаны сверху
          </Text>
        </LinearGradient>

        <View style={styles.body}>
          {ordered.map((item) => {
            const isUnlocked = item.unlocked;
            return (
              <View
                key={item.id}
                style={[
                  styles.card,
                  isUnlocked ? styles.cardUnlocked : styles.cardLocked,
                ]}>
                <View style={styles.row}>
                  <View
                    style={[
                      styles.icon,
                      isUnlocked ? styles.iconUnlocked : styles.iconLocked,
                    ]}>
                    <Text style={[styles.emoji, !isUnlocked && styles.emojiMuted]}>
                      {isUnlocked ? item.emoji : '🔒'}
                    </Text>
                  </View>
                  <View style={styles.textCol}>
                    <Text style={[styles.title, !isUnlocked && styles.titleMuted]}>
                      {item.title}
                      {isUnlocked ? '' : ' — заблокировано'}
                    </Text>
                    <Text style={styles.description}>{item.description}</Text>
                    {isUnlocked && item.unlockedAt ? (
                      <Text style={styles.dateMeta}>
                        Открыто:{' '}
                        {new Date(item.unlockedAt).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xl,
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: spacing.md,
    paddingBottom: 22,
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
    gap: 10,
  },
  back: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: '#E9F7FF',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 18,
    gap: 12,
  },
  card: {
    borderRadius: radii.lg,
    padding: 18,
    ...shadows.card,
    backgroundColor: palette.surface,
  },
  cardUnlocked: {
    borderWidth: 2,
    borderColor: palette.purple,
    backgroundColor: '#FAF8FF',
  },
  cardLocked: {
    opacity: 0.78,
  },
  row: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  icon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconUnlocked: {
    backgroundColor: palette.yellowSoft,
  },
  iconLocked: {
    backgroundColor: '#E8ECF4',
  },
  emoji: {
    fontSize: 24,
  },
  emojiMuted: {
    opacity: 0.85,
  },
  textCol: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: palette.text,
    fontSize: 17,
    fontWeight: '800',
  },
  titleMuted: {
    color: palette.textSoft,
    fontWeight: '700',
  },
  description: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  dateMeta: {
    marginTop: 4,
    color: palette.purple,
    fontSize: 13,
    fontWeight: '600',
  },
});
