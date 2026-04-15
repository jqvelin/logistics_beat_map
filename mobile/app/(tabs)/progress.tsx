import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppCard } from '@/components/app-card';
import { LoadingScreen } from '@/components/loading-screen';
import { Screen } from '@/components/screen';
import { palette } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import type { ProgressResponse } from '@/lib/types';

export default function ProgressScreen() {
  const { token } = useAuth();
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) {
      return;
    }

    const response = await api.getProgress(token);
    setProgress(response);
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

  if (loading) {
    return <LoadingScreen label="Считаем ваш прогресс..." />;
  }

  const overview = progress?.overview;

  return (
    <Screen backgroundColor={palette.background}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.purple} />
        }>
        <Text style={styles.title}>Прогресс</Text>
        <Text style={styles.subtitle}>Следите за тем, как растут уровень, модули и ежедневная серия.</Text>

        <View style={styles.grid}>
          <AppCard>
            <Text style={styles.metricLabel}>Курсы</Text>
            <Text style={styles.metricValue}>
              {overview?.completedCourses ?? 0}/{overview?.totalCourses ?? 0}
            </Text>
          </AppCard>
          <AppCard>
            <Text style={styles.metricLabel}>Модули</Text>
            <Text style={styles.metricValue}>
              {overview?.completedModules ?? 0}/{overview?.totalModules ?? 0}
            </Text>
          </AppCard>
          <AppCard>
            <Text style={styles.metricLabel}>Уроки</Text>
            <Text style={styles.metricValue}>
              {overview?.completedLessons ?? 0}/{overview?.totalLessons ?? 0}
            </Text>
          </AppCard>
          <AppCard>
            <Text style={styles.metricLabel}>Задания</Text>
            <Text style={styles.metricValue}>
              {overview?.completedTasks ?? 0}/{overview?.totalTasks ?? 0}
            </Text>
          </AppCard>
        </View>

        {progress?.courses.map((course) => (
          <AppCard key={course.courseId}>
            <Text style={styles.courseTitle}>{course.title}</Text>
            <Text style={styles.courseMeta}>
              {course.completedModules}/{course.totalModules} модулей ·{' '}
              {course.completedTasks}/{course.totalTasks} заданий
            </Text>
          </AppCard>
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
  title: {
    color: palette.text,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  metricLabel: {
    color: palette.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  metricValue: {
    color: palette.purple,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 10,
  },
  courseTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '800',
  },
  courseMeta: {
    color: palette.textMuted,
    fontSize: 14,
    marginTop: 8,
  },
});
