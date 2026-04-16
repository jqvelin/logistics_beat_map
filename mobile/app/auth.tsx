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
  const { login, register, requestEmailCode, verifyEmailCode } = useAuth();
  const [authMethod, setAuthMethod] = useState<'email' | 'password'>('email');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('student@example.com');
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [emailCode, setEmailCode] = useState('');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submitPassword = async () => {
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

  const submitEmailAuth = async () => {
    setSubmitting(true);
    setError(null);

    try {
      if (pendingEmail) {
        await verifyEmailCode(pendingEmail, emailCode.trim());
      } else {
        const normalizedEmail = email.trim();
        await requestEmailCode(normalizedEmail);
        setPendingEmail(normalizedEmail);
        setEmailCode('');
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
              style={[
                styles.segmentButton,
                authMethod === 'email' && styles.segmentButtonActive,
              ]}
              onPress={() => {
                setAuthMethod('email');
                setPendingEmail(null);
                setEmailCode('');
                setError(null);
              }}>
              <Text
                style={[
                  styles.segmentLabel,
                  authMethod === 'email' && styles.segmentLabelActive,
                ]}>
                Почта
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.segmentButton,
                authMethod === 'password' && styles.segmentButtonActive,
              ]}
              onPress={() => {
                setAuthMethod('password');
                setPendingEmail(null);
                setEmailCode('');
                setError(null);
              }}>
              <Text
                style={[
                  styles.segmentLabel,
                  authMethod === 'password' && styles.segmentLabelActive,
                ]}>
                Пароль
              </Text>
            </Pressable>
          </View>

          {authMethod === 'email' ? (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{pendingEmail ? 'Код' : 'Email'}</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                editable={!submitting}
                keyboardType={pendingEmail ? 'number-pad' : 'email-address'}
                maxLength={pendingEmail ? 6 : undefined}
                style={styles.input}
                value={pendingEmail ? emailCode : email}
                onChangeText={pendingEmail ? setEmailCode : setEmail}
                placeholder={pendingEmail ? '000000' : 'student@example.com'}
                placeholderTextColor={palette.textSoft}
              />
              {pendingEmail ? (
                <Text style={styles.codeHint}>
                  Прислали код подтверждения на почту. Введите его в поле выше, чтобы войти в приложение.
                </Text>
              ) : null}
            </View>
          ) : (
            <>
              <View style={styles.segment}>
                <Pressable
                  style={[
                    styles.segmentButton,
                    mode === 'login' && styles.segmentButtonActive,
                  ]}
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
                  style={[
                    styles.segmentButton,
                    mode === 'register' && styles.segmentButtonActive,
                  ]}
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
                <Text style={styles.fieldLabel}>Пароль</Text>
                <TextInput
                  editable={!submitting}
                  secureTextEntry
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Не менее 8 символов"
                  placeholderTextColor={palette.textSoft}
                />
              </View>
            </>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[
              styles.primaryButton,
              submitting && styles.primaryButtonDisabled,
            ]}
            onPress={authMethod === 'email' ? submitEmailAuth : submitPassword}
            disabled={submitting}>
            <Text style={styles.primaryButtonLabel}>
              {submitting
                ? authMethod === 'email'
                  ? pendingEmail
                    ? 'Проверяем код...'
                    : 'Отправляем код...'
                  : 'Подключаемся...'
                : authMethod === 'email'
                  ? pendingEmail
                    ? 'Войти'
                    : 'Отправить код'
                  : mode === 'login'
                    ? 'Войти'
                    : 'Создать аккаунт'}
            </Text>
          </Pressable>

          {authMethod === 'password' ? (
            <Text style={styles.hint}>
              Для быстрого входа можно использовать тестовый аккаунт
              {' '}
              `student@example.com`
              {' '}
              с паролем
              {' '}
              `password123`.
            </Text>
          ) : null}
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
  primaryButtonDisabled: {
    opacity: 0.7,
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
  codeHint: {
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
  },
});
