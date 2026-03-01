import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { axiosInstance } from '../../api';
import { shopApi } from '../../api/shop.api';
import { appointmentApi } from '../../api/appointment.api';
import { useTranslation } from '../../hooks/useTranslation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShopInfo {
    slotDuration: number; // phút
    openTime: string;     // "09:00"
    closeTime: string;    // "21:00"
}

interface Service {
    _id: string;
    name: string;
    duration: number; // phút
    price: number;
}

/** Trả về từ BE: GET /shop/:shopId/slots */
interface SlotItem {
    time: string;          // "09:00"
    available: boolean;    // còn chỗ không (bookedCount < totalCapacity)
    bookedCount: number;
    totalCapacity: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
const { width: SCREEN_W } = Dimensions.get('window');

// ─── Component ────────────────────────────────────────────────────────────────
export default function BookingScreen() {
    const { shopId, serviceId: paramServiceId } = useLocalSearchParams<{ shopId: string; serviceId?: string }>();
    const router = useRouter();
    const theme = useColorScheme() ?? 'light';
    const colors = Colors[theme];
    const { t } = useTranslation();

    const days = getNext7Days();

    // ─── State ────────────────────────────────────────────────────────────────
    const [shop, setShop] = useState<ShopInfo | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [slotsMap, setSlotsMap] = useState<Record<string, SlotItem[]>>({});
    const [selectedDate, setSelectedDate] = useState<string>(days[0]);
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [loadingShop, setLoadingShop] = useState(true);
    const [loadingSlots, setLoadingSlots] = useState<Set<string>>(new Set());
    const [submitting, setSubmitting] = useState(false);
    /** Lịch active hiện tại của user (PENDINg/CONFIRMED) — nếu có thì block booking mới */
    const [activeBooking, setActiveBooking] = useState<any | null>(null);
    const [checkingActive, setCheckingActive] = useState(true);

    // ─── Check lịch active khi vào màn hình ──────────────────────────────────
    useEffect(() => {
        (async () => {
            try {
                setCheckingActive(true);
                const res = await appointmentApi.getMyAppointments();
                const all: any[] = res.data ?? res ?? [];
                const active = all.find(
                    (a: any) => a.status === 'PENDING' || a.status === 'CONFIRMED'
                );

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

    // ─── Fetch shop ───────────────────────────────────────────────────────────
    useEffect(() => {
        if (!shopId) return;
        (async () => {
            try {
                setLoadingShop(true);
                const res = await shopApi.getShopDetails(shopId);
                const data = res.data ?? res;
                setShop({
                    slotDuration: data.slotDuration ?? 30,
                    openTime: data.openTime ?? '09:00',
                    closeTime: data.closeTime ?? '21:00',
                });
            } catch {
                setShop({ slotDuration: 30, openTime: '09:00', closeTime: '21:00' });
            } finally {
                setLoadingShop(false);
            }
        })();
    }, [shopId]);

    // ─── Fetch services ───────────────────────────────────────────────────────
    useEffect(() => {
        if (!shopId) return;
        (async () => {
            try {
                const res = await shopApi.getShopServices(shopId);
                const list: Service[] = res.data ?? res ?? [];
                setServices(list);
                if (paramServiceId) {
                    const found = list.find(s => s._id === paramServiceId);
                    if (found) setSelectedService(found);
                } else if (list.length === 1) {
                    setSelectedService(list[0]);
                }
            } catch (e) {
                console.error('Failed to load services', e);
            }
        })();
    }, [shopId]);

    // ─── Fetch slots (lazy, dedup) ────────────────────────────────────────────
    const fetchingRef = useRef<Set<string>>(new Set());
    const fetchedRef = useRef<Set<string>>(new Set());

    const fetchSlots = useCallback(async (date: string) => {
        if (!shopId) return;
        if (fetchingRef.current.has(date) || fetchedRef.current.has(date)) return;
        fetchingRef.current.add(date);
        setLoadingSlots(prev => new Set(prev).add(date));
        try {
            const res = await shopApi.getShopSlots(shopId, date);
            // BE trả về Array<{ time, available, bookedCount, totalCapacity }>
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

    // Prefetch tất cả 7 ngày khi shop load xong
    useEffect(() => {
        if (!shop) return;
        days.forEach(d => fetchSlots(d));
    }, [shop]);

    // ─── Derived ──────────────────────────────────────────────────────────────
    const slotDuration = shop?.slotDuration ?? 30;
    const slotsNeeded = selectedService ? Math.ceil(selectedService.duration / slotDuration) : 1;

    /** Slots của ngày đang xem */
    const currentSlots: SlotItem[] = slotsMap[selectedDate] ?? [];
    const isLoadingCurrentDay = loadingSlots.has(selectedDate);

    /**
     * Trạng thái từng slot:
     * - 'selected'  : ô bắt đầu của lịch đang chọn
     * - 'covered'   : ô bị chiếm bởi service (span)
     * - 'available' : trống, có thể chọn
     * - 'booked'    : đã đầy
     */
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

    // ─── Booking ──────────────────────────────────────────────────────────────
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
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const isDark = theme === 'dark';
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>

            {/* ── Service chips ── */}
            <View style={[styles.section, { borderBottomColor: colors.secondary + '40' }]}>
                <Text style={[styles.sectionLabel, { color: colors.text }]}>{t('booking.selectService')}</Text>
                {services.length === 0 ? (
                    <Text style={{ color: colors.icon, fontSize: 13 }}>{t('booking.noServices')}</Text>
                ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {services.map(svc => {
                            const sel = selectedService?._id === svc._id;
                            return (
                                <TouchableOpacity
                                    key={svc._id}
                                    style={[styles.chip, {
                                        backgroundColor: sel ? colors.primary : isDark ? '#3E2723' : '#FFF',
                                        borderColor: sel ? colors.primary : colors.secondary,
                                    }]}
                                    onPress={() => { setSelectedService(svc); setSelectedTime(''); }}
                                >
                                    <Text style={[styles.chipName, { color: sel ? '#FFF' : colors.text }]}>{svc.name}</Text>
                                    <Text style={[styles.chipMeta, { color: sel ? '#FFE0B2' : colors.icon }]}>
                                        {svc.duration} {t('booking.mins')} · {svc.price.toLocaleString()}đ
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                )}
                {selectedService && (
                    <Text style={[styles.hint, { color: colors.icon }]}>
                        ⏱ {selectedService.name} · chiếm {slotsNeeded} ô · {slotsNeeded * slotDuration} phút
                    </Text>
                )}
            </View>

            {/* ── 7-day picker ── */}
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
                                onPress={() => { setSelectedDate(date); setSelectedTime(''); }}
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

            {/* ── Slot list (single day) ── */}
            {isLoadingCurrentDay ? (
                <View style={[styles.center, { flex: 1 }]}>
                    <ActivityIndicator color={colors.primary} />
                    <Text style={{ color: colors.icon, marginTop: 8, fontSize: 13 }}>Đang tải khung giờ...</Text>
                </View>
            ) : currentSlots.length === 0 ? (
                <View style={[styles.center, { flex: 1 }]}>
                    <Text style={{ color: colors.icon, fontSize: 14 }}>Không có khung giờ nào.</Text>
                </View>
            ) : (
                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 8 }}>
                    {currentSlots.map((slot, idx) => {
                        const state = getSlotState(slot.time, idx);
                        const isSelected = state === 'selected';
                        const isCovered = state === 'covered';
                        const isAvail = state === 'available';
                        const isBooked = state === 'booked';
                        const isBreak = isBooked && slot.bookedCount === 0;

                        // Màu nền theo state
                        let bg = isDark ? '#2D2320' : '#F5F2EF';
                        let border = colors.secondary + '30';
                        let timeColor = colors.icon;
                        let labelColor = colors.icon;

                        if (isSelected) {
                            bg = colors.primary;
                            border = colors.primary;
                            timeColor = '#FFF';
                            labelColor = '#FFE0B2';
                        } else if (isCovered) {
                            bg = colors.primary + '30';
                            border = colors.primary + '60';
                            timeColor = colors.primary;
                            labelColor = colors.primary;
                        } else if (isAvail) {
                            bg = isDark ? '#3E2723' : '#FDFAF7';
                            border = colors.secondary;
                            timeColor = colors.text;
                            labelColor = colors.icon;
                        }

                        const canPress = isAvail || isSelected;
                        const capacity = slot.totalCapacity > 0
                            ? `${slot.bookedCount}/${slot.totalCapacity}`
                            : null;

                        return (
                            <TouchableOpacity
                                key={slot.time}
                                activeOpacity={canPress ? 0.7 : 1}
                                disabled={!canPress}
                                style={[styles.slotRow, {
                                    backgroundColor: bg,
                                    borderColor: border,
                                    marginHorizontal: 16,
                                }]}
                                onPress={() => {
                                    if (isSelected) {
                                        setSelectedTime(''); // deselect
                                    } else if (isAvail) {
                                        setSelectedTime(slot.time);
                                    }
                                }}
                            >
                                {/* Thời gian */}
                                <Text style={[styles.slotTime, { color: timeColor }]}>{slot.time}</Text>

                                {/* Label trạng thái */}
                                <View style={{ flex: 1, paddingHorizontal: 12 }}>
                                    {isSelected && (
                                        <Text style={[styles.slotLabel, { color: labelColor }]}>
                                            {selectedService?.name} · {selectedService?.duration} {t('booking.mins')}
                                        </Text>
                                    )}
                                    {isCovered && (
                                        <Text style={[styles.slotLabel, { color: labelColor }]}>
                                            (đang chiếm bởi dịch vụ)
                                        </Text>
                                    )}
                                    {isBooked && !isBreak && (
                                        <Text style={[styles.slotLabel, { color: labelColor }]}>Đã đầy</Text>
                                    )}
                                    {isBreak && (
                                        <Text style={[styles.slotLabel, { color: labelColor }]}>☕ Giờ nghỉ trưa</Text>
                                    )}
                                </View>

                                {/* Capacity badge */}
                                {capacity && !isSelected && !isCovered ? (
                                    <View style={[styles.badge, {
                                        backgroundColor: isBooked
                                            ? colors.secondary + '30'
                                            : colors.primary + '20',
                                    }]}>
                                        <Text style={[styles.badgeTxt, {
                                            color: isBooked ? colors.icon : colors.primary
                                        }]}>
                                            {capacity}
                                        </Text>
                                    </View>
                                ) : isSelected ? (
                                    <Text style={{ color: '#FFF', fontSize: 18 }}>✓</Text>
                                ) : null}
                            </TouchableOpacity>
                        );
                    })}
                    <View style={{ height: 100 }} />
                </ScrollView>
            )}

            {/* ── Bottom bar ── */}
            <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.secondary + '40', paddingBottom: insets.bottom + 12 }]}>
                {selectedTime && selectedService && (
                    <View style={styles.summaryRow}>
                        <View>
                            <Text style={[styles.summaryService, { color: colors.text }]}>{selectedService.name}</Text>
                            <Text style={[styles.summaryDT, { color: colors.icon }]}>
                                {selectedDate} · {selectedTime}
                            </Text>
                        </View>
                        <Text style={[styles.summaryPrice, { color: colors.primary }]}>
                            {selectedService.price.toLocaleString()}đ
                        </Text>
                    </View>
                )}
                <TouchableOpacity
                    style={[styles.confirmBtn, {
                        backgroundColor: (!activeBooking && selectedTime && selectedService) ? colors.primary : colors.secondary + '60',
                    }]}
                    disabled={!!activeBooking || !selectedTime || !selectedService || submitting}
                    onPress={handleConfirm}
                >
                    {submitting
                        ? <ActivityIndicator color="#FFF" />
                        : <Text style={styles.confirmTxt}>{t('booking.confirm')}</Text>
                    }
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { justifyContent: 'center', alignItems: 'center', padding: 20 },

    // Service section
    section: { paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1 },
    sectionLabel: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
    chip: {
        paddingHorizontal: 12, paddingVertical: 8,
        borderRadius: 12, borderWidth: 1.5,
        marginRight: 10, minWidth: 110,
    },
    chipName: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
    chipMeta: { fontSize: 11 },
    hint: { marginTop: 6, fontSize: 11, fontStyle: 'italic' },

    // Day picker
    dayPickerWrap: { borderBottomWidth: 1 },
    dayPickerContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
    dayTab: {
        width: 50, height: 50, borderRadius: 12, borderWidth: 1,
        alignItems: 'center', justifyContent: 'center',
    },
    dayTabName: { fontSize: 10, fontWeight: '600' },
    dayTabNum: { fontSize: 16, fontWeight: '800', marginTop: 0 },

    // Slot rows
    slotRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 12,
        borderWidth: 1.5,
        marginBottom: 8,
    },
    slotTime: { fontSize: 15, fontWeight: '700', minWidth: 52, flexShrink: 0 },
    slotLabel: { fontSize: 12, fontWeight: '500' },
    badge: {
        paddingHorizontal: 8, paddingVertical: 3,
        borderRadius: 20,
    },
    badgeTxt: { fontSize: 11, fontWeight: '600' },

    // Bottom
    bottomBar: {
        padding: 12,
        paddingBottom: 24,
        borderTopWidth: 1,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    summaryService: { fontSize: 14, fontWeight: '600' },
    summaryDT: { fontSize: 11, marginTop: 2 },
    summaryPrice: { fontSize: 16, fontWeight: '800' },
    confirmBtn: { borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
    confirmTxt: { color: '#FFF', fontSize: 15, fontWeight: '700' },

});
