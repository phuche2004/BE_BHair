import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { useTranslation } from '../../hooks/useTranslation';
import { appointmentApi } from '../../api/appointment.api';
import { shopApi } from '../../api/shop.api';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';

// ─── Types & Helpers ──────────────────────────────────────────────────────────

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

function extractTimeFromISO(isoStr: string) {
    const d = new Date(isoStr);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

const DAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

// ─── Component ────────────────────────────────────────────────────────────────
export default function StaffAppointmentsScreen() {
    const theme = useColorScheme() ?? 'light';
    const colors = Colors[theme];
    const { t } = useTranslation();
    const router = useRouter();
    const user: any = useAuthStore((state) => state.user);
    const isDark = theme === 'dark';

    const days = getNext7Days();

    // ─── State ────────────────────────────────────────────────────────────────
    const [selectedDate, setSelectedDate] = useState<string>(days[0]);
    const [shopAppointments, setShopAppointments] = useState<any[]>([]);
    const [slots, setSlots] = useState<any[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [loadingAppts, setLoadingAppts] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // ─── Data Fetching ────────────────────────────────────────────────────────
    const fetchAllData = useCallback(async (date: string) => {
        if (!user?.shopId) {
            setLoadingSlots(false);
            setLoadingAppts(false);
            return;
        }

        try {
            setLoadingSlots(true);
            setLoadingAppts(true);

            // Fetch base time slots for the shop to build the grid
            const slotsRes = await shopApi.getShopSlots(user.shopId, date);
            const rawSlots = Array.isArray(slotsRes) ? slotsRes : slotsRes.slots ?? slotsRes.data?.slots ?? slotsRes.data ?? [];
            setSlots(rawSlots);

            // Fetch ALL appointments for the shop
            const apptsRes = await appointmentApi.getShopAppointments(user.shopId);
            setShopAppointments(apptsRes || []);

        } catch (error) {
            console.error('Failed to fetch schedule grid data:', error);
        } finally {
            setLoadingSlots(false);
            setLoadingAppts(false);
            setRefreshing(false);
        }
    }, [user?.shopId]);

    useFocusEffect(
        useCallback(() => {
            fetchAllData(selectedDate);
        }, [selectedDate, fetchAllData])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchAllData(selectedDate);
    };

    // ─── Data Processing ──────────────────────────────────────────────────────
    const STATUS_LABEL: Record<string, string> = {
        PENDING: '⏳ Chờ xác nhận',
        CONFIRMED: '✅ Đã xác nhận',
        COMPLETED: '🎉 Hoàn thành',
        CANCELLED: '❌ Đã hủy',
        NO_SHOW: '🚫 Không đến',
    };

    const STATUS_COLOR: Record<string, string> = {
        PENDING: '#E65100',
        CONFIRMED: '#2E7D32',
        COMPLETED: '#1565C0',
        CANCELLED: '#B71C1C',
        NO_SHOW: '#6D4C41',
    };

    // Lọc ra các lịch trùng với Ngày đã chọn
    const activeApptsForDay = shopAppointments.filter(appt => {
        const d = new Date(appt.bookingDate);
        const vnDateStr = toDateStr(d);
        return vnDateStr === selectedDate;
    });

    // Gom lịch hẹn vào Dictionary theo giờ
    const apptsByTime: Record<string, any[]> = {};
    activeApptsForDay.forEach(appt => {
        const timeStr = extractTimeFromISO(appt.bookingDate);
        if (!apptsByTime[timeStr]) apptsByTime[timeStr] = [];
        // Optional: Filter only appointments where Staff == user._id ? 
        // For now, render all appointments in the shop for staff visibility, or do `if (appt.barberId?._id === user._id)` to strict-filter.
        apptsByTime[timeStr].push(appt);
    });

    // ─── Render Components ────────────────────────────────────────────────────

    const renderDayPicker = () => (
        <View style={[styles.dayPickerWrap, { borderBottomColor: colors.secondary + '30' }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayPickerContent}>
                {days.map(date => {
                    const d = new Date(date + 'T00:00:00');
                    const sel = date === selectedDate;
                    return (
                        <TouchableOpacity
                            key={date}
                            style={[styles.dayTab, {
                                backgroundColor: sel ? colors.primary : 'transparent',
                                borderColor: sel ? colors.primary : colors.secondary + '60',
                            }]}
                            onPress={() => setSelectedDate(date)}
                        >
                            <Text style={[styles.dayTabName, { color: sel ? '#FFF' : colors.icon }]}>
                                {date === days[0] ? 'Nay' : DAY_NAMES[d.getDay()]}
                            </Text>
                            <Text style={[styles.dayTabNum, { color: sel ? '#FFF' : colors.text }]}>
                                {d.getDate()}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );

    const renderAppointmentCard = (appt: any) => {
        const isActive = appt.status === 'PENDING' || appt.status === 'CONFIRMED';
        const customerName = appt.customerId?.fullName || 'Khách vãng lai';
        const customerPhone = appt.customerId?.phoneNumber || '';

        // Highlight logic in case this is specifically THEIR appointment
        const isMyAppointment = appt.barberId && typeof appt.barberId === 'object' && appt.barberId._id === user._id;

        const serviceNames = (appt.serviceIds ?? []).map((s: any) =>
            typeof s === 'object' && s !== null ? s.name : s
        ).filter(Boolean).join(', ') || `${(appt.serviceIds ?? []).length} dịch vụ`;

        return (
            <TouchableOpacity
                key={appt._id}
                activeOpacity={0.7}
                onPress={() => router.push(`/appointment/${appt._id}` as any)}
                style={[styles.apptCard, {
                    backgroundColor: isMyAppointment ? colors.primary + '18' : (isDark ? '#3E2723' : '#FFF'),
                    borderColor: isMyAppointment ? colors.primary : STATUS_COLOR[appt.status] + '50',
                    borderLeftWidth: 4,
                    borderLeftColor: STATUS_COLOR[appt.status] || colors.primary,
                    opacity: isActive ? 1 : 0.65
                }]}
            >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: STATUS_COLOR[appt.status] }}>
                        {STATUS_LABEL[appt.status] || appt.status}
                    </Text>
                    {isMyAppointment && (
                        <View style={{ backgroundColor: colors.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFF' }}>CỦA BẠN</Text>
                        </View>
                    )}
                </View>

                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 4 }}>
                    {serviceNames}
                </Text>

                <Text style={{ fontSize: 13, color: colors.icon }}>
                    👤 Khách: <Text style={{ color: colors.text, fontWeight: '500' }}>{customerName}</Text> {customerPhone ? `(${customerPhone})` : ''}
                </Text>
            </TouchableOpacity>
        );
    }

    const renderGrid = () => {
        if (loadingSlots || loadingAppts) {
            return (
                <View style={[styles.center, { flex: 1 }]}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={{ color: colors.icon, marginTop: 8 }}>Đang phân tích lưới thời gian...</Text>
                </View>
            );
        }

        if (slots.length === 0) {
            return (
                <View style={[styles.center, { flex: 1 }]}>
                    <Text style={{ color: colors.icon }}>Tiệm chưa mở cửa hoặc chưa thiết lập khung giờ lịch hẹn.</Text>
                </View>
            );
        }

        return (
            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 16 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            >
                {slots.map((slot, idx) => {
                    const isBookedFull = !slot.available;
                    const isBreak = isBookedFull && slot.bookedCount === 0;
                    const hourAppts = apptsByTime[slot.time] || [];

                    let rowBg = isDark ? '#2D2320' : '#F5F2EF';
                    let timeColor = colors.icon;

                    if (hourAppts.length > 0) {
                        rowBg = colors.primary + '11';
                        timeColor = colors.primary;
                    } else if (isBookedFull) {
                        rowBg = colors.secondary + '20';
                    }

                    return (
                        <View key={`${slot.time}-${idx}`} style={{ flexDirection: 'row', marginBottom: 12, paddingHorizontal: 16 }}>
                            {/* Cột Trái: Giờ */}
                            <View style={{ width: 60, alignItems: 'center', paddingTop: 8 }}>
                                <Text style={{ fontSize: 15, fontWeight: '700', color: timeColor }}>{slot.time}</Text>
                            </View>

                            {/* Cột Phải: Sự kiện */}
                            <View style={{ flex: 1, paddingLeft: 12, borderLeftWidth: 1, borderLeftColor: colors.secondary + '40' }}>
                                {hourAppts.length > 0 ? (
                                    hourAppts.map(appt => renderAppointmentCard(appt))
                                ) : (
                                    <View style={[styles.emptySlot, { backgroundColor: rowBg, borderColor: colors.secondary + '30' }]}>
                                        <Text style={{ color: colors.icon, fontSize: 13 }}>
                                            {isBreak ? '☕ Giờ nghỉ' : (isBookedFull ? 'Đã kín lịch' : 'Trống')}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    );
                })}
            </ScrollView>
        );
    }

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Lưới Lịch (Staff)</Text>
            </View>

            {renderDayPicker()}
            {renderGrid()}

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    center: { justifyContent: 'center', alignItems: 'center', padding: 20 },

    header: { padding: 20, paddingTop: 10, paddingBottom: 10 },
    title: { fontSize: 24, fontWeight: 'bold' },

    dayPickerWrap: { borderBottomWidth: 1 },
    dayPickerContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
    dayTab: {
        width: 54, height: 60, borderRadius: 12, borderWidth: 1.5,
        alignItems: 'center', justifyContent: 'center',
    },
    dayTabName: { fontSize: 11, fontWeight: '600' },
    dayTabNum: { fontSize: 18, fontWeight: '800', marginTop: 2 },

    emptySlot: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 60,
    },
    apptCard: {
        padding: 14,
        borderRadius: 10,
        borderWidth: 1,
        marginBottom: 8,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 1,
    }
});
