import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { AppCard } from '@/components/app-card';
import { LoadingScreen } from '@/components/loading-screen';
import { Screen } from '@/components/screen';
import { palette, radii } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { getCourseProgress } from '@/lib/progress';
import type { CourseSummary, ProgressResponse } from '@/lib/types';

export default function CoursesScreen() {
  const { token } = useAuth();
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (token) {
      const [coursesResponse, progressResponse] = await Promise.all([
        api.getCourses(),
        api.getProgress(token),
      ]);
      setCourses(coursesResponse);
      setProgress(progressResponse);
    } else {
      const coursesResponse = await api.getCourses();
      setCourses(coursesResponse);
      setProgress(null);
    }

    setLoading(false);
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const courseRows = useMemo(() => {
    return courses.map((course) => {
      const p = getCourseProgress(progress, course.id);
      const ratio =
        p && p.totalTasks > 0
          ? p.completedTasks / p.totalTasks
          : p && p.totalLessons > 0
            ? p.completedLessons / p.totalLessons
            : 0;

      return { course, progress: p, ratio };
    });
  }, [courses, progress]);

  if (loading) {
    return <LoadingScreen label="Загружаем список курсов..." omitBottomSafeArea />;
  }

  return (
    <Screen backgroundColor={palette.background} omitBottomSafeArea>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.purple} />
        }>
        <View style={styles.header}>
          <Text style={styles.title}>Курсы</Text>
          <Text style={styles.subtitle}>
            Выберите курс: внутри — модули и уроки с заданиями и практикой.
          </Text>
        </View>

        {courseRows.map(({ course, progress: courseProgress, ratio }) => (
          <Pressable
            key={course.id}
            onPress={() =>
              router.push({
                pathname: '/courses/[courseId]',
                params: { courseId: course.id },
              })
            }>
            <AppCard>
              <View style={styles.courseHeader}>
                <Text style={styles.courseTitle}>{course.title}</Text>
                <Text style={styles.courseArrow}>›</Text>
              </View>
              <Text style={styles.courseMeta}>
                {course.modules.length} модулей ·{' '}
                {course.modules.reduce((sum, module) => sum + module._count.lessons, 0)} уроков
              </Text>
              {courseProgress ? (
                <View style={styles.progressBlock}>
                  <View style={styles.progressLabels}>
                    <Text style={styles.progressCaption}>
                      {courseProgress.completedModules}/{courseProgress.totalModules} модулей ·{' '}
                      {courseProgress.completedLessons}/{courseProgress.totalLessons} уроков
                    </Text>
                    <Text style={styles.progressPercent}>{Math.round(ratio * 100)}%</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${Math.max(ratio * 100, 8)}%` }]} />
                  </View>
                </View>
              ) : (
                <Text style={styles.progressHint}>Войдите, чтобы видеть личный прогресс.</Text>
              )}
            </AppCard>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 28,
    gap: 14,
  },
  header: {
    gap: 8,
    marginBottom: 8,
  },
  title: {
    color: palette.text,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  courseHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  courseTitle: {
    flex: 1,
    color: palette.text,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 26,
  },
  courseArrow: {
    color: palette.purple,
    fontSize: 26,
    lineHeight: 28,
    fontWeight: '800',
  },
  courseMeta: {
    marginTop: 10,
    color: palette.textMuted,
    fontSize: 14,
  },
  progressBlock: {
    marginTop: 14,
    gap: 8,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressCaption: {
    flex: 1,
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginRight: 8,
  },
  progressPercent: {
    color: palette.purple,
    fontSize: 14,
    fontWeight: '800',
  },
  progressTrack: {
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: '#E8ECF3',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: palette.purple,
  },
  progressHint: {
    marginTop: 12,
    color: palette.textMuted,
    fontSize: 13,
  },
});
