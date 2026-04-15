import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
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
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {token ? (
        <>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="lessons/[lessonId]" />
          <Stack.Screen name="courses/[courseId]" />
          <Stack.Screen name="practice" />
        </>
      ) : (
        <Stack.Screen name="auth" />
      )}
    </Stack>
  );
}
