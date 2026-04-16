import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { AppCard } from '@/components/app-card';
import { BottomConfetti } from '@/components/bottom-confetti';
import { EmptyState } from '@/components/empty-state';
import { LoadingScreen } from '@/components/loading-screen';
import { Screen } from '@/components/screen';
import { gradients, palette, radii } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { ApiError, api } from '@/lib/api';
import type {
  CompleteTaskResponse,
  Lesson,
  LessonTask,
  ProgressResponse,
  QuizTaskContent,
  SimulationTaskContent,
} from '@/lib/types';

const FEEDBACK_SETTLE_MS = 1000;
const PICK_HINT_MS = 1200;

type CtaPhase =
  | 'idle'
  | 'busy'
  | 'correct'
  | 'wrong'
  | 'pick'
  | 'network';

export default function LessonScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const { token, refreshUser } = useAuth();
  const insets = useSafeAreaInsets();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [ctaPhase, setCtaPhase] = useState<CtaPhase>('idle');
  const [ctaXp, setCtaXp] = useState(0);
  const [ctaNetworkMessage, setCtaNetworkMessage] = useState('');
  const [finishAwardedXp, setFinishAwardedXp] = useState<number | null>(null);
  const ctaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCtaTimer = useCallback(() => {
    if (ctaTimerRef.current) {
      clearTimeout(ctaTimerRef.current);
      ctaTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearCtaTimer(), [clearCtaTimer]);

  const load = useCallback(async () => {
    if (!lessonId || !token) {
      return;
    }

    const [lessonResponse, progressResponse] = await Promise.all([
      api.getLesson(lessonId),
      api.getProgress(token),
    ]);

    setLesson(lessonResponse);
    setProgress(progressResponse);
    setSelectedOptionIndex(null);
    setLoading(false);
  }, [lessonId, token]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setFinishAwardedXp(null);
  }, [lessonId]);

  const completedTaskIds = useMemo(
    () => progress?.completedTaskIds ?? [],
    [progress],
  );
  const completedTasks = lesson?.tasks.filter((task) => completedTaskIds.includes(task.id)).length ?? 0;
  const totalTasks = lesson?.tasks.length ?? 0;
  const progressRatio = totalTasks > 0 ? completedTasks / totalTasks : 0;

  const currentTask = useMemo<LessonTask | null>(() => {
    if (!lesson) {
      return null;
    }

    return lesson.tasks.find((task) => !completedTaskIds.includes(task.id)) ?? null;
  }, [lesson, completedTaskIds]);

  const lessonComplete = totalTasks > 0 && completedTasks >= totalTasks;
  const taskOrdinal = currentTask
    ? lesson!.tasks.findIndex((t) => t.id === currentTask.id) + 1
    : totalTasks;

  const finalizeAfterCorrect = useCallback(
    async (response: CompleteTaskResponse, completedTaskId: string) => {
      if (!lesson || !token) {
        return;
      }

      const nextCompletedIds = [...completedTaskIds, completedTaskId];
      const allTasksDone = lesson.tasks.every((t) => nextCompletedIds.includes(t.id));

      await refreshUser();
      await load();
      setSelectedOptionIndex(null);
      setCtaPhase('idle');
      setCtaXp(0);

      if (allTasksDone) {
        setFinishAwardedXp(response.awardedXp);
      }
    },
    [lesson, token, refreshUser, load, completedTaskIds],
  );

  const submitTask = async () => {
    if (!token || !currentTask || !lesson) {
      return;
    }

    if (ctaPhase === 'busy' || ctaPhase === 'correct') {
      return;
    }

    clearCtaTimer();

    if (currentTask.type === 'quiz' && selectedOptionIndex === null) {
      setCtaPhase('pick');
      ctaTimerRef.current = setTimeout(() => {
        setCtaPhase('idle');
        ctaTimerRef.current = null;
      }, PICK_HINT_MS);
      return;
    }

    setCtaPhase('busy');

    try {
      let response: CompleteTaskResponse;

      if (currentTask.type === 'quiz') {
        response = await api.completeTask(token, currentTask.id, selectedOptionIndex!);
      } else {
        response = await api.completeTask(token, currentTask.id);
      }

      setCtaXp(response.awardedXp);
      setCtaPhase('correct');

      ctaTimerRef.current = setTimeout(() => {
        ctaTimerRef.current = null;
        void finalizeAfterCorrect(response, currentTask.id);
      }, FEEDBACK_SETTLE_MS);
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        setCtaPhase('wrong');
        ctaTimerRef.current = setTimeout(() => {
          setCtaPhase('idle');
          ctaTimerRef.current = null;
        }, FEEDBACK_SETTLE_MS);
        return;
      }

      const message =
        error instanceof ApiError ? error.message : 'Попробуйте ещё раз.';
      setCtaNetworkMessage(message);
      setCtaPhase('network');
      ctaTimerRef.current = setTimeout(() => {
        setCtaPhase('idle');
        setCtaNetworkMessage('');
        ctaTimerRef.current = null;
      }, FEEDBACK_SETTLE_MS + 400);
    }
  };

  const quizContent =
    currentTask?.type === 'quiz' ? (currentTask.content as QuizTaskContent) : null;
  const simulationContent =
    currentTask?.type === 'simulation'
      ? (currentTask.content as SimulationTaskContent)
      : null;

  const ctaLabel = useMemo(() => {
    switch (ctaPhase) {
      case 'busy':
        return 'Проверяем...';
      case 'correct':
        return ctaXp > 0 ? `Правильно! +${ctaXp} XP` : 'Правильно!';
      case 'wrong':
        return 'Попробуй снова!';
      case 'pick':
        return 'Выберите вариант';
      case 'network':
        return ctaNetworkMessage.length > 40
          ? `${ctaNetworkMessage.slice(0, 37)}…`
          : ctaNetworkMessage;
      default:
        return currentTask ? 'Далее →' : 'Подождите...';
    }
  }, [ctaPhase, ctaXp, ctaNetworkMessage, currentTask]);

  const ctaKey = `${ctaPhase}-${ctaLabel}`;

  const ctaBackgroundStyle = useMemo(() => {
    switch (ctaPhase) {
      case 'wrong':
        return styles.primaryButtonDanger;
      case 'pick':
        return styles.primaryButtonWarning;
      case 'network':
        return styles.primaryButtonWarning;
      case 'busy':
      case 'correct':
        return styles.primaryButton;
      default:
        return styles.primaryButton;
    }
  }, [ctaPhase]);

  const ctaDisabled =
    !currentTask || ctaPhase === 'busy' || ctaPhase === 'correct';

  if (loading || !lesson) {
    return <LoadingScreen label="Открываем материал..." />;
  }

  return (
    <Screen backgroundColor={palette.background} padded={false}>
      <View style={styles.flexMain}>
        <ScrollView
          style={styles.flexScroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <LinearGradient colors={gradients.header} style={styles.hero}>
            <View style={styles.heroTop}>
              <Pressable onPress={() => router.back()} hitSlop={12}>
                <Text style={styles.topAction}>⚙</Text>
              </Pressable>
              <View style={styles.pointsBadge}>
                <Text style={styles.pointsText}>{completedTasks * 25}</Text>
              </View>
            </View>

            <Text style={styles.heroTitleCompact} numberOfLines={2}>
              {lesson.title}
            </Text>

            {!lessonComplete && currentTask ? (
              <Text style={styles.heroSubtitle} numberOfLines={1}>
                {`Задание ${taskOrdinal} из ${totalTasks} · ${Math.round(progressRatio * 100)}%`}
              </Text>
            ) : lessonComplete ? (
              <Text style={styles.heroSubtitle}>Урок пройден</Text>
            ) : null}

            <View style={styles.heroTrack}>
              <View style={[styles.heroFill, { width: `${Math.max(progressRatio * 100, 8)}%` }]} />
            </View>
          </LinearGradient>

          <View style={styles.body}>
            {lessonComplete ? (
              <AppCard>
                <Text style={styles.completeEmoji}>🎉</Text>
                <Text style={styles.completeTitle}>Урок завершён!</Text>
                <Text style={styles.completeDescription}>
                  Вы ответили на все задания этого урока. Можете вернуться к списку курсов или на главную.
                </Text>
                {finishAwardedXp != null && finishAwardedXp > 0 ? (
                  <Text style={styles.completeXp}>+{finishAwardedXp} XP</Text>
                ) : null}
                <Pressable
                  style={styles.homeButton}
                  onPress={() => router.replace('/(tabs)')}>
                  <Text style={styles.homeButtonText}>На главную</Text>
                </Pressable>
              </AppCard>
            ) : currentTask ? (
              <AppCard>
                <Text style={styles.taskLabel}>
                  {currentTask.type === 'quiz' ? 'Текущий вопрос' : 'Практический сценарий'}
                </Text>

                {quizContent ? (
                  <>
                    <Text style={styles.taskTitle}>{quizContent.question}</Text>
                    <View style={styles.optionsList}>
                      {quizContent.options.map((option, index) => {
                        const selected = selectedOptionIndex === index;
                        return (
                          <Pressable
                            key={`${currentTask.id}-${index}`}
                            style={[styles.option, selected && styles.optionSelected]}
                            onPress={() => setSelectedOptionIndex(index)}
                            accessibilityRole="radio"
                            accessibilityState={{ selected }}>
                            <View
                              style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                              {selected ? <View style={styles.radioInner} /> : null}
                            </View>
                            <Text
                              style={[
                                styles.optionLabel,
                                selected && styles.optionLabelSelected,
                              ]}>
                              {option}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </>
                ) : simulationContent ? (
                  <>
                    <Text style={styles.taskTitle}>{simulationContent.scenario}</Text>
                    <View style={styles.steps}>
                      {simulationContent.steps.map((step) => (
                        <View key={step} style={styles.stepRow}>
                          <Text style={styles.stepBullet}>•</Text>
                          <Text style={styles.stepText}>{step}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                ) : null}
              </AppCard>
            ) : (
              <EmptyState
                title="Нет заданий в этом уроке"
                description="Сообщите, если контент не загрузился."
              />
            )}
          </View>
        </ScrollView>

        {ctaPhase === 'correct' && !lessonComplete ? <BottomConfetti /> : null}

        {!lessonComplete ? (
          <View
            style={[
              styles.ctaBar,
              {
                paddingBottom: Math.max(insets.bottom, 12),
                borderTopColor: palette.border,
                zIndex: 5,
              },
            ]}>
            <Pressable
              style={[
                ctaBackgroundStyle,
                ctaDisabled && styles.primaryButtonDisabled,
              ]}
              onPress={() => void submitTask()}
              disabled={ctaDisabled}>
              <Animated.Text
                key={ctaKey}
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(140)}
                style={styles.primaryButtonText}>
                {ctaLabel}
              </Animated.Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flexMain: {
    flex: 1,
  },
  flexScroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 16,
    flexGrow: 1,
  },
  hero: {
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  heroTitleCompact: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    marginBottom: 2,
  },
  topAction: {
    color: '#FFFFFF',
    fontSize: 24,
  },
  pointsBadge: {
    backgroundColor: '#FF7F2E',
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pointsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: '#DDE8FF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  completeEmoji: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 8,
  },
  completeTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  completeDescription: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
  completeXp: {
    color: palette.purple,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  homeButton: {
    backgroundColor: palette.purple,
    borderRadius: radii.pill,
    paddingVertical: 16,
    alignItems: 'center',
  },
  homeButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  heroTrack: {
    height: 5,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
    marginTop: 6,
  },
  heroFill: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: '#F56D19',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 0,
  },
  taskLabel: {
    color: palette.purple,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  taskTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 27,
  },
  optionsList: {
    marginTop: 16,
    gap: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: radii.md,
    backgroundColor: palette.background,
    borderWidth: 1,
    borderColor: palette.border,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: palette.border,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: palette.purple,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: palette.purple,
  },
  optionSelected: {
    borderColor: palette.purple,
    backgroundColor: '#F0EEFF',
  },
  optionLabel: {
    flex: 1,
    color: palette.text,
    fontSize: 15,
    lineHeight: 22,
  },
  optionLabelSelected: {
    color: palette.purple,
  },
  steps: {
    marginTop: 14,
    gap: 10,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stepBullet: {
    color: palette.purple,
    fontSize: 18,
    lineHeight: 22,
  },
  stepText: {
    flex: 1,
    color: palette.text,
    fontSize: 15,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: '#17A34A',
    borderRadius: radii.pill,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryButtonDanger: {
    backgroundColor: '#DC2626',
    borderRadius: radii.pill,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryButtonWarning: {
    backgroundColor: '#CA8A04',
    borderRadius: radii.pill,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryButtonDisabled: {
    opacity: 0.75,
  },
  ctaBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    backgroundColor: palette.background,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
});
