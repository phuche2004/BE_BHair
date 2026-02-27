import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { useTranslation } from '../../hooks/useTranslation';
import { appointmentApi } from '../../api/appointment.api';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';

export default function ManagerAppointmentsScreen() {
    const theme = useColorScheme() ?? 'light';
    const colors = Colors[theme];
    const { t } = useTranslation();
    const router = useRouter();
    const user: any = useAuthStore((state) => state.user);

    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchAppointments = async () => {
        if (!user?.shopId) {
            setLoading(false);
            setRefreshing(false);
            return;
        }
        try {
            setLoading(true);
            const res = await appointmentApi.getShopAppointments(user.shopId);
            setAppointments(res || []);
        } catch (error) {
            console.error('Failed to fetch manager appointments:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchAppointments();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchAppointments();
    };

    const upcoming = appointments.filter((a) => a.status === 'PENDING' || a.status === 'CONFIRMED');
    const past = appointments.filter((a) => a.status === 'COMPLETED' || a.status === 'CANCELLED' || a.status === 'NO_SHOW');

    // Map status → translated label + color
    const STATUS_LABEL: Record<string, string> = (t as any)('appointments.status') ?? {};
    const STATUS_COLOR: Record<string, string> = {
        PENDING: '#E65100',
        CONFIRMED: '#2E7D32',
        COMPLETED: '#1565C0',
        CANCELLED: '#B71C1C',
        NO_SHOW: '#6D4C41',
    };

    const renderCard = (appt: any, isUpcoming: boolean) => {
        const d = new Date(appt.bookingDate);
        const VN = { timeZone: 'Asia/Ho_Chi_Minh' } as const;
        const dateStr =
            d.toLocaleDateString('vi-VN', VN) +
            ' ' +
            d.toLocaleTimeString('vi-VN', { ...VN, hour: '2-digit', minute: '2-digit' });

        // Khách hàng
        const customerName = appt.customerId?.fullName || 'Khách vãng lai';
        const customerPhone = appt.customerId?.phoneNumber || '';

        // Tên Thợ
        const barberName = appt.barberId?.fullName || '--';

        const serviceNames = (appt.serviceIds ?? []).map((s: any) =>
            typeof s === 'object' && s !== null ? s.name : s
        ).filter(Boolean).join(', ') || `${(appt.serviceIds ?? []).length} dịch vụ`;

        return (
            <TouchableOpacity
                key={appt._id}
                activeOpacity={0.75}
                onPress={() => router.push(`/appointment/${appt._id}` as any)}
                style={[styles.card, {
                    backgroundColor: theme === 'dark' ? '#3E2723' : '#FFF',
                    borderColor: colors.secondary,
                    opacity: isUpcoming ? 1 : 0.7,
                }]}
            >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[isUpcoming ? styles.statusPending : styles.statusCompleted, {
                        color: STATUS_COLOR[appt.status] ?? (isUpcoming ? '#E65100' : '#2E7D32')
                    }]}>
                        {STATUS_LABEL[appt.status] ?? appt.status}
                    </Text>
                    <Text style={{ color: colors.icon, fontSize: 16 }}>›</Text>
                </View>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{serviceNames}</Text>

                <View style={{ marginTop: 4 }}>
                    <Text style={{ color: colors.icon, marginBottom: 2 }}>
                        Khách: {customerName} {customerPhone ? `(${customerPhone})` : ''}
                    </Text>
                    <Text style={{ color: colors.icon }}>
                        Thợ: {barberName}
                    </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <Text style={{
                        color: isUpcoming ? colors.primary : colors.icon,
                        fontWeight: isUpcoming ? 'bold' : 'normal',
                    }}>
                        {dateStr}
                    </Text>
                    <Text style={{ color: colors.primary, fontWeight: '700' }}>
                        {(appt.totalPrice || 0).toLocaleString()}đ
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
            <ScrollView
                style={styles.container}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            >
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>Quản lý Lịch hẹn (Manager)</Text>
                </View>

                <View style={styles.content}>
                    {loading ? (
                        <ActivityIndicator size="large" color={colors.primary} />
                    ) : (
                        <>
                            {upcoming.length > 0 && (
                                <View style={{ marginBottom: 16 }}>
                                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('appointments.upcoming')}</Text>
                                    {upcoming.map(a => renderCard(a, true))}
                                </View>
                            )}

                            {past.length > 0 && (
                                <View style={{ marginBottom: 16 }}>
                                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('appointments.past')}</Text>
                                    {past.map(a => renderCard(a, false))}
                                </View>
                            )}

                            {appointments.length === 0 && (
                                <Text style={{ color: colors.icon, textAlign: 'center', marginTop: 20 }}>Không có lịch hẹn nào.</Text>
                            )}
                        </>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
        paddingTop: 10,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        marginTop: 8,
    },
    card: {
        padding: 20,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
        marginTop: 8,
    },
    statusPending: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    statusCompleted: {
        fontSize: 12,
        fontWeight: 'bold',
    }
});
