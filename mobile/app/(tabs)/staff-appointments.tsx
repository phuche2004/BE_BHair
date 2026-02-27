import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList,
    ActivityIndicator, TouchableOpacity, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { appointmentApi } from '../../api/appointment.api';
import { useAuthStore } from '../../store/useAuthStore';

// Note: Ensure `shopId` is stored in useAuthStore if users are bound to a shop. 
// For now, this assumes `user.shopId` exists from backend if they are staff.

export default function StaffAppointmentsScreen() {
    const router = useRouter();
    const theme = useColorScheme() ?? 'light';
    const colors = Colors[theme];
    const isDark = theme === 'dark';
    const user: any = useAuthStore((state) => state.user);

    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchAppointments = async () => {
        if (!user?.shopId) {
            setLoading(false);
            return;
        }
        try {
            const res = await appointmentApi.getShopAppointments(user.shopId);
            setAppointments(res || []);
        } catch (error) {
            console.error('Failed to fetch staff appointments', error);
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

    const renderItem = ({ item }: { item: any }) => {
        const d = new Date(item.bookingDate);
        const dateStr = d.toLocaleDateString('vi-VN');
        const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

        return (
            <TouchableOpacity
                style={[styles.card, { backgroundColor: isDark ? '#2D1F1B' : '#FFF', borderColor: colors.secondary + '40' }]}
                activeOpacity={0.7}
                onPress={() => router.push(`/appointment/${item._id}`)}
            >
                <View style={styles.cardHeader}>
                    <Text style={[styles.timeText, { color: colors.primary }]}>{timeStr} - {dateStr}</Text>
                    <Text style={[styles.statusBadge, { color: item.status === 'PENDING' ? '#E65100' : colors.text }]}>
                        {item.status}
                    </Text>
                </View>
                <Text style={[styles.customerName, { color: colors.text }]}>
                    Khách: {item.customerId?.fullName || 'Khách vãng lai'} ({item.customerId?.phoneNumber})
                </Text>
                <Text style={[styles.serviceText, { color: colors.icon }]}>
                    {item.serviceIds?.length || 0} Dịch vụ
                </Text>
                <Text style={[styles.priceText, { color: colors.primary }]}>
                    {(item.totalPrice || 0).toLocaleString()}đ
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Lịch làm việc (Staff)</Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (appointments.length === 0 ? (
                <View style={styles.center}>
                    <Text style={[styles.emptyText, { color: colors.icon }]}>Không có lịch hẹn nào.</Text>
                </View>
            ) : (
                <FlatList
                    data={appointments}
                    keyExtractor={item => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                />
            ))}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
    headerTitle: { fontSize: 24, fontWeight: '700' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 16 },
    listContainer: { padding: 16, paddingBottom: 100 },
    card: {
        borderRadius: 12, borderWidth: 1,
        padding: 16, marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    timeText: { fontSize: 16, fontWeight: '700' },
    statusBadge: { fontSize: 12, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: '#00000008', overflow: 'hidden' },
    customerName: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
    serviceText: { fontSize: 14, marginBottom: 4 },
    priceText: { fontSize: 15, fontWeight: '700', alignSelf: 'flex-end' },
});
