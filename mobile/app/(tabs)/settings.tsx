import React from 'react';
import { View, Text, StyleSheet, Alert, Switch, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useTranslation } from '../../hooks/useTranslation';
import { MaterialIcons } from '@expo/vector-icons';
import { HeaderMenu } from '../../components/ui/header-menu';
import { HapticTouch } from '../../components/ui/haptic-touch';




export default function SettingsScreen() {
  const router = require('expo-router').useRouter();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();
  const { theme: storedTheme, setTheme, language, setLanguage, hapticsEnabled, setHapticsEnabled } = useThemeStore();
  const insets = useSafeAreaInsets();

  const isDarkMode = storedTheme === 'dark';

  const toggleSwitch = () => {
    setTheme(isDarkMode ? 'light' : 'dark');
  };

  const handleLogout = () => {
    Alert.alert(t('settings.logoutConfirmTitle'), t('settings.logoutConfirmMsg'), [
      { text: t('settings.cancel'), style: 'cancel' },
      {
        text: t('settings.logout'),
        style: 'destructive',
        onPress: async () => {
          await logout();
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + 100
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={[styles.brand, { color: colors.primary }]}>B_Hair</Text>
            <View style={{ width: 1, height: 14, backgroundColor: colors.border }} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.secondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {t('settings.title') || 'Cài đặt'}
            </Text>
          </View>
          <HeaderMenu />
        </View>

        <View style={styles.profileRow}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.surfaceAlt }]}>
              <MaterialIcons name="person" size={50} color={colors.outline} />
            </View>
          )}
          <View style={styles.profileMeta}>
            <Text style={[styles.profileLabel, { color: colors.secondary }]}>{user ? (t('settings.customer') || 'Khách hàng') : 'Guest'}</Text>
            <Text style={[styles.profileName, { color: colors.primary }]}>{user?.fullName || 'Khách hàng mới'}</Text>
            <Text style={[styles.profilePhone, { color: colors.muted }]}>{user?.phoneNumber || 'Vui lòng đăng nhập'}</Text>
            {!user && (
              <HapticTouch
                style={{ marginTop: 8, backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, alignSelf: 'flex-start' }}
                onPress={() => router.push('/auth/login' as any)}
              >
                <Text style={{ color: colors.onPrimary, fontSize: 13, fontWeight: 'bold' }} allowFontScaling={false}>Đăng nhập</Text>
              </HapticTouch>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={[styles.cardBlock, { backgroundColor: colors.surface }]}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <MaterialIcons name="vibration" size={20} color={colors.secondary} />
                <Text style={[styles.rowLabel, { color: colors.primary }]}>{t('settings.haptics')}</Text>
              </View>
              <Switch
                value={hapticsEnabled}
                onValueChange={(val) => {
                  setHapticsEnabled(val);
                  if (val) Haptics.selectionAsync();
                }}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={hapticsEnabled ? colors.onPrimary : '#f4f3f4'}
              />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <MaterialIcons name="dark-mode" size={20} color={colors.secondary} />
                <Text style={[styles.rowLabel, { color: colors.primary }]}>{t('settings.darkMode')}</Text>
              </View>
              <Switch
                value={theme === 'dark'}
                onValueChange={(val) => {
                  setTheme(val ? 'dark' : 'light');
                  if (hapticsEnabled) Haptics.selectionAsync();
                }}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={theme === 'dark' ? colors.onPrimary : '#f4f3f4'}
              />
            </View>
          </View>

          <View style={[styles.cardBlock, { backgroundColor: colors.surface }]}>
            <View style={styles.rowLeft}>
              <MaterialIcons name="language" size={20} color={colors.secondary} />
              <Text style={[styles.rowLabel, { color: colors.primary }]}>{t('settings.language')}</Text>
            </View>
            <View style={[styles.segment, { backgroundColor: colors.surfaceAlt }]}>
              <HapticTouch
                style={[styles.segmentBtn, language === 'vi' && { backgroundColor: colors.primary }]}
                onPress={() => setLanguage('vi')}
              >
                <Text style={[styles.segmentText, { color: language === 'vi' ? colors.onPrimary : colors.muted }]} allowFontScaling={false}>Tiếng Việt</Text>
              </HapticTouch>
              <HapticTouch
                style={[styles.segmentBtn, language === 'en' && { backgroundColor: colors.primary }]}
                onPress={() => setLanguage('en')}
              >
                <Text style={[styles.segmentText, { color: language === 'en' ? colors.onPrimary : colors.muted }]} allowFontScaling={false}>English</Text>
              </HapticTouch>
            </View>
          </View>

          <View style={[styles.cardBlock, { backgroundColor: colors.surface }]}>
            <HapticTouch style={styles.linkRow}>
              <View style={styles.rowLeft}>
                <MaterialIcons name="person" size={20} color={colors.secondary} />
                <Text style={[styles.rowLabel, { color: colors.primary }]}>{t('settings.accountSettings')}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.outline} />
            </HapticTouch>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <HapticTouch style={styles.linkRow}>
              <View style={styles.rowLeft}>
                <MaterialIcons name="payments" size={20} color={colors.secondary} />
                <Text style={[styles.rowLabel, { color: colors.primary }]}>{t('settings.paymentMethods')}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.outline} />
            </HapticTouch>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <HapticTouch style={styles.linkRow}>
              <View style={styles.rowLeft}>
                <MaterialIcons name="help" size={20} color={colors.secondary} />
                <Text style={[styles.rowLabel, { color: colors.primary }]}>{t('settings.helpSupport')}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.outline} />
            </HapticTouch>
          </View>

          {user && (
            <HapticTouch
              style={[styles.logoutButton, { borderColor: colors.error }]}
              onPress={handleLogout}
            >
              <MaterialIcons name="logout" size={18} color={colors.error} />
              <Text style={[styles.logoutText, { color: colors.error }]}>{t('settings.logout')}</Text>
            </HapticTouch>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brand: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Fonts.headline,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    fontFamily: Fonts.headline,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileMeta: {
    flex: 1,
    paddingBottom: 6,
  },
  profileLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '700',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: Fonts.headline,
    marginTop: 4,
  },
  profilePhone: {
    fontSize: 13,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    gap: 16,
  },
  cardRow: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardBlock: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  row: {
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  segment: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
    includeFontPadding: false,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  divider: {
    height: 1,
    opacity: 0.12,
  },
  logoutButton: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
