import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { useTranslation } from '../../hooks/useTranslation';
import { shopApi } from '../../api/shop.api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ShopDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const theme = useColorScheme() ?? 'light';
    const colors = Colors[theme];
    const { t } = useTranslation();

    const [shop, setShop] = useState<any>(null);
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchShopData = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const [shopRes, servicesRes] = await Promise.all([
                    shopApi.getShopDetails(id as string),
                    shopApi.getShopServices(id as string) // Note: Adjust API structure if nested
                ]);

                // Backend usually wraps in .data
                setShop(shopRes.data || shopRes);
                setServices(servicesRes.data || servicesRes);
            } catch (error) {
                console.error('Failed to fetch shop details', error);
            } finally {
                setLoading(false);
            }
        };

        fetchShopData();
    }, [id]);

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!shop) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: colors.text }}>Shop not found.</Text>
            </View>
        );
    }

    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                <View style={styles.imagePlaceholder}>
                    {/* In a real app we would map shop.images[0] here */}
                    <Text style={{ color: '#FFF' }}>{t('shop.imageMap')}</Text>
                </View>

                <View style={styles.infoContainer}>
                    <Text style={[styles.title, { color: colors.text }]}>{shop.name}</Text>
                    <Text style={[styles.address, { color: colors.icon }]}>{shop.address}</Text>
                    <Text style={[styles.time, { color: colors.text }]}>{t('shop.hours')}: {shop.openTime} - {shop.closeTime}</Text>

                    <View style={styles.separator} />

                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('shop.services')}</Text>
                    {services.length === 0 ? (
                        <Text style={{ color: colors.icon }}>No services available.</Text>
                    ) : (
                        services.map((service) => (
                            <View key={service._id} style={[styles.serviceCard, { borderColor: colors.secondary }]}>
                                <View>
                                    <Text style={[styles.serviceName, { color: colors.text }]}>{service.name}</Text>
                                    <Text style={{ color: colors.icon }}>{service.duration} {t('shop.mins')}</Text>
                                </View>
                                <Text style={[styles.servicePrice, { color: colors.primary }]}>{service.price.toLocaleString()} VND</Text>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>

            <View style={[styles.bottomBar, {
                backgroundColor: colors.background,
                borderTopColor: colors.secondary,
                paddingBottom: insets.bottom > 0 ? insets.bottom + 10 : 40
            }]}>
                <TouchableOpacity
                    style={[styles.bookButton, { backgroundColor: colors.primary }]}
                    onPress={() => router.push({ pathname: '/booking', params: { shopId: id } } as any)}
                >
                    <Text style={styles.bookButtonText}>{t('shop.bookNow')}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    imagePlaceholder: {
        width: '100%',
        height: 250,
        backgroundColor: '#8D6E63',
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoContainer: {
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    address: {
        fontSize: 16,
        marginBottom: 8,
    },
    time: {
        fontSize: 14,
        fontWeight: '500',
    },
    separator: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    serviceCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderWidth: 1,
        borderRadius: 12,
        marginBottom: 12,
    },
    serviceName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    servicePrice: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    bottomBar: {
        padding: 20,
        paddingBottom: 40,
        borderTopWidth: 1,
    },
    bookButton: {
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    bookButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    }
});
