import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '@/utils/notification.util';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();

  const { restoreToken, isLoading, token } = useAuthStore();
  const [isReady, setIsReady] = useState(false);
  const loadTheme = useThemeStore((state) => state.loadTheme);
  const [fontsLoaded] = useFonts({
    NotoSerif: require('../assets/fonts/NotoSerif-Variable.ttf'),
    Manrope: require('../assets/fonts/Manrope-Variable.ttf'),
  });

  const [expoPushToken, setExpoPushToken] = useState<string | undefined>('');
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);

  useEffect(() => {
    loadTheme();

    // Kiểm tra và lấy token nếu ĐÃ có quyền (không tự động hiện pop-up)
    Notifications.getPermissionsAsync().then(({ status }) => {
      if (status === 'granted') {
        registerForPushNotificationsAsync().then(token => setExpoPushToken(token || ''));
      }
    });

    // Lắng nghe thông báo khi app đang mở
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification.request.content.title, notification.request.content.body);
    });

    // Lắng nghe khi người dùng nhấn vào thông báo
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [loadTheme]);

  useEffect(() => {
    // Check local storage for token on mount
    const checkToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        const storedUser = await AsyncStorage.getItem('userData');
        if (storedToken && storedUser) {
          restoreToken(storedToken, JSON.parse(storedUser));
        } else {
          restoreToken('', null as any); // Clear if not found
        }
      } catch {
        restoreToken('', null as any);
      } finally {
        setIsReady(true);
      }
    };
    checkToken();
  }, [restoreToken]);

  useEffect(() => {
    if (!isReady || isLoading) return;

    setTimeout(() => {
      const inAuthGroup = (segments[0] as string) === 'auth';

      if (!token && !inAuthGroup) {
        // Redirect to login if not authenticated
        router.replace('/auth/login' as any);
      } else if (token && inAuthGroup) {
        // Redirect away from login if authenticated
        router.replace('/(tabs)' as any);
      }
    }, 0);
  }, [token, segments, isReady, isLoading, router]);

  if (!isReady || !fontsLoaded) {
    return null; // Or a splash screen component
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
