import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { AppCard } from '@/components/app-card';
import { LoadingScreen } from '@/components/loading-screen';
import { Screen } from '@/components/screen';
import { palette, radii } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import type { NextTaskResponse } from '@/lib/types';

function hasTask(task: NextTaskResponse): task is Exclude<NextTaskResponse, { task: null }> {
  return !('task' in task);
}

export default function PracticeScreen() {
  const { token } = useAuth();
  const [nextTask, setNextTask] = useState<NextTaskResponse | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      return;
    }

    const response = await api.getNextTask(token);
    setNextTask(response);
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!nextTask) {
    return <LoadingScreen label="Подбираем быструю практику..." />;
  }

  return (
    <Screen backgroundColor={palette.background}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>‹ Назад</Text>
      </Pressable>

      <AppCard>
        {hasTask(nextTask) ? (
          <>
            <Text style={styles.title}>Быстрая практика</Text>
            <Text style={styles.description}>
              Следующее доступное задание: {nextTask.lesson.title}
            </Text>
            <Pressable
              style={styles.button}
              onPress={() =>
                router.replace({
                  pathname: '/lessons/[lessonId]',
                  params: { lessonId: nextTask.lesson.id },
                })
              }>
              <Text style={styles.buttonText}>Открыть урок</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.title}>Все задания завершены</Text>
            <Text style={styles.description}>{nextTask.message}</Text>
          </>
        )}
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: {
    color: palette.purple,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  title: {
    color: palette.text,
    fontSize: 24,
    fontWeight: '800',
  },
  description: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
  },
  button: {
    marginTop: 20,
    backgroundColor: palette.purple,
    paddingVertical: 16,
    borderRadius: radii.pill,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
