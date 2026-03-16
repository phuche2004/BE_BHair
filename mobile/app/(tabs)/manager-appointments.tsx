import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, DeviceEventEmitter } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { appointmentApi } from '../../api/appointment.api';
import { shopApi } from '../../api/shop.api';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';
import { MaterialIcons } from '@expo/vector-icons';
import { HeaderMenu } from '../../components/ui/header-menu';
import { HapticTouch } from '../../components/ui/haptic-touch';

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

export default function ManagerAppointmentsScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { user } = useAuthStore();
  const router = useRouter();

  const days = getNext7Days();
  const [selectedDate, setSelectedDate] = useState(days[0]);
  const [slots, setSlots] = useState<any[]>([]);
  const [shopAppointments, setShopAppointments] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [loadingAppts, setLoadingAppts] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSlots = useCallback(async (date: string) => {
    const shopId = (user as any)?.shopId;
    if (!shopId) {
      setLoadingSlots(false);
      return;
    }
    try {
      setLoadingSlots(true);
      const slotsRes = await shopApi.getShopSlots(shopId, date);
      const rawSlots = Array.isArray(slotsRes) ? slotsRes : slotsRes.slots ?? slotsRes.data?.slots ?? slotsRes.data ?? [];
      setSlots(rawSlots);
    } catch (error) {
      console.error('Failed to fetch slots:', error);
    } finally {
      setLoadingSlots(false);
    }
  }, [user]);

  const fetchAppointments = useCallback(async () => {
    const shopId = (user as any)?.shopId;
    if (!shopId) {
      setLoadingAppts(false);
      return;
    }
    try {
      setLoadingAppts(true);
      const res = await appointmentApi.getShopAppointments(shopId);
      const all = Array.isArray(res) ? res : res.data || [];
      const filtered = all.filter((a: any) => (a.date || '').startsWith(selectedDate));
      setShopAppointments(filtered);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      setShopAppointments([]);
    } finally {
      setLoadingAppts(false);
      setRefreshing(false);
    }
  }, [user, selectedDate]);

  const fetchAllData = useCallback(async (date: string) => {
    await Promise.all([
      fetchSlots(date),
      fetchAppointments(),
    ]);
  }, [fetchSlots, fetchAppointments]);

  const extractTimeFromISO = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  useFocusEffect(
    useCallback(() => {
      fetchAllData(selectedDate);
    }, [selectedDate, fetchAllData])
  );

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('APP_REFRESH_SCREEN', () => {
      fetchAllData(selectedDate);
    });
    return () => sub.remove();
  }, [selectedDate, fetchAllData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData(selectedDate);
  };

  const STATUS_LABEL: Record<string, string> = {
    PENDING: 'Đang chờ',
    CONFIRMED: 'Đã xác nhận',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
    NO_SHOW: 'Không đến',
  };

  const STATUS_COLOR: Record<string, string> = {
    PENDING: colors.warning,
    CONFIRMED: colors.secondary,
    COMPLETED: colors.success,
    CANCELLED: colors.error,
    NO_SHOW: colors.muted,
  };

  const apptsByTime: Record<string, any[]> = {};
  shopAppointments.forEach(appt => {
    const timeStr = appt.startTime || extractTimeFromISO(appt.bookingDate || appt.date);
    if (!apptsByTime[timeStr]) apptsByTime[timeStr] = [];
    apptsByTime[timeStr].push(appt);
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.topBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={[styles.brand, { color: colors.primary }]}>B_Hair</Text>
          <View style={{ width: 1, height: 14, backgroundColor: colors.border }} />
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.secondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Quản lý lịch hẹn
          </Text>
        </View>
        <HeaderMenu />
      </View>

      <View style={styles.dateSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>
          {days.map((date) => {
            const isSelected = selectedDate === date;
            const d = new Date(date);
            return (
              <HapticTouch
                key={date}
                style={[
                  styles.dateItem,
                  { backgroundColor: isSelected ? colors.primary : colors.surface, borderColor: colors.border },
                ]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[styles.dateDay, { color: isSelected ? colors.onPrimary : colors.secondary }]}>
                  {d.toLocaleDateString('vi-VN', { weekday: 'short' })}
                </Text>
                <Text style={[styles.dateNum, { color: isSelected ? colors.onPrimary : colors.primary }]}>
                  {d.getDate()}
                </Text>
              </HapticTouch>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {loadingAppts || loadingSlots ? (
          <ActivityIndicator style={styles.loader} color={colors.primary} />
        ) : (
          <View style={styles.timeline}>
            {slots.map((slot, idx) => {
              const timeStr = slot.time;
              const appts = apptsByTime[timeStr] || [];
              const isPast = new Date(`${selectedDate}T${timeStr}`) < new Date();

              return (
                <View key={idx} style={styles.timeSlot}>
                  <View style={styles.timeColumn}>
                    <Text style={[styles.timeLabel, { color: isPast ? colors.muted : colors.primary }]}>{timeStr}</Text>
                  </View>
                  <View style={[styles.slotContent, { borderLeftColor: colors.border }]}>
                    {appts.length > 0 ? (
                      appts.map((appt, aIdx) => (
                        <HapticTouch
                          key={aIdx}
                          style={[styles.apptCard, { backgroundColor: colors.surface, borderColor: colors.primary + '30' }]}
                          onPress={() => router.push(`/appointment/${appt._id}` as any)}
                        >
                          <View style={styles.cardInfo}>
                              <View style={styles.nameRow}>
                                <Text style={[styles.customerName, { color: colors.primary }]}>
                                  {appt.customerName || appt.userId?.fullName || 'Khách vãng lai'}
                                </Text>
                                <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[appt.status] || colors.primary }]} />
                              </View>
                              <Text style={[styles.customerContact, { color: colors.muted }]}>
                                {appt.customerPhone || appt.userId?.phoneNumber || appt.userId?.email || 'N/A'}
                              </Text>
                              <Text style={[styles.serviceName, { color: colors.secondary }]}>{appt.serviceId?.name}</Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[appt.status] + '20' }]}>
                              <Text style={[styles.statusText, { color: STATUS_COLOR[appt.status] }]}>{STATUS_LABEL[appt.status]}</Text>
                            </View>
                        </HapticTouch>
                      ))
                    ) : (
                      <View style={[styles.emptySlot, { borderColor: colors.border + '20' }]}>
                          <View style={[styles.emptyLine, { backgroundColor: colors.border + '15' }]} />
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
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
  dateSelector: {
    marginBottom: 10,
  },
  dateScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  dateItem: {
    width: 60,
    height: 80,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dateDay: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateNum: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loader: {
    marginTop: 40,
  },
  timeline: {
    paddingTop: 10,
    paddingBottom: 40,
  },
  timeSlot: {
    flexDirection: 'row',
    minHeight: 80,
  },
  timeColumn: {
    width: 60,
    paddingTop: 10,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  slotContent: {
    flex: 1,
    borderLeftWidth: 1,
    paddingLeft: 16,
    paddingBottom: 16,
  },
  apptCard: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
  },
  customerContact: {
    fontSize: 12,
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  serviceName: {
    fontSize: 13,
    marginTop: 2,
  },
  emptySlot: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  emptyLine: {
    height: 1,
    width: '100%',
    borderRadius: 1,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
});
