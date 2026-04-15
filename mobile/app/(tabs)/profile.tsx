import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppCard } from '@/components/app-card';
import { Screen } from '@/components/screen';
import { palette, radii } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <Screen backgroundColor={palette.background}>
      <Text style={styles.title}>Профиль</Text>
      <Text style={styles.subtitle}>Ваши достижения и личные показатели обучения.</Text>

      <AppCard>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.email?.[0]?.toUpperCase() ?? 'L'}</Text>
        </View>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.meta}>Уровень {user?.level ?? 1}</Text>
      </AppCard>

      <View style={styles.stats}>
        <AppCard>
          <Text style={styles.statLabel}>Опыт</Text>
          <Text style={styles.statValue}>{user?.xp ?? 0}</Text>
        </AppCard>
        <AppCard>
          <Text style={styles.statLabel}>Серия</Text>
          <Text style={styles.statValue}>{user?.streak ?? 0}</Text>
        </AppCard>
      </View>

      <Pressable style={styles.logoutButton} onPress={() => void logout()}>
        <Text style={styles.logoutText}>Выйти из аккаунта</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: palette.text,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: palette.purple,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
  },
  email: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  meta: {
    color: palette.textMuted,
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
  stats: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 14,
  },
  statLabel: {
    color: palette.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  statValue: {
    color: palette.purple,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 8,
  },
  logoutButton: {
    marginTop: 18,
    backgroundColor: palette.darkTab,
    borderRadius: radii.pill,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
