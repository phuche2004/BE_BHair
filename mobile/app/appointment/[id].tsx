import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    ActivityIndicator, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { appointmentApi } from '../../api/appointment.api';
import { axiosInstance } from '../../api';
import { useAuthStore } from '../../store/useAuthStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VN_TZ = { timeZone: 'Asia/Ho_Chi_Minh' } as const;

function fmtDateTime(iso: string) {
    const d = new Date(iso);
    return (
        d.toLocaleDateString('vi-VN', VN_TZ) +
        ' lúc ' +
        d.toLocaleTimeString('vi-VN', { ...VN_TZ, hour: '2-digit', minute: '2-digit' })
    );
}

function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString('vi-VN', { ...VN_TZ, hour: '2-digit', minute: '2-digit' });
}

// ─── Status helpers ───────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

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

    useEffect(() => {
        if (!id) return;
        (async () => {
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
        })();
    }, [id]);

    const handleUpdateStatus = (newStatus: string, confirmMessage: string) => {
        Alert.alert('Cập nhật trạng thái', confirmMessage, [
            { text: 'Không', style: 'cancel' },
            {
                text: 'Xác nhận', style: newStatus === 'CANCELLED' || newStatus === 'NO_SHOW' ? 'destructive' : 'default',
                onPress: async () => {
                    try {
                        setUpdating(true);
                        // Using our generic status update route
                        await appointmentApi.updateAppointmentStatus(id, newStatus);
                        setAppt((prev: any) => ({ ...prev, status: newStatus }));
                        Alert.alert('Thành công', `Cập nhật trạng thái thành ${STATUS_LABEL[newStatus] || newStatus} thành công.`);
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
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!appt) return null;

    // Parse populated fields
    const shopName = typeof appt.shopId === 'object' ? appt.shopId?.name : (appt.shopId ?? '—');
    const shopAddress = typeof appt.shopId === 'object' ? appt.shopId?.address : '';
    // barberId null = không chọn barber cụ thể
    const barberName = appt.barberId
        ? (typeof appt.barberId === 'object' ? appt.barberId.fullName : 'Barber')
        : 'Bất kỳ (shop tự sắp xếp)';
    const services: any[] = appt.serviceIds ?? [];

    const statusLabel = STATUS_LABEL[appt.status] ?? appt.status;
    const statusColor = STATUS_COLOR[appt.status] ?? colors.primary;
    const isActive = appt.status === 'PENDING' || appt.status === 'CONFIRMED';

    // Role checks
    const isCustomer = user?.role === 'CUSTOMER';
    const isManagerOrStaff = user?.role === 'MANAGER' || user?.role === 'ADMIN' || user?.role === 'STAFF';
    const dividerColor = isDark ? '#FFFFFF14' : '#00000012';

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
            <Stack.Screen options={{ title: 'Chi tiết lịch hẹn' }} />
            <ScrollView style={styles.container}
                contentContainerStyle={{ paddingBottom: 40 }}>

                {/* ── Status badge ── */}
                <View style={[styles.statusCard, { backgroundColor: statusColor + '18', borderColor: statusColor }]}>
                    <Text style={[styles.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
                    <Text style={[styles.statusId, { color: colors.icon }]}>#{String(appt._id).slice(-8).toUpperCase()}</Text>
                </View>

                {/* ── Info rows ── */}
                <View style={[styles.card, { backgroundColor: isDark ? '#2D1F1B' : '#FFF', borderColor: colors.secondary + '40' }]}>

                    <InfoRow icon="📅" label="Thời gian bắt đầu" value={fmtDateTime(appt.bookingDate)} colors={colors} />
                    <InfoRow icon="🕐" label="Kết thúc dự kiến" value={fmtTime(appt.endTime)} colors={colors} />

                    <Divider color={dividerColor} />

                    <InfoRow icon="💈" label="Cửa hàng" value={shopName ?? '—'} colors={colors} />
                    {!!shopAddress && (
                        <InfoRow icon="📍" label="Địa chỉ" value={shopAddress} colors={colors} />
                    )}

                    <Divider color={dividerColor} />

                    <InfoRow icon="✂️" label="Barber" value={barberName} colors={colors} />

                    <Divider color={dividerColor} />

                    {/* Services */}
                    <Text style={[styles.rowLabel, { color: colors.icon }]}>🛎 Dịch vụ</Text>
                    {services.map((svc: any, idx: number) => {
                        const name = typeof svc === 'object' ? svc.name : svc;
                        const price = typeof svc === 'object' ? svc.price : null;
                        const dur = typeof svc === 'object' ? svc.duration : null;
                        return (
                            <View key={idx} style={styles.svcRow}>
                                <Text style={[styles.svcName, { color: colors.text }]}>{name}</Text>
                                <Text style={[styles.svcMeta, { color: colors.icon }]}>
                                    {dur ? `${dur} phút  ` : ''}{price ? `${price.toLocaleString()}đ` : ''}
                                </Text>
                            </View>
                        );
                    })}

                    <Divider color={dividerColor} />

                    <View style={styles.totalRow}>
                        <Text style={[styles.totalLabel, { color: colors.text }]}>Tổng tiền</Text>
                        <Text style={[styles.totalValue, { color: colors.primary }]}>
                            {(appt.totalPrice ?? 0).toLocaleString()}đ
                        </Text>
                    </View>

                    {!!appt.note && (
                        <>
                            <Divider color={dividerColor} />
                            <InfoRow icon="📝" label="Ghi chú" value={appt.note} colors={colors} />
                        </>
                    )}
                </View>

                {/* ── Actions ── */}
                {isActive && (
                    <View style={styles.actionsContainer}>

                        {(isCustomer || isManagerOrStaff) && (
                            <TouchableOpacity
                                style={[styles.actionBtn, { borderColor: '#B71C1C' }]}
                                activeOpacity={0.75}
                                disabled={updating}
                                onPress={() => handleUpdateStatus('CANCELLED', 'Bạn có chắc muốn hủy lịch hẹn này không?')}
                            >
                                {updating ? <ActivityIndicator color="#B71C1C" /> : <Text style={[styles.actionTxt, { color: '#B71C1C' }]}>Hủy lịch hẹn</Text>}
                            </TouchableOpacity>
                        )}

                        {isManagerOrStaff && (
                            <>
                                <TouchableOpacity
                                    style={[styles.actionBtn, { borderColor: '#6D4C41', marginTop: 12 }]}
                                    activeOpacity={0.75}
                                    disabled={updating}
                                    onPress={() => handleUpdateStatus('NO_SHOW', 'Xác nhận khách không đến?')}
                                >
                                    {updating ? <ActivityIndicator color="#6D4C41" /> : <Text style={[styles.actionTxt, { color: '#6D4C41' }]}>Đánh dấu Khách không đến</Text>}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: '#1565C0', borderColor: '#1565C0', marginTop: 12 }]}
                                    activeOpacity={0.75}
                                    disabled={updating}
                                    onPress={() => handleUpdateStatus('COMPLETED', 'Xác nhận đơn này đã hoàn thành?')}
                                >
                                    {updating ? <ActivityIndicator color="#FFFFFF" /> : <Text style={[styles.actionTxt, { color: '#FFFFFF' }]}>Đánh dấu Hoàn thành</Text>}
                                </TouchableOpacity>
                            </>
                        )}

                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({ icon, label, value, colors }: { icon: string; label: string; value: string; colors: any }) {
    return (
        <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>{icon}</Text>
            <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, { color: colors.icon }]}>{label}</Text>
                <Text style={[styles.rowValue, { color: colors.text }]}>{value}</Text>
            </View>
        </View>
    );
}

function Divider({ color = '#00000012' }: { color?: string }) {
    return <View style={[styles.divider, { backgroundColor: color }]} />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1 },
    safe: { flex: 1, marginTop: 28 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    statusCard: {
        margin: 16, padding: 16,
        borderRadius: 14, borderWidth: 1.5,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    statusLabel: { fontSize: 16, fontWeight: '700' },
    statusId: { fontSize: 11, fontWeight: '500' },

    card: {
        marginHorizontal: 16, borderRadius: 14, borderWidth: 1,
        paddingHorizontal: 16, paddingVertical: 8,
        marginBottom: 16,
    },

    infoRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10 },
    infoIcon: { fontSize: 17, marginRight: 10, marginTop: 1 },
    rowLabel: { fontSize: 11, marginBottom: 2 },
    rowValue: { fontSize: 14, fontWeight: '600', lineHeight: 20 },

    divider: { height: 1, backgroundColor: '#00000012', marginVertical: 2 },

    svcRow: { paddingVertical: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    svcName: { fontSize: 14, fontWeight: '600' },
    svcMeta: { fontSize: 12 },

    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
    totalLabel: { fontSize: 15, fontWeight: '700' },
    totalValue: { fontSize: 18, fontWeight: '800' },

    actionsContainer: {
        marginHorizontal: 16,
        marginTop: 8,
    },
    actionBtn: {
        paddingVertical: 14, borderRadius: 12, borderWidth: 1.5,
        alignItems: 'center',
    },
    actionTxt: { fontWeight: '700', fontSize: 15 },
});
