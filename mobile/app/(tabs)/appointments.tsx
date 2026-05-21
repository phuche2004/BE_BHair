import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  DeviceEventEmitter,
  Image,
  Linking,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '../../utils/notification.util';
import { Colors, Fonts } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuthStore } from '../../store/useAuthStore';
import { appointmentApi } from '../../api/appointment.api';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { HeaderMenu } from '../../components/ui/header-menu';
import { HapticTouch } from '../../components/ui/haptic-touch';

export default function AppointmentsScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const primaryText = colors.onPrimary;

  const { token } = useAuthStore();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

  const checkPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setShowPermissionPrompt(status !== 'granted');
  };

  const fetchAppointments = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await appointmentApi.getMyAppointments();
      setAppointments(res.data || res || []);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      setTab('upcoming');
      fetchAppointments();
      checkPermissions();
    }, [fetchAppointments])
  );

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('APP_REFRESH_SCREEN', () => {
      fetchAppointments();
    });
    return () => sub.remove();
  }, [fetchAppointments]);

  const upcoming = appointments.filter((a: any) => a.status === 'PENDING' || a.status === 'CONFIRMED');
  const past = appointments.filter((a: any) => a.status === 'COMPLETED' || a.status === 'CANCELLED' || a.status === 'NO_SHOW');

  const STATUS_LABEL: Record<string, string> = (t as any)('appointments.status') ?? {};
  const STATUS_COLOR: Record<string, string> = {
    PENDING: colors.warning,
    CONFIRMED: colors.secondary,
    COMPLETED: colors.success,
    CANCELLED: colors.error,
    NO_SHOW: colors.muted,
  };

  const renderAppointment = (appt: any, index: number) => {
    const isPast = tab === 'past';
    
    return (
      <HapticTouch 
        key={appt._id || index}
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => router.push(`/appointment/${appt._id}` as any)}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={[styles.shopName, { color: colors.primary }]} numberOfLines={1}>{appt.shopId?.name || 'Barbershop'}</Text>
            <Text style={[styles.serviceName, { color: colors.secondary }]}>
              {appt.serviceIds?.[0]?.name || appt.serviceId?.name || t('common.demoService')}
              {appt.serviceIds?.length > 1 ? ` (+${appt.serviceIds.length - 1})` : ''}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[appt.status] + '20' }]}>
            <Text style={[styles.statusText, { color: STATUS_COLOR[appt.status] }]} allowFontScaling={false}>
              {STATUS_LABEL[appt.status] || appt.status}
            </Text>
          </View>
        </View>

        <View style={styles.cardInfo}>
          <View style={styles.infoRow}>
            <MaterialIcons name="event" size={16} color={colors.secondary} />
            <Text style={[styles.infoText, { color: colors.secondary }]}>
              {appt.bookingDate ? new Date(appt.bookingDate).toLocaleDateString('vi-VN') : (appt.date ? new Date(appt.date).toLocaleDateString('vi-VN') : '---')}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="schedule" size={16} color={colors.secondary} />
            <Text style={[styles.infoText, { color: colors.secondary }]}>
              {appt.bookingDate 
                ? new Date(appt.bookingDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) 
                : (appt.startTime || appt.time || '---')}
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.cardFooter}>
          <Text style={[styles.price, { color: colors.primary }]}>
            {appt.totalPrice?.toLocaleString('vi-VN')}đ
          </Text>
          {!isPast && (
             <View style={[styles.actionBtn, { backgroundColor: colors.primary }]}>
              <Text style={[styles.actionText, { color: colors.onPrimary }]} allowFontScaling={false}>
                {t('home.book')}
              </Text>
            </View>
          )}
        </View>
      </HapticTouch>
    );
  };


  if (!token) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.topBar}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={[styles.brand, { color: colors.primary }]}>B_Hair</Text>
            <View style={{ width: 1, height: 14, backgroundColor: colors.border }} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.secondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {t('appointments.title')}
            </Text>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconBg, { backgroundColor: colors.surfaceAlt }]}>
            <MaterialIcons name="lock-outline" size={60} color={colors.secondary} />
          </View>
          <Text style={[styles.emptyText, { color: colors.primary }]}>Vui lòng đăng nhập</Text>
          <Text style={[styles.emptySubText, { color: colors.muted }]}>Bạn cần đăng nhập để xem lịch hẹn của mình.</Text>
          <HapticTouch 
            style={[styles.emptyButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={[styles.emptyButtonText, { color: colors.onPrimary }]}>Đăng nhập ngay</Text>
            <MaterialIcons name="login" size={18} color={colors.onPrimary} />
          </HapticTouch>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.topBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={[styles.brand, { color: colors.primary }]}>B_Hair</Text>
          <View style={{ width: 1, height: 14, backgroundColor: colors.border }} />
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.secondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {t('appointments.title')}
          </Text>
        </View>
        <HeaderMenu />
      </View>

      <View style={styles.tabContainer}>
        <HapticTouch 
          style={[styles.tab, tab === 'upcoming' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setTab('upcoming')}
        >
          <Text style={[styles.tabText, tab === 'upcoming' ? { color: colors.primary, fontWeight: '700' } : { color: colors.secondary }]} allowFontScaling={false}>
            {t('appointments.upcoming')}
          </Text>
        </HapticTouch>
        <HapticTouch 
          style={[styles.tab, tab === 'past' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setTab('past')}
        >
          <Text style={[styles.tabText, tab === 'past' ? { color: colors.primary, fontWeight: '700' } : { color: colors.secondary }]} allowFontScaling={false}>
            {t('appointments.past')}
          </Text>
        </HapticTouch>
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (tab === 'upcoming' ? upcoming : past).length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconBg, { backgroundColor: colors.surfaceAlt }]}>
              <MaterialIcons name="event-note" size={60} color={colors.secondary} />
            </View>
            <Text style={[styles.emptyText, { color: colors.primary }]}>Bạn đang không có lịch</Text>
            <Text style={[styles.emptySubText, { color: colors.muted }]}>
              {tab === 'upcoming' ? 'Hãy chọn một tiệm và đặt lịch làm đẹp ngay nhé!' : 'Lịch sử đặt lịch của bạn sẽ hiển thị tại đây.'}
            </Text>
            <HapticTouch 
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/')}
            >
              <Text style={[styles.emptyButtonText, { color: colors.onPrimary }]}>Đặt lịch ngay</Text>
              <MaterialIcons name="arrow-forward" size={18} color={colors.onPrimary} />
            </HapticTouch>
          </View>
        ) : (
          <>
            {(tab === 'upcoming' ? upcoming : past).map((appt, idx) => renderAppointment(appt, idx))}
            
            {tab === 'upcoming' && showPermissionPrompt && (
              <HapticTouch 
                style={[styles.notiBanner, { backgroundColor: colors.surfaceAlt, borderColor: colors.primary + '33' }]}
                onPress={async () => {
                  const token = await registerForPushNotificationsAsync();
                  if (token) setShowPermissionPrompt(false);
                }}
              >
                <View style={[styles.notiIcon, { backgroundColor: colors.primary }]}>
                  <MaterialIcons name="notifications-active" size={20} color={colors.onPrimary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.notiTitle, { color: colors.primary }]}>Bạn có muốn nhắc lịch không?</Text>
                  <Text style={[styles.notiText, { color: colors.muted }]}>Cho phép gửi thông báo để không bỏ lỡ lịch cắt tóc.</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={colors.primary} />
              </HapticTouch>
            )}
          </>
        )}
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
  brand: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Fonts.headline,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '700',
    fontFamily: Fonts.headline,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    paddingVertical: 12,
    marginRight: 16,
  },
  tabText: {
    fontSize: 13,
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  card: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '700',
  },
  serviceName: {
    fontSize: 14,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexShrink: 0,
    marginLeft: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    includeFontPadding: false,
  },
  cardInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
  },
  divider: {
    height: 1,
    marginBottom: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    includeFontPadding: false,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIconBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Fonts.headline,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    marginTop: 8,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  notiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 10,
    gap: 12,
  },
  notiIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notiTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  notiText: {
    fontSize: 12,
    marginTop: 2,
  },
});
