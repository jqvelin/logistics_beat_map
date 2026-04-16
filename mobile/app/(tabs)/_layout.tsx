import { Tabs } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { palette } from '@/constants/theme';

const TAB_BAR_BASE_HEIGHT = 74;
const TAB_BAR_PADDING_BOTTOM = 10;

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: palette.purple,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarInactiveTintColor: palette.tabInactive,
        sceneStyle: {
          backgroundColor: palette.background,
        },
        tabBarStyle: {
          height: TAB_BAR_BASE_HEIGHT + insets.bottom,
          paddingTop: 8,
          paddingBottom: TAB_BAR_PADDING_BOTTOM + insets.bottom,
          backgroundColor: '#FFFFFF',
          borderTopColor: palette.border,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Главная',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          title: 'Курсы',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="list.bullet.rectangle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Прогресс',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="chart.line.uptrend.xyaxis" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Профиль',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
