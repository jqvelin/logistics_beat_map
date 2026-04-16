import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import { AppCard } from '@/components/app-card';
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

export default function LessonScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const { token, refreshUser } = useAuth();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [finishAwardedXp, setFinishAwardedXp] = useState<number | null>(null);

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

  const completedTaskIds = progress?.completedTaskIds ?? [];
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

  const submitTask = async () => {
    if (!token || !currentTask || !lesson) {
      return;
    }

    setSubmitting(true);

    try {
      let response: CompleteTaskResponse;

      if (currentTask.type === 'quiz') {
        if (selectedOptionIndex === null) {
          Alert.alert('Выберите вариант', 'Перед отправкой нужно выбрать один из ответов.');
          setSubmitting(false);
          return;
        }

        response = await api.completeTask(token, currentTask.id, selectedOptionIndex);
      } else {
        response = await api.completeTask(token, currentTask.id);
      }

      await refreshUser();
      await load();

      const nextCompletedIds = [...completedTaskIds, currentTask.id];
      const allTasksDone = lesson.tasks.every((t) => nextCompletedIds.includes(t.id));

      if (allTasksDone) {
        setFinishAwardedXp(response.awardedXp);
      } else {
        Alert.alert(
          'Задание зачтено',
          response.awardedXp > 0
            ? `Вы получили +${response.awardedXp} XP.`
            : 'Это задание уже было пройдено раньше.',
        );
      }
    } catch (error) {
      Alert.alert(
        'Не удалось отправить ответ',
        error instanceof ApiError ? error.message : 'Попробуйте ещё раз.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !lesson) {
    return <LoadingScreen label="Открываем материал..." />;
  }

  const quizContent =
    currentTask?.type === 'quiz' ? (currentTask.content as QuizTaskContent) : null;
  const simulationContent =
    currentTask?.type === 'simulation'
      ? (currentTask.content as SimulationTaskContent)
      : null;

  return (
    <Screen backgroundColor={palette.background} padded={false}>
      <ScrollView contentContainerStyle={styles.content}>
        <LinearGradient colors={gradients.header} style={styles.hero}>
          <View style={styles.heroTop}>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.topAction}>⚙</Text>
            </Pressable>
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsText}>{completedTasks * 25}</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>{lesson.title}</Text>
          {!lessonComplete && currentTask ? (
            <Text style={styles.heroSubtitle}>
              Задание {taskOrdinal} из {totalTasks}
            </Text>
          ) : lessonComplete ? (
            <Text style={styles.heroSubtitle}>Урок пройден</Text>
          ) : null}

          <View style={styles.heroProgressCard}>
            <View style={styles.heroProgressHeader}>
              <Text style={styles.heroProgressLabel}>Старт</Text>
              <Text style={styles.heroProgressLabel}>Знаю всё</Text>
            </View>
            <View style={styles.heroTrack}>
              <View style={[styles.heroFill, { width: `${Math.max(progressRatio * 100, 10)}%` }]} />
            </View>
            <Text style={styles.heroProgressText}>Прогресс {Math.round(progressRatio * 100)}%</Text>
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

          {!lessonComplete ? (
            <Pressable
              style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]}
              onPress={() => void submitTask()}
              disabled={!currentTask || submitting}>
              <Text style={styles.primaryButtonText}>
                {submitting ? 'Проверяем...' : currentTask ? 'Далее →' : 'Подождите...'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 28,
  },
  hero: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  topAction: {
    color: '#FFFFFF',
    fontSize: 24,
  },
  pointsBadge: {
    backgroundColor: '#FF7F2E',
    borderRadius: radii.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pointsText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 36,
  },
  heroSubtitle: {
    color: '#DDE8FF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
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
  heroProgressCard: {
    marginTop: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radii.lg,
    padding: 16,
  },
  heroProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroProgressLabel: {
    color: '#DDE8FF',
    fontSize: 14,
    fontWeight: '700',
  },
  heroTrack: {
    height: 10,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
    marginTop: 12,
  },
  heroFill: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: '#F56D19',
  },
  heroProgressText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 18,
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
    fontWeight: '700',
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
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
});
