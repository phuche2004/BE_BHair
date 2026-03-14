import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  DeviceEventEmitter,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Fonts } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { axiosInstance } from '../../api';
import { shopApi } from '../../api/shop.api';
import { appointmentApi } from '../../api/appointment.api';
import { useTranslation } from '../../hooks/useTranslation';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { HeaderMenu } from '../../components/ui/header-menu';

interface ShopInfo {
  slotDuration: number;
  openTime: string;
  closeTime: string;
}

interface Service {
  _id: string;
  name: string;
  duration: number;
  price: number;
}

interface SlotItem {
  time: string;
  available: boolean;
  bookedCount: number;
  totalCapacity: number;
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getNext7Days(): string[] {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return toDateStr(d);
  });
}

const DAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export default function BookingScreen() {
  const { shopId, serviceId: paramServiceId } = useLocalSearchParams<{ shopId: string; serviceId?: string }>();
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { t } = useTranslation();
  const primaryText = colors.onPrimary; // Use standardized onPrimary for better contrast on primary colors

  const days = getNext7Days();
  const insets = useSafeAreaInsets();

  const [shop, setShop] = useState<ShopInfo | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [slotsMap, setSlotsMap] = useState<Record<string, SlotItem[]>>({});
  const [selectedDate, setSelectedDate] = useState<string>(days[0]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [loadingShop, setLoadingShop] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [activeBooking, setActiveBooking] = useState<any | null>(null);
  const [checkingActive, setCheckingActive] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setCheckingActive(true);
        const res = await appointmentApi.getMyAppointments();
        const all: any[] = res.data ?? res ?? [];
        const active = all.find((a: any) => a.status === 'PENDING' || a.status === 'CONFIRMED');

        if (active) {
          setActiveBooking(active);
          Alert.alert(
            'Cảnh báo đặt lịch',
            `Bạn đang có lịch đặt chưa hoàn thành (Trạng thái: ${active.status}).\n\nBạn cần hoàn thành hoặc hủy lịch hiện tại trước khi tiếp tục đặt lịch mới.`,
            [
              { text: 'Đóng', style: 'cancel' },
              { text: 'Xem lịch hiện tại', isPreferred: true, onPress: () => router.replace('/(tabs)/appointments' as any) }
            ]
          );
        } else {
          setActiveBooking(null);
        }
      } catch {
        setActiveBooking(null);
      } finally {
        setCheckingActive(false);
      }
    })();
  }, []);

  const fetchShopAndServices = async () => {
    if (!shopId) return;
    try {
      setLoadingShop(true);
      const res = await shopApi.getShopDetails(shopId);
      const data = res.data ?? res;
      setShop({
        slotDuration: data.slotDuration ?? 30,
        openTime: data.openTime ?? '09:00',
        closeTime: data.closeTime ?? '21:00',
      });

      const sRes = await shopApi.getShopServices(shopId);
      const list: Service[] = sRes.data ?? sRes ?? [];
      setServices(list);
      if (paramServiceId) {
        const found = list.find(s => s._id === paramServiceId);
        if (found) setSelectedService(found);
      } else if (list.length === 1) {
        setSelectedService(list[0]);
      }
    } catch (e) {
      console.error('Failed to load shop/services', e);
      // Ensure we don't hang if fetch fails
      setShop(prev => prev || { slotDuration: 30, openTime: '09:00', closeTime: '21:00' });
    } finally {
      setLoadingShop(false);
    }
  };

  useEffect(() => {
    fetchShopAndServices();
  }, [shopId]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('APP_REFRESH_SCREEN', () => {
      fetchShopAndServices();
    });
    return () => sub.remove();
  }, [shopId]);

  const fetchingRef = useRef<Set<string>>(new Set());
  const fetchedRef = useRef<Set<string>>(new Set());

  const fetchSlots = useCallback(async (date: string) => {
    if (!shopId) return;
    if (fetchingRef.current.has(date) || fetchedRef.current.has(date)) return;
    fetchingRef.current.add(date);
    setLoadingSlots(prev => new Set(prev).add(date));
    try {
      const res = await shopApi.getShopSlots(shopId, date);
      const raw: SlotItem[] = Array.isArray(res) ? res : res.slots ?? res.data?.slots ?? res.data ?? [];
      fetchedRef.current.add(date);
      setSlotsMap(prev => ({ ...prev, [date]: raw }));
    } catch (e) {
      console.error('[Slots] fetch error', e);
      setSlotsMap(prev => ({ ...prev, [date]: [] }));
    } finally {
      fetchingRef.current.delete(date);
      setLoadingSlots(prev => { const n = new Set(prev); n.delete(date); return n; });
    }
  }, [shopId]);

  useEffect(() => {
    if (!shop) return;
    days.forEach(d => fetchSlots(d));
  }, [shop]);

  const slotDuration = shop?.slotDuration ?? 30;
  const slotsNeeded = selectedService ? Math.ceil(selectedService.duration / slotDuration) : 1;
  const currentSlots: SlotItem[] = slotsMap[selectedDate] ?? [];
  const isLoadingCurrentDay = loadingSlots.has(selectedDate);

  type SlotState = 'selected' | 'covered' | 'available' | 'booked';

  const getSlotState = (slotTime: string, slotIdx: number): SlotState => {
    if (!selectedTime) {
      return currentSlots[slotIdx]?.available ? 'available' : 'booked';
    }
    const startIdx = currentSlots.findIndex(s => s.time === selectedTime);
    if (slotIdx === startIdx) return 'selected';
    if (slotIdx > startIdx && slotIdx < startIdx + slotsNeeded) return 'covered';
    return currentSlots[slotIdx]?.available ? 'available' : 'booked';
  };

  const handleConfirm = async () => {
    if (!selectedService) { Alert.alert(t('booking.incomplete'), t('booking.selectServiceMsg')); return; }
    if (!selectedTime) { Alert.alert(t('booking.incomplete'), t('booking.selectTimeMsg')); return; }
    try {
      setSubmitting(true);
      await axiosInstance.post('/appointment', {
        shopId,
        serviceIds: [selectedService._id],
        barberId: null,
        bookingDate: `${selectedDate}T${selectedTime}:00+07:00`,
        note: '',
      });
      Alert.alert(t('booking.bookingConfirmed'), t('booking.bookingSuccessMsg'), [
        { text: t('booking.viewAppointments'), onPress: () => router.replace('/(tabs)/appointments' as any) },
        { text: t('booking.done'), onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert(t('auth.error'), error.response?.data?.message || t('booking.bookFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingShop || checkingActive) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
    );
  }

  const isDark = theme === 'dark';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <MaterialIcons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={[styles.brand, { color: colors.primary }]}>B_Hair</Text>
          <View style={{ width: 1, height: 14, backgroundColor: colors.border }} />
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.secondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Đặt lịch
          </Text>
        </View>
        <HeaderMenu />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 180 }} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.secondary }]}>{t('booking.selectService')}</Text>
          {services.length === 0 ? (
            <Text style={{ color: colors.muted, fontSize: 13 }}>{t('booking.noServices')}</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {services.map(svc => {
                const sel = selectedService?._id === svc._id;
                return (
                  <TouchableOpacity
                    key={svc._id}
                    style={[styles.chip, {
                      backgroundColor: sel ? colors.primary : isDark ? colors.surfaceAlt : colors.cardAlt,
                      borderColor: sel ? colors.primary : colors.border,
                    }]}
                    onPress={() => { setSelectedService(svc); setSelectedTime(''); }}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.chipName, { color: sel ? colors.onPrimary : colors.primary }]}>{svc.name}</Text>
                    <Text style={[styles.chipMeta, { color: sel ? (isDark ? `${colors.onPrimary}CC` : '#F0F0F0') : colors.muted }]}>
                      {svc.duration} {t('booking.mins')} · {svc.price.toLocaleString()}đ
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
          {selectedService && (
            <Text style={[styles.hint, { color: colors.muted }]}>
              {selectedService.name} · {selectedService.duration} phút
            </Text>
          )}
        </View>

        <View style={styles.dayPickerWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayPickerContent}>
            {days.map(date => {
              const d = new Date(date + 'T00:00:00');
              const sel = date === selectedDate;
              return (
                <TouchableOpacity
                  key={date}
                  style={[styles.dayTab, {
                    backgroundColor: sel ? colors.primary : isDark ? colors.surfaceAlt : colors.surface,
                    borderColor: sel ? colors.primary : colors.border,
                  }]}
                  onPress={() => { setSelectedDate(date); setSelectedTime(''); }}
                >
                  <Text style={[styles.dayTabName, { color: sel ? colors.onPrimary : colors.muted }]}>
                    {date === days[0] ? 'Nay' : DAY_NAMES[d.getDay()]}
                  </Text>
                  <Text style={[styles.dayTabNum, { color: sel ? colors.onPrimary : colors.primary }]}>
                    {d.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.primary }]}>THỜI GIAN KHẢ DỤNG</Text>

        {isLoadingCurrentDay ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.secondary} />
            <Text style={{ color: colors.muted, marginTop: 8, fontSize: 13 }}>Đang tải khung giờ...</Text>
          </View>
        ) : currentSlots.length === 0 ? (
          <View style={styles.center}>
            <Text style={{ color: colors.muted, fontSize: 14 }}>Không có khung giờ nào.</Text>
          </View>
        ) : (
          <View style={styles.slotsList}>
            {currentSlots.map((slot, idx) => {
              const state = getSlotState(slot.time, idx);
              const isSelected = state === 'selected';
              const isCovered = state === 'covered';
              const isAvail = state === 'available';
              const isBooked = state === 'booked';
              const isBreak = isBooked && slot.bookedCount === 0;

              let bg = isDark ? colors.surfaceAlt : colors.surface;
              let border = colors.border;
              let timeColor = colors.primary;
              let labelColor = colors.muted;

              if (isSelected) {
                bg = colors.primary;
                border = colors.primary;
                timeColor = colors.onPrimary;
                labelColor = isDark ? `${colors.onPrimary}CC` : '#F0F0F0';
              } else if (isCovered) {
                bg = `${colors.primary}22`;
                border = `${colors.primary}66`;
                timeColor = colors.primary;
                labelColor = colors.primary;
              } else if (isAvail) {
                bg = isDark ? colors.surfaceHigh : colors.cardAlt;
                border = colors.border;
                timeColor = colors.primary;
                labelColor = colors.muted;
              }

              const canPress = isAvail || isSelected || isCovered;
              const capacity = slot.totalCapacity > 0
                ? `${slot.bookedCount}/${slot.totalCapacity}`
                : null;

              return (
                <TouchableOpacity
                  key={slot.time}
                  activeOpacity={canPress ? 0.7 : 1}
                  disabled={!canPress}
                  style={[
                    styles.slotRow,
                    {
                      backgroundColor: bg,
                      borderColor: border,
                    }
                  ]}
                  onPress={() => {
                    if (isSelected) {
                      setSelectedTime('');
                    } else if (isAvail || isCovered) {
                      setSelectedTime(slot.time);
                    }
                  }}
                >
                  {/* Left: Time */}
                  <Text style={[styles.slotTime, { color: timeColor }]}>{slot.time}</Text>

                  {/* Middle: Status label or current selection info */}
                  <View style={styles.slotMain}>
                    {isSelected ? (
                      <Text style={[styles.slotLabel, { color: labelColor, fontWeight: '700' }]}>
                        {selectedService?.name || 'Đã chọn'}
                      </Text>
                    ) : (
                      <Text style={[styles.slotLabel, { color: labelColor }]}>
                        {isCovered ? 'Thời gian ước tính dịch vụ của bạn' : isBreak ? 'Giờ nghỉ trưa' : isBooked ? 'Hết chỗ' : capacity ? `Còn ${capacity} chỗ` : 'Sẵn sàng'}
                      </Text>
                    )}
                  </View>

                  {/* Right: Badge or Checkmark */}
                  {isSelected ? (
                    <View style={[styles.checkCircle, { backgroundColor: primaryText }]}>
                      <MaterialIcons name="check" size={16} color={colors.primary} />
                    </View>
                  ) : capacity && !isCovered && !isBooked ? (
                    <View style={[styles.capacityBadge, { backgroundColor: isDark ? colors.surfaceAlt : colors.surface }]}>
                      <Text style={[styles.capacityText, { color: colors.primary }]}>{capacity}</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom + 12 }]}>
        {selectedTime && selectedService && (
          <View style={styles.summaryRow}>
            <View>
              <Text style={[styles.summaryService, { color: colors.primary }]}>{selectedService.name}</Text>
              <Text style={[styles.summaryDT, { color: colors.muted }]}>
                {selectedDate} · {selectedTime}
              </Text>
            </View>
            <View style={[styles.summaryBadge, { backgroundColor: colors.surfaceAlt }]}>
              <Text style={[styles.summaryBadgeText, { color: colors.primary }]}>{selectedService.duration} phút</Text>
            </View>
          </View>
        )}
        <TouchableOpacity
          style={[styles.confirmBtn, {
            backgroundColor: (!activeBooking && selectedTime && selectedService) ? colors.primary : colors.surfaceHigh,
          }]}
          disabled={!!activeBooking || !selectedTime || !selectedService || submitting}
          onPress={handleConfirm}
          activeOpacity={0.85}
        >
          {submitting
            ? <ActivityIndicator color={primaryText} />
            : <Text style={[styles.confirmTxt, { color: (!activeBooking && selectedTime && selectedService) ? primaryText : colors.muted }]}>{t('booking.confirm')}</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Fonts.headline,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    fontFamily: Fonts.headline,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 6,
  },
  section: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  sectionLabel: { fontSize: 12, fontWeight: '700', marginBottom: 8, letterSpacing: 1.4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 10,
    minWidth: 110,
  },
  chipName: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  chipMeta: { fontSize: 11 },
  hint: { marginTop: 6, fontSize: 11, fontStyle: 'italic' },
  dayPickerWrap: { paddingHorizontal: 12, paddingBottom: 8 },
  dayPickerContent: { paddingHorizontal: 8, paddingVertical: 6, gap: 8 },
  dayTab: {
    width: 54, height: 66, borderRadius: 16, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  dayTabName: { fontSize: 10, fontWeight: '700' },
  dayTabNum: { fontSize: 18, fontWeight: '800', marginTop: 2 },
  sectionTitle: {
    paddingHorizontal: 20,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 12,
    marginTop: 6,
  },
  slotsList: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 8,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  slotTime: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 55,
  },
  slotMain: {
    flex: 1,
    paddingHorizontal: 12,
  },
  slotLabel: {
    fontSize: 13,
  },
  capacityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  capacityText: {
    fontSize: 11,
    fontWeight: '700',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    padding: 12,
    borderTopWidth: 1,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryService: { fontSize: 14, fontWeight: '700' },
  summaryDT: { fontSize: 11, marginTop: 2 },
  summaryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  summaryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  confirmBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  confirmTxt: { fontSize: 15, fontWeight: '700' },
});
