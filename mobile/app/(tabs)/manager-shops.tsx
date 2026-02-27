import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, Image,
    ActivityIndicator, TouchableOpacity, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { shopApi } from '../../api/shop.api';

export default function ManagerShopsScreen() {
    const router = useRouter();
    const theme = useColorScheme() ?? 'light';
    const colors = Colors[theme];
    const isDark = theme === 'dark';

    const [shops, setShops] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchShops = async () => {
        try {
            const res = await shopApi.getMyShops();
            setShops(res || []);
        } catch (error) {
            console.error('Failed to fetch manager shops', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchShops();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchShops();
    };

    const renderItem = ({ item }: { item: any }) => {
        const coverImage = item.images1 && item.images1.length > 0
            ? { uri: item.images1[0] }
            : require('../../assets/images/react-logo.png'); // Provide a local fallback if available

        return (
            <TouchableOpacity
                style={[styles.card, { backgroundColor: isDark ? '#2D1F1B' : '#FFF', borderColor: colors.secondary + '40' }]}
                activeOpacity={0.8}
                onPress={() => {
                    // Navigate to a shop management detail screen (To be built later if requested)
                    console.log('Navigate to Shop Details:', item._id);
                }}
            >
                <Image source={coverImage} style={styles.cardImage} resizeMode="cover" />
                <View style={styles.cardContent}>
                    <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                        {item.name}
                    </Text>
                    <Text style={[styles.cardAddress, { color: colors.icon }]} numberOfLines={2}>
                        {item.address}
                    </Text>
                    <Text style={[styles.cardPhone, { color: colors.primary }]}>
                        {item.phone}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Tiệm của tôi</Text>
                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: colors.primary }]}
                    onPress={() => console.log('Navigate to Create Shop')}
                >
                    <Text style={styles.addButtonText}>+ Tạo tiệm</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (shops.length === 0 ? (
                <View style={styles.center}>
                    <Text style={[styles.emptyText, { color: colors.icon }]}>Bạn chưa quản lý tiệm nào.</Text>
                </View>
            ) : (
                <FlatList
                    data={shops}
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
    header: {
        padding: 16, borderBottomWidth: 1, borderBottomColor: '#E0E0E0',
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
    },
    headerTitle: { fontSize: 24, fontWeight: '700' },
    addButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
    addButtonText: { color: '#FFF', fontWeight: '600' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 16 },
    listContainer: { padding: 16, paddingBottom: 100 },
    card: {
        borderRadius: 12, borderWidth: 1,
        marginBottom: 16, overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    cardImage: { width: '100%', height: 160, backgroundColor: '#E0E0E0' },
    cardContent: { padding: 12 },
    cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
    cardAddress: { fontSize: 14, marginBottom: 8 },
    cardPhone: { fontSize: 14, fontWeight: '600' }
});
