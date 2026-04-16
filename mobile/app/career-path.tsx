import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { AppCard } from '@/components/app-card';
import { LoadingScreen } from '@/components/loading-screen';
import { Screen } from '@/components/screen';
import { gradients, palette, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import {
  LOGISTICS_MANAGER_CAREER_MILESTONES,
  getCareerStepIndexFromCourses,
} from '@/lib/career-path';
import type { ProgressResponse } from '@/lib/types';

export default function CareerPathScreen() {
  const { token } = useAuth();
  const [progress, setProgress] = useState<ProgressResponse | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      return;
    }
    const progressResponse = await api.getProgress(token);
    setProgress(progressResponse);
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!progress) {
    return <LoadingScreen label="Загружаем прогресс..." />;
  }

  const { overview } = progress;
  const { completedCourses, totalCourses } = overview;
  const coursePct =
    totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;
  const currentIndex = getCareerStepIndexFromCourses(completedCourses, totalCourses);
  const milestones = LOGISTICS_MANAGER_CAREER_MILESTONES;

  return (
    <Screen backgroundColor={palette.background} padded={false}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <LinearGradient colors={gradients.header} style={styles.hero}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.back}>‹ Назад</Text>
          </Pressable>
          <Text style={styles.heroTitle}>Карьерный путь</Text>
          <Text style={styles.heroSubtitle}>
            Пример траектории развития для роли менеджера по логистике в российских компаниях — от
            операций до стратегического управления цепочкой поставок.
          </Text>
        </LinearGradient>

        <View style={styles.body}>
          <AppCard>
            <Text style={styles.cardLabel}>Ваш прогресс по курсам</Text>
            <Text style={styles.cardValue}>
              {completedCourses}/{Math.max(totalCourses, 1)} курсов завершено ({coursePct}%)
            </Text>
            <Text style={styles.cardHint}>
              Текущий этап пути ниже привязан к доле пройденных курсов в приложении — чем больше
              курсов закрыто, тем дальше по примерной карьерной лестнице вы продвигаетесь.
            </Text>
          </AppCard>

          <Text style={styles.sectionTitle}>Этапы пути</Text>

          <View style={styles.timeline}>
            {milestones.map((milestone, index) => {
              const isPast = index < currentIndex;
              const isCurrent = index === currentIndex;
              const isFuture = index > currentIndex;
              const isLast = index === milestones.length - 1;

              return (
                <View key={milestone.title} style={styles.stepRow}>
                  <View style={styles.rail}>
                    <View
                      style={[
                        styles.railDot,
                        isPast && styles.railDotDone,
                        isCurrent && styles.railDotCurrent,
                        isFuture && styles.railDotFuture,
                      ]}>
                      <Text style={styles.railDotEmoji}>{milestone.emoji}</Text>
                    </View>
                    {!isLast ? (
                      <View
                        style={[
                          styles.railLine,
                          index < currentIndex ? styles.railLineDone : styles.railLineFuture,
                        ]}
                      />
                    ) : null}
                  </View>

                  <View
                    style={[
                      styles.stepCard,
                      isCurrent && styles.stepCardCurrent,
                      isFuture && styles.stepCardFuture,
                    ]}>
                    <View style={styles.stepHeader}>
                      <Text
                        style={[
                          styles.stepTitle,
                          isFuture && styles.stepTitleMuted,
                        ]}>
                        {milestone.title}
                      </Text>
                      {isCurrent ? (
                        <View style={styles.badgeCurrent}>
                          <Text style={styles.badgeCurrentText}>Ваш этап</Text>
                        </View>
                      ) : null}
                      {isPast ? (
                        <View style={styles.badgePast}>
                          <Text style={styles.badgePastText}>Этап пройден</Text>
                        </View>
                      ) : null}
                      {isFuture ? (
                        <View style={styles.badgeFuture}>
                          <Text style={styles.badgeFutureText}>Впереди</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={[styles.stepSummary, isFuture && styles.stepSummaryMuted]}>
                      {milestone.summary}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          <Text style={styles.footerNote}>
            Это учебная иллюстрация: реальные должности и грейды зависят от отрасли, региона и
            компании.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 36,
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
    marginBottom: 4,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 18,
    gap: 16,
  },
  cardLabel: {
    color: palette.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  cardValue: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 6,
  },
  cardHint: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
    fontWeight: '500',
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  timeline: {
    gap: 0,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 14,
  },
  rail: {
    width: 44,
    alignItems: 'center',
    alignSelf: 'stretch',
    flexDirection: 'column',
  },
  railDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceMuted,
    borderWidth: 2,
    borderColor: palette.border,
  },
  railDotDone: {
    backgroundColor: palette.greenSoft,
    borderColor: palette.green,
  },
  railDotCurrent: {
    backgroundColor: '#EDE9FF',
    borderColor: palette.purple,
  },
  railDotFuture: {
    backgroundColor: palette.surfaceMuted,
    borderColor: palette.border,
    opacity: 0.85,
  },
  railDotEmoji: {
    fontSize: 20,
  },
  railLine: {
    width: 3,
    flex: 1,
    minHeight: 16,
    marginTop: 4,
    borderRadius: 2,
  },
  railLineDone: {
    backgroundColor: palette.green,
  },
  railLineFuture: {
    backgroundColor: palette.border,
  },
  stepCard: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  stepCardCurrent: {
    borderColor: palette.purple,
    backgroundColor: '#F7F5FF',
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.9,
    shadowRadius: 16,
    elevation: 3,
  },
  stepCardFuture: {
    opacity: 0.92,
  },
  stepHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  stepTitle: {
    flexShrink: 1,
    color: palette.text,
    fontSize: 17,
    fontWeight: '800',
  },
  stepTitleMuted: {
    color: palette.textSoft,
  },
  badgeCurrent: {
    backgroundColor: palette.purple,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  badgeCurrentText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  badgePast: {
    backgroundColor: palette.greenSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  badgePastText: {
    color: palette.green,
    fontSize: 12,
    fontWeight: '700',
  },
  badgeFuture: {
    backgroundColor: palette.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  badgeFutureText: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  stepSummary: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  stepSummaryMuted: {
    color: palette.textSoft,
  },
  footerNote: {
    color: palette.textSoft,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 8,
  },
});
