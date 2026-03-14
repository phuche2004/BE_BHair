import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator, DeviceEventEmitter, Image } from 'react-native';
import { Colors, Fonts } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { useTranslation } from '../../hooks/useTranslation';
import { shopApi } from '../../api/shop.api';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { HeaderMenu } from '../../components/ui/header-menu';

const SAMPLE_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA1EMmzLiUnvvExlXuuJ5TwhZ-UGvA7TSC12PvpAVXRpB8gbEV_fVp89prjitZINmGKQNMQHKOPZAcyvv6wezOjMviYcaNJWi-wMhzr_GSymToXbhBakwhrdhjstGeaGBdgatqGWfH7c7FA2NCn43vBmhZiqu1MRJ7ivMy4UUPGJ5lk92m5rdc7nehZtKh02Qm5Twl6ybLaUODV3qsHUDzoyVedRi7977qNN2cTeuyIMJTyd4jMzX6ttIg4FVGkV1i6TIoG9n4kGWJe',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBPSHcmKTyocBKUuJqCc2wBqyLE6PTk4qyGTfup5ulljstQZJu2H0V3xMtYYzvfespOpPP5PsVvPHv_4e17SXv5jmawxZgmuFl77xtYU6z4LGa_B98NYU47RHZztSMbA7DcfUN9DKFLMjHn0U75csIgIHe9j3dWHl_eiAToV2E_SzHPgLO0SBSVEx3rWv8Ss6bbWQ2_ezRTXTKwGWYCyhD8CQd2P4Y8DU--9rZM3gShG2LOOp08akXEBhSJBLRwJCSB661PIR-xYAxg',
];

const FILTERS = ['Cắt tóc', 'Uốn', 'Nhuộm'];

export default function SearchScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { t } = useTranslation();
  const router = useRouter();

  const [keyword, setKeyword] = useState('');
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Gần tôi');

  const fetchShops = useCallback(async () => {
    try {
      setLoading(true);
      const data = await shopApi.getAllShops();
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
  }, [keyword]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('APP_REFRESH_SCREEN', () => {
      fetchShops();
    });
    return () => sub.remove();
  }, [fetchShops]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchShops();
    }, 500);

    return () => clearTimeout(timer);
  }, [keyword, fetchShops]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.topBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={[styles.brand, { color: colors.primary }]}>B_Hair</Text>
          <View style={{ width: 1, height: 14, backgroundColor: colors.border }} />
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.secondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Tìm kiếm
          </Text>
        </View>
        <HeaderMenu />
      </View>

      <View style={styles.content}>
        <View style={[styles.searchBar, { backgroundColor: theme === 'dark' ? colors.surfaceAlt : colors.surfaceHighest }]}>
          <MaterialIcons name="search" size={20} color={colors.outline} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('home.searchPlaceholder')}
            placeholderTextColor={colors.outline}
            value={keyword}
            onChangeText={setKeyword}
          />
        </View>

        <View style={styles.filtersRow}>
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterChip,
                {
                  backgroundColor: activeFilter === filter ? colors.primary : (theme === 'dark' ? colors.surfaceAlt : colors.surface),
                  borderColor: activeFilter === filter ? colors.primary : colors.border,
                }
              ]}
              onPress={() => setActiveFilter(filter)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, { color: activeFilter === filter ? colors.onPrimary : colors.primary }]}>{filter}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[
              styles.filterChip,
              {
                backgroundColor: activeFilter === 'Gần tôi' ? colors.primary : (theme === 'dark' ? colors.surfaceAlt : colors.surface),
                borderColor: activeFilter === 'Gần tôi' ? colors.primary : colors.border,
              }
            ]}
            onPress={() => setActiveFilter('Gần tôi')}
            activeOpacity={0.8}
          >
            <MaterialIcons name="near-me" size={16} color={activeFilter === 'Gần tôi' ? colors.onPrimary : colors.secondary} />
            <Text style={[styles.filterText, { color: activeFilter === 'Gần tôi' ? colors.onPrimary : colors.secondary }]}>Gần tôi</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.secondary }]}>KẾT QUẢ GỢI Ý</Text>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.secondary} />
          </View>
        ) : (
          <FlatList
            data={shops}
            keyExtractor={(item) => item._id}
            renderItem={({ item, index }) => {
              const cover = item.images1?.[0] || item.image || SAMPLE_IMAGES[index % SAMPLE_IMAGES.length];
              const rating = item.rating ?? item.averageRating ?? (index % 2 ? 4.9 : 4.8);
              const distance = item.distance ?? `${index + 1}.2 km`;
              return (
                <TouchableOpacity
                  style={[styles.card, { backgroundColor: theme === 'dark' ? colors.surfaceAlt : colors.surface }]}
                  onPress={() => router.push({ pathname: '/shop/[id]', params: { id: item._id } } as any)}
                  activeOpacity={0.9}
                >
                  <Image source={{ uri: cover }} style={styles.cardImage} />
                  <View style={styles.cardMeta}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardTitle, { color: colors.primary }]} numberOfLines={1}>{item.name}</Text>
                      <Text style={[styles.cardSubtitle, { color: colors.muted }]}>{item.address?.split(',')[0]} · {distance}</Text>
                    </View>
                    <View style={[styles.ratingBadge, { backgroundColor: theme === 'dark' ? colors.surfaceHigh : colors.cardAlt }]}>
                      <MaterialIcons name="star" size={14} color={colors.secondary} />
                      <Text style={[styles.ratingText, { color: colors.primary }]}>{Number(rating).toFixed(1)}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <MaterialIcons name="search-off" size={42} color={colors.outline} />
                <Text style={[styles.emptyText, { color: colors.outline }]}>Không tìm thấy tiệm phù hợp.</Text>
              </View>
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 52,
    borderRadius: 14,
    marginTop: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
    marginBottom: 20,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 12,
  },
  center: {
    paddingVertical: 30,
  },
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 20,
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Fonts.headline,
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    fontSize: 12,
  },
});
