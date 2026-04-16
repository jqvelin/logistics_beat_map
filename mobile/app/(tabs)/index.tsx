import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
import { buildHomeModules } from '@/lib/progress';
import type { CourseSummary, ProgressResponse } from '@/lib/types';

export default function HomeScreen() {
  const { token, user, refreshUser } = useAuth();
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [careerTab, setCareerTab] = useState<'career' | 'competition'>('career');

  const load = useCallback(async () => {
    if (!token) {
      return;
    }

    const [coursesResponse, progressResponse] = await Promise.all([
      api.getCourses(),
      api.getProgress(token),
      refreshUser(),
    ]);

    setCourses(coursesResponse);
    setProgress(progressResponse);
    setLoaded(true);
  }, [refreshUser, token]);

  useEffect(() => {
    if (!loaded) {
      void load();
    }
  }, [load, loaded]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const homeModules = useMemo(() => buildHomeModules(courses, progress), [courses, progress]);
  const totalLessons = progress?.overview.totalLessons ?? 0;
  const completedLessons = progress?.overview.completedLessons ?? 0;
  const lessonsProgressRatio = totalLessons > 0 ? completedLessons / totalLessons : 0;
  const tasksToday = progress?.tasksCompletedToday ?? 0;
  const xpToday = progress?.xpGainedToday ?? 0;
  const completedModules = progress?.overview.completedModules ?? 0;
  const totalModules = progress?.overview.totalModules ?? 0;
  const completedCourses = progress?.overview.completedCourses ?? 0;
  const totalCourses = progress?.overview.totalCourses ?? 0;
  const courseCompletionPct =
    totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;
  const careerStepIndex = getCareerStepIndexFromCourses(completedCourses, totalCourses);
  const careerMilestone = LOGISTICS_MANAGER_CAREER_MILESTONES[careerStepIndex];

  if (!loaded && !refreshing) {
    return <LoadingScreen omitBottomSafeArea />;
  }

  return (
    <Screen backgroundColor={palette.background} padded={false} omitBottomSafeArea>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={palette.purple}
          />
        }>
        <LinearGradient colors={gradients.header} style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>🚚</Text>
            </View>
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 {user?.streak ?? 0}</Text>
            </View>
          </View>

          <LinearGradient colors={gradients.dailyGoal} style={styles.goalCard}>
            <View style={styles.goalRow}>
              <Text style={styles.goalTitle}>Дневная цель</Text>
              <Text style={styles.goalValue}>
                {tasksToday}/{Math.max(tasksToday, 5)} заданий
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.max((tasksToday / 5) * 100, 8)}%` },
                ]}
              />
            </View>
            <View style={styles.goalFooter}>
              <Text style={styles.goalMeta}>
                {Math.round(Math.min(tasksToday / 5, 1) * 100)}% выполнено
              </Text>
              <Text style={styles.goalMeta}>+{xpToday} опыта за сегодня</Text>
            </View>
          </LinearGradient>
        </LinearGradient>

        <View style={styles.body}>
          <View style={styles.segment}>
            <Pressable
              style={[styles.segmentButton, careerTab === 'career' && styles.segmentButtonActive]}
              onPress={() => setCareerTab('career')}>
              <Text
                style={[
                  styles.segmentText,
                  careerTab === 'career' && styles.segmentTextActive,
                ]}>
                Карьера
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.segmentButton,
                careerTab === 'competition' && styles.segmentButtonActive,
              ]}
              onPress={() => setCareerTab('competition')}>
              <Text
                style={[
                  styles.segmentText,
                  careerTab === 'competition' && styles.segmentTextActive,
                ]}>
                Соревнование
              </Text>
            </Pressable>
          </View>

          {careerTab === 'competition' ? (
            <AppCard>
              <Text style={styles.sectionTitle}>Рейтинг появится позже</Text>
              <Text style={styles.cardDescription}>
                Сначала завершим учебный контур и прогресс, затем добавим соревнование между студентами.
              </Text>
            </AppCard>
          ) : (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Ваш путь обучения</Text>
              </View>

              <View style={styles.moduleList}>
                {homeModules.map((module) => {
                  const iconBackground =
                    module.status === 'completed'
                      ? palette.green
                      : module.status === 'active'
                        ? palette.purple
                        : '#D8DDE7';
                  const iconText =
                    module.status === 'completed'
                      ? '✓'
                      : module.status === 'active'
                        ? '▶'
                        : '🔒';

                  return (
                    <Pressable
                      key={module.moduleId}
                      style={styles.moduleRow}
                      onPress={() => router.push('/(tabs)/courses')}>
                      <View style={[styles.moduleIcon, { backgroundColor: iconBackground }]}>
                        <Text style={styles.moduleIconText}>{iconText}</Text>
                      </View>
                      <View style={styles.moduleBody}>
                        <Text
                          style={[
                            styles.moduleTitle,
                            module.status === 'locked' && styles.moduleTitleLocked,
                          ]}>
                          {module.title}
                        </Text>
                        <Text style={styles.moduleSubtitle}>{module.subtitle}</Text>
                        {module.status !== 'locked' ? (
                          <View style={styles.inlineTrack}>
                            <View
                              style={[
                                styles.inlineFill,
                                { width: `${Math.max(module.completionRatio * 100, 10)}%` },
                              ]}
                            />
                          </View>
                        ) : null}
                      </View>
                      <Text
                        style={[
                          styles.modulePercent,
                          module.status === 'completed'
                            ? styles.modulePercentComplete
                            : module.status === 'locked'
                              ? styles.modulePercentLocked
                              : null,
                        ]}>
                        {module.percentLabel}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable onPress={() => router.push('/practice')}>
                <LinearGradient colors={gradients.practice} style={styles.practiceCard}>
                  <View style={styles.practiceHeader}>
                    <Text style={styles.practiceTitle}>Быстрая практика</Text>
                    <Text style={styles.practiceIcon}>⟳</Text>
                  </View>
                  <Text style={styles.practiceSubtitle}>Повторите изученный материал</Text>
                  <View style={styles.practiceButton}>
                    <Text style={styles.practiceButtonText}>Начать</Text>
                  </View>
                </LinearGradient>
              </Pressable>

              <Pressable onPress={() => router.push('/career-path')} style={styles.careerPressable}>
                <AppCard>
                  <View style={styles.careerHeader}>
                    <Text style={styles.sectionTitle}>Карьерный путь</Text>
                    <Text style={styles.linkText}>Подробнее</Text>
                  </View>
                  <View style={styles.careerCard}>
                    <View style={styles.careerBadge}>
                      <Text style={styles.careerBadgeText}>{careerMilestone?.emoji ?? '👤'}</Text>
                    </View>
                    <Text style={styles.careerRole}>{careerMilestone?.title ?? 'Профессия логиста'}</Text>
                    <Text style={styles.careerLabel}>
                      Текущий этап примерного пути (по курсам: {courseCompletionPct}%)
                    </Text>
                    <Text style={styles.careerProgress}>
                      Курсы: {completedCourses}/{Math.max(totalCourses, 1)} · модули:{' '}
                      {completedModules}/{Math.max(totalModules, 1)}
                    </Text>
                  </View>
                </AppCard>
              </Pressable>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Недавние достижения</Text>
              </View>

              <AppCard>
                <View style={styles.achievementRow}>
                  <View style={[styles.achievementIcon, { backgroundColor: palette.yellowSoft }]}>
                    <Text style={styles.achievementEmoji}>🏅</Text>
                  </View>
                  <View style={styles.achievementBody}>
                    <Text style={styles.achievementTitle}>Первая пройденная неделя!</Text>
                    <Text style={styles.achievementDescription}>
                      Выполняйте задания 7 дней подряд
                    </Text>
                  </View>
                </View>
              </AppCard>

              <AppCard>
                <View style={styles.achievementRow}>
                  <View style={[styles.achievementIcon, { backgroundColor: palette.greenSoft }]}>
                    <Text style={styles.achievementEmoji}>⭐</Text>
                  </View>
                  <View style={styles.achievementBody}>
                    <Text style={styles.achievementTitle}>Идеальный результат</Text>
                    <Text style={styles.achievementDescription}>
                      {completedLessons > 0
                        ? 'Вы уже закрыли один из уроков без пропусков'
                        : 'Соберите первый полный урок без ошибок'}
                    </Text>
                  </View>
                </View>
              </AppCard>
            </>
          )}

          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>
              Общий прогресс курса: {Math.round(lessonsProgressRatio * 100)}%
            </Text>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 36,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: spacing.lg,
    paddingBottom: 22,
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: {
    fontSize: 22,
  },
  streakBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
  },
  streakText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  goalCard: {
    borderRadius: radii.lg,
    padding: 18,
    gap: 14,
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 20,
  },
  goalValue: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 22,
  },
  progressTrack: {
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.28)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: '#FFFFFF',
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalMeta: {
    color: '#E9F7FF',
    fontSize: 14,
    fontWeight: '600',
  },
  body: {
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#F1F2F6',
    borderRadius: radii.md,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  segmentText: {
    color: palette.textMuted,
    fontSize: 15,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: palette.purple,
  },
  sectionHeader: {
    marginTop: 8,
  },
  sectionTitle: {
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
  moduleList: {
    gap: 14,
  },
  moduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  moduleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleIconText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  moduleBody: {
    flex: 1,
    gap: 4,
  },
  moduleTitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '700',
  },
  moduleTitleLocked: {
    color: palette.textSoft,
  },
  moduleSubtitle: {
    color: palette.textMuted,
    fontSize: 14,
  },
  inlineTrack: {
    height: 6,
    borderRadius: radii.pill,
    backgroundColor: '#E8ECF4',
    overflow: 'hidden',
    marginTop: 4,
  },
  inlineFill: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: palette.purple,
  },
  modulePercent: {
    color: palette.purple,
    fontSize: 16,
    fontWeight: '800',
  },
  modulePercentComplete: {
    color: palette.green,
  },
  modulePercentLocked: {
    color: palette.textSoft,
  },
  practiceCard: {
    borderRadius: radii.lg,
    padding: 20,
    gap: 8,
  },
  practiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  practiceTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  practiceIcon: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  practiceSubtitle: {
    color: '#FFF1F7',
    fontSize: 16,
    fontWeight: '600',
  },
  practiceButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.md,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  practiceButtonText: {
    color: palette.orange,
    fontSize: 16,
    fontWeight: '800',
  },
  careerPressable: {
    borderRadius: 22,
  },
  careerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  linkText: {
    color: palette.purple,
    fontSize: 15,
    fontWeight: '700',
  },
  careerCard: {
    backgroundColor: '#EEF4FF',
    borderRadius: radii.lg,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  careerBadge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: palette.purple,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  careerBadgeText: {
    fontSize: 26,
    color: '#FFFFFF',
  },
  careerRole: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  careerLabel: {
    color: palette.textMuted,
    fontSize: 15,
  },
  careerProgress: {
    color: palette.purple,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 6,
  },
  achievementRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  achievementIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementEmoji: {
    fontSize: 24,
  },
  achievementBody: {
    flex: 1,
    gap: 4,
  },
  achievementTitle: {
    color: palette.text,
    fontSize: 17,
    fontWeight: '700',
  },
  achievementDescription: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  summaryRow: {
    paddingVertical: 8,
  },
  summaryText: {
    color: palette.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
});
