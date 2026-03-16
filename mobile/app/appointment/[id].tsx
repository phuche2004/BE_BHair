import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  ImageBackground,
  DeviceEventEmitter,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Fonts } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { appointmentApi } from '../../api/appointment.api';
import { useAuthStore } from '../../store/useAuthStore';
import { MaterialIcons } from '@expo/vector-icons';
import { HeaderMenu } from '../../components/ui/header-menu';

const HERO =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA1EMmzLiUnvvExlXuuJ5TwhZ-UGvA7TSC12PvpAVXRpB8gbEV_fVp89prjitZINmGKQNMQHKOPZAcyvv6wezOjMviYcaNJWi-wMhzr_GSymToXbhBakwhrdhjstGeaGBdgatqGWfH7c7FA2NCn43vBmhZiqu1MRJ7ivMy4UUPGJ5lk92m5rdc7nehZtKh02Qm5Twl6ybLaUODV3qsHUDzoyVedRi7977qNN2cTeuyIMJTyd4jMzX6ttIg4FVGkV1i6TIoG9n4kGWJe';

const VN_TZ = { timeZone: 'Asia/Ho_Chi_Minh' } as const;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', VN_TZ);
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('vi-VN', { ...VN_TZ, hour: '2-digit', minute: '2-digit' });
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  NO_SHOW: 'Không đến',
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: '#E65100',
  CONFIRMED: '#2E7D32',
  COMPLETED: '#1565C0',
  CANCELLED: '#B71C1C',
  NO_SHOW: '#6D4C41',
};

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const isDark = theme === 'dark';

  const user = useAuthStore((state) => state.user);
  const [appt, setAppt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await appointmentApi.getAppointmentById(id);
      setAppt(res.data ?? res);
    } catch (e: any) {
      Alert.alert('Lỗi', e.response?.data?.message ?? 'Không tải được lịch hẹn');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('APP_REFRESH_SCREEN', fetchData);
    return () => sub.remove();
  }, [fetchData]);

  const handleUpdateStatus = (newStatus: string, confirmMessage: string) => {
    Alert.alert('Cập nhật trạng thái', confirmMessage, [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Xác nhận',
        style: newStatus === 'CANCELLED' || newStatus === 'NO_SHOW' ? 'destructive' : 'default',
        onPress: async () => {
          try {
            setUpdating(true);
            await appointmentApi.updateAppointmentStatus(id, newStatus);
            setAppt((prev: any) => ({ ...prev, status: newStatus }));
            Alert.alert('Thành công', `Cập nhật trạng thái thành ${STATUS_LABEL[newStatus] || newStatus}.`);
          } catch (e: any) {
            Alert.alert('Lỗi', e.response?.data?.message ?? 'Không thể cập nhật trạng thái');
          } finally {
            setUpdating(false);
          }
        }
      }
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
    );
  }

  if (!appt) return null;

  const shopName = typeof appt.shopId === 'object' ? appt.shopId?.name : (appt.shopId ?? '—');
  const shopAddress = typeof appt.shopId === 'object' ? appt.shopId?.address : '';
  const barberName = appt.barberId
    ? (typeof appt.barberId === 'object' ? appt.barberId.fullName : 'Barber')
    : 'Bất kỳ (shop tự sắp xếp)';
  const services: any[] = appt.serviceIds ?? [];

  const statusLabel = STATUS_LABEL[appt.status] ?? appt.status;
  const statusColor = STATUS_COLOR[appt.status] ?? colors.secondary;
  const isActive = appt.status === 'PENDING' || appt.status === 'CONFIRMED';

  const isCustomer = user?.role === 'CUSTOMER';
  const isManagerOrStaff = user?.role === 'MANAGER' || user?.role === 'ADMIN' || user?.role === 'STAFF';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <MaterialIcons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: colors.primary }]}>Chi tiết lịch hẹn</Text>
        <HeaderMenu />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={styles.idRow}>
          <View>
            <Text style={[styles.idLabel, { color: colors.secondary }]}>MÃ LỊCH HẸN</Text>
            <Text style={[styles.idValue, { color: colors.primary }]}>{appt.bookingCode}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: `${statusColor}22` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        <ImageBackground 
          source={{ uri: (typeof appt.shopId === 'object' && appt.shopId?.images1?.[0]) || HERO }} 
          style={styles.hero} 
          imageStyle={styles.heroImage}
        >
          <View style={styles.heroOverlay} />
          <Text style={styles.heroCaption}>Trải nghiệm dịch vụ tại {shopName}</Text>
        </ImageBackground>

        <View style={[styles.card, { backgroundColor: theme === 'dark' ? colors.surfaceAlt : colors.surface }]}>
          <View style={styles.timeRow}>
            <MaterialIcons name="calendar-today" size={18} color={colors.secondary} />
            <View>
              <Text style={[styles.sectionLabel, { color: colors.muted }]}>THỜI GIAN</Text>
              <Text style={[styles.timeValue, { color: colors.primary }]}>
                {fmtTime(appt.bookingDate)} - {fmtTime(appt.endTime)}
              </Text>
              <Text style={[styles.timeDate, { color: colors.secondary }]}>{fmtDate(appt.bookingDate)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.doubleRow}>
          <View style={[styles.smallCard, { backgroundColor: theme === 'dark' ? colors.surfaceAlt : colors.surface }]}>
            <MaterialIcons name="location-on" size={18} color={colors.secondary} />
            <Text style={[styles.smallLabel, { color: colors.muted }]}>CỬA HÀNG</Text>
            <Text style={[styles.smallValue, { color: colors.primary }]} numberOfLines={1}>{shopName}</Text>
            {!!shopAddress && <Text style={[styles.smallSub, { color: colors.muted }]} numberOfLines={1}>{shopAddress}</Text>}
          </View>
          <View style={[styles.smallCard, { backgroundColor: theme === 'dark' ? colors.surfaceAlt : colors.surface }]}>
            <MaterialIcons name="content-cut" size={18} color={colors.secondary} />
            <Text style={[styles.smallLabel, { color: colors.muted }]}>BARBER</Text>
            <Text style={[styles.smallValue, { color: colors.primary }]} numberOfLines={1}>{barberName}</Text>
            {typeof appt.shopId === 'object' && !!appt.shopId?.phone && (
              <Text style={[styles.smallSub, { color: colors.muted }]}>Tel: {appt.shopId.phone}</Text>
            )}
          </View>
        </View>

        <View style={styles.servicesSection}>
          <Text style={[styles.servicesTitle, { color: colors.primary }]}>Dịch vụ</Text>
          {services.map((svc: any, idx: number) => {
            const name = typeof svc === 'object' ? svc.name : svc;
            const price = typeof svc === 'object' ? svc.price : null;
            const dur = typeof svc === 'object' ? svc.duration : null;
            return (
              <View key={idx} style={styles.serviceRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  {typeof svc === 'object' && !!svc.image && (
                    <ImageBackground source={{ uri: svc.image }} style={styles.serviceImage} imageStyle={{ borderRadius: 8 }} />
                  )}
                  <View>
                    <Text style={[styles.serviceName, { color: colors.primary }]}>{name}</Text>
                    <Text style={[styles.serviceMeta, { color: colors.muted }]}>{dur ? `${dur} phút` : ''}</Text>
                  </View>
                </View>
                <Text style={[styles.servicePrice, { color: colors.secondary }]}>
                  {price ? `${price.toLocaleString()}đ` : ''}
                </Text>
              </View>
            );
          })}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.muted }]}>TỔNG CỘNG</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>
              {(appt.totalPrice ?? 0).toLocaleString()}đ
            </Text>
          </View>
        </View>

        {!!appt.note && (
          <View style={[styles.noteBox, { backgroundColor: theme === 'dark' ? colors.surfaceAlt : colors.surface }]}>
            <MaterialIcons name="sticky-note-2" size={16} color={colors.secondary} />
            <Text style={[styles.noteText, { color: colors.muted }]}>{appt.note}</Text>
          </View>
        )}

        <View style={[styles.notice, { backgroundColor: theme === 'dark' ? colors.surfaceHigh : colors.surface }]}>
          <Text style={[styles.noticeText, { color: colors.muted }]}>Vui lòng đến sớm 5 phút để được phục vụ tốt nhất.</Text>
        </View>

        {isActive && (
          <View style={styles.actionsContainer}>
            {(isCustomer || isManagerOrStaff) && (
              <TouchableOpacity
                style={[styles.outlineBtn, { borderColor: colors.error }]}
                activeOpacity={0.75}
                disabled={updating}
                onPress={() => handleUpdateStatus('CANCELLED', 'Bạn có chắc muốn hủy lịch hẹn này không?')}
              >
                {updating ? <ActivityIndicator color={colors.error} /> : <Text style={[styles.outlineText, { color: colors.error }]}>Hủy lịch hẹn</Text>}
              </TouchableOpacity>
            )}

            {isManagerOrStaff && (
              <>
                <TouchableOpacity
                  style={[styles.outlineBtn, { borderColor: '#6D4C41', marginTop: 12 }]}
                  activeOpacity={0.75}
                  disabled={updating}
                  onPress={() => handleUpdateStatus('NO_SHOW', 'Xác nhận khách không đến?')}
                >
                  {updating ? <ActivityIndicator color="#6D4C41" /> : <Text style={[styles.outlineText, { color: '#6D4C41' }]}>Đánh dấu khách không đến</Text>}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.filledBtn, { backgroundColor: '#1565C0', marginTop: 12 }]}
                  activeOpacity={0.75}
                  disabled={updating}
                  onPress={() => handleUpdateStatus('COMPLETED', 'Xác nhận đơn này đã hoàn thành?')}
                >
                  {updating ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.filledText}>Đánh dấu hoàn thành</Text>}
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  topTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Fonts.headline,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 14,
  },
  idLabel: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
  },
  idValue: {
    fontSize: 26,
    fontWeight: '700',
    fontFamily: Fonts.headline,
  },
  statusPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  hero: {
    height: 180,
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  heroImage: {
    borderRadius: 18,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  heroCaption: {
    color: '#FFFFFF',
    fontSize: 12,
    margin: 12,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  timeValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  timeDate: {
    fontSize: 13,
    marginTop: 4,
  },
  doubleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  smallCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    gap: 6,
  },
  smallLabel: {
    fontSize: 10,
    letterSpacing: 1.4,
    fontWeight: '700',
  },
  smallValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  smallSub: {
    fontSize: 11,
  },
  servicesSection: {
    marginTop: 6,
    marginBottom: 18,
  },
  servicesTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Fonts.headline,
    textAlign: 'center',
    marginBottom: 12,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
  },
  serviceMeta: {
    fontSize: 11,
    marginTop: 4,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '700',
  },
  serviceImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 11,
    letterSpacing: 1.6,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  noteText: {
    fontSize: 12,
    flex: 1,
  },
  notice: {
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  noticeText: {
    fontSize: 11,
    textAlign: 'center',
  },
  actionsContainer: {
    marginTop: 8,
  },
  outlineBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  outlineText: { fontWeight: '700', fontSize: 14 },
  filledBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  filledText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
