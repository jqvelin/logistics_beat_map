import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppCard } from '@/components/app-card';
import { LoadingScreen } from '@/components/loading-screen';
import { Screen } from '@/components/screen';
import { palette } from '@/constants/theme';
import { api } from '@/lib/api';
import type { CourseSummary } from '@/lib/types';

export default function CoursesScreen() {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const response = await api.getCourses();
    setCourses(response);
    setLoading(false);
  }, []);

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
          <Text style={styles.title}>Уроки</Text>
          <Text style={styles.subtitle}>
            Выберите курс и перейдите к урокам, задачам и практическим сценариям.
          </Text>
        </View>

        {courses.map((course) => (
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
});
