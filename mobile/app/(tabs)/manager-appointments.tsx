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
              <TouchableOpacity
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
              </TouchableOpacity>
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
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.secondary }]}>DANH SÁCH LỊCH HẸN ({shopAppointments.length})</Text>
            {shopAppointments.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.muted }]}>Không có lịch hẹn cho ngày này</Text>
            ) : (
              shopAppointments.map((appt, idx) => (
                <TouchableOpacity
                  key={appt._id || idx}
                  style={[styles.apptCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => router.push(`/appointment/${appt._id}` as any)}
                >
                  <View style={styles.apptHeader}>
                    <Text style={[styles.customerName, { color: colors.primary }]}>{appt.userId?.fullName || 'Khách vãng lai'}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[appt.status] + '20' }]}>
                      <Text style={[styles.statusText, { color: STATUS_COLOR[appt.status] }]}>{STATUS_LABEL[appt.status]}</Text>
                    </View>
                  </View>
                  <Text style={[styles.serviceName, { color: colors.secondary }]}>{appt.serviceId?.name}</Text>
                  <View style={styles.apptFooter}>
                    <View style={styles.timeRow}>
                      <MaterialIcons name="schedule" size={14} color={colors.secondary} />
                      <Text style={[styles.timeText, { color: colors.secondary }]}>{appt.startTime}</Text>
                    </View>
                    <Text style={[styles.priceText, { color: colors.primary }]}>{appt.totalPrice?.toLocaleString()}đ</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
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
  section: {
    paddingTop: 10,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  apptCard: {
    borderRadius: 15,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  apptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  serviceName: {
    fontSize: 14,
    marginBottom: 12,
  },
  apptFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 13,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
});
