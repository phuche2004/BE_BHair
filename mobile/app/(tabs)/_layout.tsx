import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/store/useAuthStore';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  const isManager = user?.role === 'MANAGER' || user?.role === 'ADMIN';
  const isStaff = user?.role === 'STAFF';
  const isCustomer = user?.role === 'CUSTOMER' || !user;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
        headerShown: true,
        headerStyle: { backgroundColor: Colors[colorScheme ?? 'light'].background },
        headerTintColor: Colors[colorScheme ?? 'light'].text,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].background,
          borderTopColor: Colors[colorScheme ?? 'light'].secondary,
        }
      }}>

      {/* ---------------- CUSTOMER TABS ---------------- */}
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          href: isCustomer ? '/(tabs)' : null,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t('tabs.search'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="magnifyingglass" color={color} />,
          href: isCustomer ? '/search' : null,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: t('tabs.appointments'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
          href: isCustomer ? '/appointments' : null,
        }}
      />

      {/* ---------------- MANAGER TABS ---------------- */}
      <Tabs.Screen
        name="manager-shops"
        options={{
          title: t('tabs.myShops'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="building.2.fill" color={color} />,
          href: isManager ? '/manager-shops' : null,
        }}
      />
      <Tabs.Screen
        name="manager-appointments"
        options={{
          title: t('tabs.appointments'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
          href: isManager ? '/manager-appointments' : null,
        }}
      />

      {/* ---------------- STAFF TABS ---------------- */}
      <Tabs.Screen
        name="staff-appointments"
        options={{
          title: t('tabs.appointments'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
          href: isStaff ? '/staff-appointments' : null,
        }}
      />

      {/* ---------------- SHARED TABS ---------------- */}
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="gear" color={color} />,
        }}
      />

    </Tabs>
  );
}
