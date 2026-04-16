import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { AppCard } from '@/components/app-card';
import { LoadingScreen } from '@/components/loading-screen';
import { Screen } from '@/components/screen';
import { palette, radii } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { getCourseProgress, getLessonProgress } from '@/lib/progress';
import type { CourseDetail, ProgressResponse } from '@/lib/types';

export default function CourseDetailScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { token } = useAuth();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [progress, setProgress] = useState<ProgressResponse | null>(null);

  const load = useCallback(async () => {
    if (!courseId) {
      return;
    }

    if (token) {
      const [courseResponse, progressResponse] = await Promise.all([
        api.getCourse(courseId),
        api.getProgress(token),
      ]);
      setCourse(courseResponse);
      setProgress(progressResponse);
    } else {
      const courseResponse = await api.getCourse(courseId);
      setCourse(courseResponse);
      setProgress(null);
    }
  }, [courseId, token]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!course) {
    return <LoadingScreen label="Открываем курс..." />;
  }

  const courseProgress = getCourseProgress(progress, course.id);

  return (
    <Screen backgroundColor={palette.background}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹ Назад</Text>
        </Pressable>

        <Text style={styles.title}>{course.title}</Text>
        {courseProgress ? (
          <Text style={styles.courseSummary}>
            {courseProgress.completedModules}/{courseProgress.totalModules} модулей ·{' '}
            {courseProgress.completedLessons}/{courseProgress.totalLessons} уроков ·{' '}
            {courseProgress.completedTasks}/{courseProgress.totalTasks} заданий
          </Text>
        ) : null}

        {course.modules.map((module, moduleIndex) => (
          <AppCard key={module.id}>
            <Text style={styles.moduleLabel}>Модуль {moduleIndex + 1}</Text>
            <Text style={styles.moduleTitle}>{module.title}</Text>

            <View style={styles.lessonList}>
              {module.lessons.map((lesson, lessonIndex) => {
                const lp = getLessonProgress(progress, course.id, lesson.id);
                const done = lp?.isCompleted ?? false;
                const doneTasks = lp?.completedTasks ?? 0;
                const totalTasks = lp?.totalTasks ?? lesson.tasks.length;
                const taskRatio = totalTasks > 0 ? doneTasks / totalTasks : 0;

                return (
                  <Pressable
                    key={lesson.id}
                    style={styles.lessonRow}
                    onPress={() =>
                      router.push({
                        pathname: '/lessons/[lessonId]',
                        params: { lessonId: lesson.id },
                      })
                    }>
                    <View
                      style={[
                        styles.lessonIndex,
                        done && styles.lessonIndexDone,
                      ]}>
                      <Text style={[styles.lessonIndexText, done && styles.lessonIndexTextDone]}>
                        {done ? '✓' : lessonIndex + 1}
                      </Text>
                    </View>
                    <View style={styles.lessonBody}>
                      <Text style={styles.lessonTitle}>{lesson.title}</Text>
                      <Text style={styles.lessonMeta}>
                        {lp
                          ? `${doneTasks}/${totalTasks} заданий · ${Math.round(taskRatio * 100)}%`
                          : `${lesson.tasks.length} заданий`}
                      </Text>
                      {lp && totalTasks > 0 ? (
                        <View style={styles.lessonTrack}>
                          <View
                            style={[styles.lessonFill, { width: `${Math.max(taskRatio * 100, 6)}%` }]}
                          />
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.lessonArrow}>›</Text>
                  </Pressable>
                );
              })}
            </View>
          </AppCard>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 14,
    paddingBottom: 30,
  },
  back: {
    color: palette.purple,
    fontSize: 16,
    fontWeight: '700',
  },
  title: {
    color: palette.text,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 36,
  },
  courseSummary: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 4,
    fontWeight: '600',
  },
  moduleLabel: {
    color: palette.purple,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  moduleTitle: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 28,
  },
  lessonList: {
    marginTop: 16,
    gap: 12,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  lessonIndex: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EEF3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonIndexDone: {
    backgroundColor: '#DCF5E8',
  },
  lessonIndexText: {
    color: palette.purple,
    fontWeight: '800',
  },
  lessonIndexTextDone: {
    color: '#0F8A4A',
    fontSize: 16,
  },
  lessonBody: {
    flex: 1,
    gap: 4,
  },
  lessonTitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '700',
  },
  lessonMeta: {
    color: palette.textMuted,
    fontSize: 14,
  },
  lessonTrack: {
    height: 5,
    borderRadius: radii.pill,
    backgroundColor: '#E8ECF3',
    overflow: 'hidden',
    marginTop: 8,
  },
  lessonFill: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: palette.purple,
  },
  lessonArrow: {
    color: palette.purple,
    fontSize: 22,
    fontWeight: '800',
  },
});
