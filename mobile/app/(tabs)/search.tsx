import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { useTranslation } from '../../hooks/useTranslation';
import { shopApi } from '../../api/shop.api';
import { useRouter } from 'expo-router';

export default function SearchScreen() {
    const theme = useColorScheme() ?? 'light';
    const colors = Colors[theme];
    const { t } = useTranslation();
    const router = useRouter();

    const [keyword, setKeyword] = useState('');
    const [shops, setShops] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchShops = async () => {
            try {
                setLoading(true);
                const data = await shopApi.getAllShops(); // In a real app we'd pass `?keyword=${keyword}`
                // Demo filtering on FE if BE doesn't handle query correctly yet
                const shopList = data.data || data;
                if (keyword.trim() === '') {
                    setShops(shopList);
                } else {
                    setShops(shopList.filter((s: any) => s.name?.toLowerCase().includes(keyword.toLowerCase())));
                }
            } catch (error) {
                console.error('Failed to search shops:', error);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(() => {
            fetchShops();
        }, 500); // debounce API calls

        return () => clearTimeout(timer);
    }, [keyword]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.searchBarContainer}>
                <TextInput
                    style={[styles.searchInput, { color: colors.text, borderColor: colors.secondary, backgroundColor: theme === 'dark' ? '#3E2723' : '#FFF' }]}
                    placeholder={t('home.searchPlaceholder')}
                    placeholderTextColor={colors.icon}
                    value={keyword}
                    onChangeText={setKeyword}
                />
            </View>

            <View style={{ flex: 1, paddingHorizontal: 20 }}>
                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} />
                ) : (
                    <FlatList
                        data={shops}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.card, { backgroundColor: theme === 'dark' ? '#3E2723' : '#FFF', borderColor: colors.secondary }]}
                                onPress={() => router.push({ pathname: '/shop/[id]', params: { id: item._id } } as any)}
                            >
                                <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
                                <Text style={{ color: colors.icon }}>{item.address}</Text>
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={() => (
                            <View style={styles.mapPlaceholder}>
                                <Text style={[styles.mapText, { color: colors.icon }]}>No shops found</Text>
                            </View>
                        )}
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchBarContainer: {
        padding: 20,
    },
    searchInput: {
        height: 50,
        borderWidth: 1,
        borderRadius: 25,
        paddingHorizontal: 20,
        fontSize: 16,
    },
    mapPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 20,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    mapText: {
        fontSize: 16,
        fontWeight: '500',
    },
    card: {
        padding: 20,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    }
});
