import { ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { lightNavigationTheme, palette } from '@/constants/theme';
import { LoadingScreen } from '@/components/loading-screen';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider value={lightNavigationTheme}>
        <RootNavigator />
        <StatusBar style="light" backgroundColor={palette.purple} />
      </ThemeProvider>
    </AuthProvider>
  );
}

function RootNavigator() {
  const { token, user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const isAuthenticated = Boolean(token && user);
    const inAuthScreen = segments[0] === 'auth';

    if (!isAuthenticated && !inAuthScreen) {
      router.replace('/auth');
      return;
    }

    if (isAuthenticated && inAuthScreen) {
      router.replace('/(tabs)');
    }
  }, [isLoading, router, segments, token, user]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="auth" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="lessons/[lessonId]" />
      <Stack.Screen name="courses/[courseId]" />
      <Stack.Screen name="practice" />
      <Stack.Screen name="quick-practice" />
      <Stack.Screen name="career-path" />
    </Stack>
  );
}
