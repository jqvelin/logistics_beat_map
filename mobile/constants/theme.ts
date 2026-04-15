export const palette = {
  background: '#F4F7FC',
  surface: '#FFFFFF',
  surfaceMuted: '#F0F4FA',
  border: '#E4E9F2',
  text: '#13213A',
  textMuted: '#7C859A',
  textSoft: '#A0A7B8',
  purple: '#5C42E2',
  purpleDark: '#4A35CC',
  blue: '#2B73EB',
  cyan: '#17C7F7',
  green: '#20C675',
  greenSoft: '#EAF9F1',
  orange: '#FF8D3D',
  pink: '#EC4D9A',
  yellow: '#FFC83D',
  yellowSoft: '#FFF7D9',
  danger: '#FF5D73',
  tabInactive: '#A2AABC',
  shadow: 'rgba(52, 75, 124, 0.14)',
  darkTab: '#1F2A44',
};

export const gradients = {
  header: [palette.purple, palette.blue] as const,
  dailyGoal: ['#4F5BF5', '#17C7F7'] as const,
  practice: [palette.orange, palette.pink] as const,
  success: ['#28CF82', '#1EB76E'] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radii = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};

export const shadows = {
  card: {
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 5,
  },
};

export const Colors = {
  light: {
    text: palette.text,
    background: palette.background,
    tint: palette.purple,
    icon: palette.textMuted,
    tabIconDefault: palette.tabInactive,
    tabIconSelected: palette.purple,
  },
  dark: {
    text: '#F5F7FB',
    background: palette.darkTab,
    tint: '#FFFFFF',
    icon: '#C3CAE0',
    tabIconDefault: '#7E8AA7',
    tabIconSelected: '#FFFFFF',
  },
};

export const lightNavigationTheme = {
  dark: false,
  colors: {
    primary: palette.purple,
    background: palette.background,
    card: palette.surface,
    text: palette.text,
    border: palette.border,
    notification: palette.orange,
  },
  fonts: {
    regular: {
      fontFamily: 'System',
      fontWeight: '400' as const,
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500' as const,
    },
    bold: {
      fontFamily: 'System',
      fontWeight: '700' as const,
    },
    heavy: {
      fontFamily: 'System',
      fontWeight: '800' as const,
    },
  },
};
