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
  NextTaskResponse,
  ProgressResponse,
  QuizTaskContent,
  SimulationTaskContent,
} from '@/lib/types';

function isTaskEnvelope(task: NextTaskResponse): task is Exclude<NextTaskResponse, { task: null }> {
  return !('task' in task);
}

export default function LessonScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const { token, refreshUser } = useAuth();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [nextTask, setNextTask] = useState<NextTaskResponse | null>(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!lessonId || !token) {
      return;
    }

    const [lessonResponse, progressResponse, nextTaskResponse] = await Promise.all([
      api.getLesson(lessonId),
      api.getProgress(token),
      api.getNextTask(token),
    ]);

    setLesson(lessonResponse);
    setProgress(progressResponse);
    setNextTask(nextTaskResponse);
    setSelectedOptionIndex(null);
    setLoading(false);
  }, [lessonId, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const currentTask = useMemo<LessonTask | null>(() => {
    if (!nextTask || !isTaskEnvelope(nextTask)) {
      return null;
    }

    return nextTask.lesson.id === lessonId ? nextTask : lesson?.tasks[0] ?? null;
  }, [lesson?.tasks, lessonId, nextTask]);

  const completedTaskIds = progress?.completedTaskIds ?? [];
  const completedTasks = lesson?.tasks.filter((task) => completedTaskIds.includes(task.id)).length ?? 0;
  const totalTasks = lesson?.tasks.length ?? 0;
  const progressRatio = totalTasks > 0 ? completedTasks / totalTasks : 0;

  const submitTask = async () => {
    if (!token || !currentTask) {
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

      Alert.alert(
        'Задание зачтено',
        response.awardedXp > 0
          ? `Вы получили +${response.awardedXp} XP.`
          : 'Это задание уже было пройдено раньше.',
      );
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
    return <LoadingScreen label="Открываем урок..." />;
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

          <Text style={styles.heroTitle}>Уровень {Math.max(completedTasks + 1, 1)}: {lesson.title}</Text>

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
          <Text style={styles.sectionTitle}>Некоторые виды логистики:</Text>

          <View style={styles.cardsGrid}>
            {['Транспортная', 'Складская', 'Производственная', 'Информационная'].map(
              (item, index) => (
                <View
                  key={item}
                  style={[
                    styles.topicCard,
                    index === 0 && styles.topicBlue,
                    index === 1 && styles.topicGreen,
                    index === 2 && styles.topicOrange,
                    index === 3 && styles.topicPurple,
                  ]}>
                  <Text style={styles.topicIcon}>{['🚚', '🏬', '⚙', '☁'][index]}</Text>
                  <Text style={styles.topicText}>{item}</Text>
                </View>
              ),
            )}
          </View>

          {currentTask ? (
            <AppCard>
              <Text style={styles.taskLabel}>
                {currentTask.type === 'quiz' ? 'Текущий вопрос' : 'Практический сценарий'}
              </Text>

              {quizContent ? (
                <>
                  <Text style={styles.taskTitle}>{quizContent.question}</Text>
                  <View style={styles.optionsList}>
                    {quizContent.options.map((option, index) => (
                      <Pressable
                        key={`${currentTask.id}-${index}`}
                        style={[
                          styles.option,
                          selectedOptionIndex === index && styles.optionSelected,
                        ]}
                        onPress={() => setSelectedOptionIndex(index)}>
                        <Text
                          style={[
                            styles.optionLabel,
                            selectedOptionIndex === index && styles.optionLabelSelected,
                          ]}>
                          {option}
                        </Text>
                      </Pressable>
                    ))}
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
              title="Все задания по уроку уже закрыты"
              description="Можете вернуться в список уроков или перейти в быструю практику на главной."
            />
          )}

          <Pressable
            style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]}
            onPress={() => void submitTask()}
            disabled={!currentTask || submitting}>
            <Text style={styles.primaryButtonText}>
              {submitting ? 'Проверяем...' : currentTask ? 'Далее →' : 'Урок завершён'}
            </Text>
          </Pressable>
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
  sectionTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '700',
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  topicCard: {
    width: '47%',
    borderRadius: radii.lg,
    padding: 18,
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  topicBlue: {
    backgroundColor: '#EEF4FF',
  },
  topicGreen: {
    backgroundColor: '#ECFFF2',
  },
  topicOrange: {
    backgroundColor: '#FFF4E7',
  },
  topicPurple: {
    backgroundColor: '#F6EFFF',
    borderWidth: 1,
    borderColor: '#CFC7FF',
  },
  topicIcon: {
    fontSize: 28,
  },
  topicText: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
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
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: radii.md,
    backgroundColor: palette.background,
    borderWidth: 1,
    borderColor: palette.border,
  },
  optionSelected: {
    borderColor: palette.purple,
    backgroundColor: '#F0EEFF',
  },
  optionLabel: {
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
