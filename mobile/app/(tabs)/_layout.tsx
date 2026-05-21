import { Tabs } from 'expo-router';
import React from 'react';

// Custom Tab Bar for smooth sliding animation
import { CustomTabBar } from '@/components/ui/CustomTabBar';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/store/useAuthStore';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  const roleRef = React.useRef(user?.role);
  const role = user?.role || roleRef.current;

  const isManager = role === 'MANAGER' || role === 'ADMIN';
  const isStaff = role === 'STAFF';
  const isCustomer = role === 'CUSTOMER' || !role;

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>

      {/* ---------------- CUSTOMER TABS ---------------- */}
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          href: isCustomer ? '/(tabs)' : null,
          tabBarItemStyle: { display: isCustomer ? 'flex' : 'none' },
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t('tabs.search'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="magnifyingglass" color={color} />,
          href: isCustomer ? '/search' : null,
          tabBarItemStyle: { display: isCustomer ? 'flex' : 'none' },
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: t('tabs.appointments'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
          href: isCustomer ? '/appointments' : null,
          tabBarItemStyle: { display: isCustomer ? 'flex' : 'none' },
        }}
      />

      {/* ---------------- MANAGER TABS ---------------- */}
      <Tabs.Screen
        name="manager-shops"
        options={{
          title: t('tabs.myShops'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="building.2.fill" color={color} />,
          href: isManager ? '/manager-shops' : null,
          tabBarItemStyle: { display: isManager ? 'flex' : 'none' },
        }}
      />
      <Tabs.Screen
        name="manager-appointments"
        options={{
          title: t('tabs.appointments'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
          href: isManager ? '/manager-appointments' : null,
          tabBarItemStyle: { display: isManager ? 'flex' : 'none' },
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t('tabs.history') || 'Lịch sử',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="clock.fill" color={color} />,
          href: isManager || isStaff ? '/history' : null,
          tabBarItemStyle: { display: isManager || isStaff ? 'flex' : 'none' },
        }}
      />

      {/* ---------------- STAFF TABS ---------------- */}
      <Tabs.Screen
        name="staff-appointments"
        options={{
          title: t('tabs.appointments'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
          href: isStaff ? '/staff-appointments' : null,
          tabBarItemStyle: { display: isStaff ? 'flex' : 'none' },
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
