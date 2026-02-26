import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    ActivityIndicator, TouchableOpacity, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { appointmentApi } from '../../api/appointment.api';
import { axiosInstance } from '../../api';

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

    const [appt, setAppt] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);

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

    const handleCancel = () => {
        Alert.alert('Hủy lịch hẹn', 'Bạn có chắc muốn hủy lịch hẹn này không?', [
            { text: 'Không', style: 'cancel' },
            {
                text: 'Hủy lịch', style: 'destructive',
                onPress: async () => {
                    try {
                        setCancelling(true);
                        await axiosInstance.patch(`/appointment/${id}/cancel`);
                        Alert.alert('Đã hủy', 'Lịch hẹn đã được hủy thành công.', [
                            { text: 'OK', onPress: () => router.back() }
                        ]);
                    } catch (e: any) {
                        Alert.alert('Lỗi', e.response?.data?.message ?? 'Không thể hủy lịch');
                    } finally {
                        setCancelling(false);
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
    const shopName = typeof appt.shopId === 'object' ? appt.shopId?.name : appt.shopId;
    const shopAddress = typeof appt.shopId === 'object' ? appt.shopId?.address : '';
    const barberName = typeof appt.barberId === 'object' ? appt.barberId?.fullName : (appt.barberId ? 'Barber' : 'Bất kỳ');
    const services: any[] = appt.serviceIds ?? [];

    const statusLabel = STATUS_LABEL[appt.status] ?? appt.status;
    const statusColor = STATUS_COLOR[appt.status] ?? colors.primary;
    const canCancel = appt.status === 'PENDING' || appt.status === 'CONFIRMED';

    return (
        <>
            <Stack.Screen options={{ title: 'Chi tiết lịch hẹn' }} />
            <ScrollView style={[styles.container, { backgroundColor: colors.background }]}
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

                    <Divider />

                    <InfoRow icon="💈" label="Cửa hàng" value={shopName ?? '—'} colors={colors} />
                    {!!shopAddress && (
                        <InfoRow icon="📍" label="Địa chỉ" value={shopAddress} colors={colors} />
                    )}

                    <Divider />

                    <InfoRow icon="✂️" label="Barber" value={barberName} colors={colors} />

                    <Divider />

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

                    <Divider />

                    <View style={styles.totalRow}>
                        <Text style={[styles.totalLabel, { color: colors.text }]}>Tổng tiền</Text>
                        <Text style={[styles.totalValue, { color: colors.primary }]}>
                            {(appt.totalPrice ?? 0).toLocaleString()}đ
                        </Text>
                    </View>

                    {!!appt.note && (
                        <>
                            <Divider />
                            <InfoRow icon="📝" label="Ghi chú" value={appt.note} colors={colors} />
                        </>
                    )}
                </View>

                {/* ── Cancel button ── */}
                {canCancel && (
                    <TouchableOpacity
                        style={[styles.cancelBtn, { borderColor: '#B71C1C' }]}
                        activeOpacity={0.75}
                        disabled={cancelling}
                        onPress={handleCancel}
                    >
                        {cancelling
                            ? <ActivityIndicator color="#B71C1C" />
                            : <Text style={styles.cancelTxt}>Hủy lịch hẹn</Text>
                        }
                    </TouchableOpacity>
                )}
            </ScrollView>
        </>
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

function Divider() {
    return <View style={styles.divider} />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1 },
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

    cancelBtn: {
        marginHorizontal: 16, marginTop: 8,
        paddingVertical: 14, borderRadius: 12, borderWidth: 1.5,
        alignItems: 'center',
    },
    cancelTxt: { color: '#B71C1C', fontWeight: '700', fontSize: 15 },
});
