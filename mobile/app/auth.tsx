import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/screen';
import { palette, gradients, radii, shadows } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { ApiError } from '@/lib/api';

export default function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('student@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password);
      }
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Не удалось подключиться к серверу',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen backgroundColor={palette.background}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <Text style={styles.badge}>Логистика</Text>
        <Text style={styles.title}>Logistics Beat Map</Text>
        <Text style={styles.subtitle}>
          Изучайте логистику по шагам: теория, практика и живой прогресс.
        </Text>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.formWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.card}>
          <View style={styles.segment}>
            <Pressable
              style={[styles.segmentButton, mode === 'login' && styles.segmentButtonActive]}
              onPress={() => setMode('login')}>
              <Text
                style={[
                  styles.segmentLabel,
                  mode === 'login' && styles.segmentLabelActive,
                ]}>
                Вход
              </Text>
            </Pressable>
            <Pressable
              style={[styles.segmentButton, mode === 'register' && styles.segmentButtonActive]}
              onPress={() => setMode('register')}>
              <Text
                style={[
                  styles.segmentLabel,
                  mode === 'register' && styles.segmentLabelActive,
                ]}>
                Регистрация
              </Text>
            </Pressable>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="student@example.com"
              placeholderTextColor={palette.textSoft}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Пароль</Text>
            <TextInput
              secureTextEntry
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Не менее 8 символов"
              placeholderTextColor={palette.textSoft}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable style={styles.primaryButton} onPress={submit} disabled={submitting}>
            <Text style={styles.primaryButtonLabel}>
              {submitting
                ? 'Подключаемся...'
                : mode === 'login'
                  ? 'Войти'
                  : 'Создать аккаунт'}
            </Text>
          </Pressable>

          <Text style={styles.hint}>
            Для быстрого входа можно использовать тестовый аккаунт `student@example.com`.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
    paddingTop: 24,
    paddingBottom: 30,
    paddingHorizontal: 20,
    gap: 10,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    color: '#FFFFFF',
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 15,
    lineHeight: 22,
  },
  formWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 24,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radii.xl,
    padding: 20,
    gap: 18,
    marginTop: -24,
    ...shadows.card,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: palette.surfaceMuted,
    borderRadius: radii.pill,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: radii.pill,
  },
  segmentButtonActive: {
    backgroundColor: palette.surface,
  },
  segmentLabel: {
    color: palette.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  segmentLabelActive: {
    color: palette.purple,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: palette.background,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: palette.text,
    fontSize: 15,
  },
  error: {
    color: palette.danger,
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: palette.purple,
    borderRadius: radii.pill,
    alignItems: 'center',
    paddingVertical: 16,
  },
  primaryButtonLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  hint: {
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
});
