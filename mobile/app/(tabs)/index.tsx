import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, TextInput, DeviceEventEmitter } from 'react-native';
import { Colors, Fonts } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { useTranslation } from '../../hooks/useTranslation';
import { shopApi } from '../../api/shop.api';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { HeaderMenu } from '../../components/ui/header-menu';

const SAMPLE_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA1EMmzLiUnvvExlXuuJ5TwhZ-UGvA7TSC12PvpAVXRpB8gbEV_fVp89prjitZINmGKQNMQHKOPZAcyvv6wezOjMviYcaNJWi-wMhzr_GSymToXbhBakwhrdhjstGeaGBdgatqGWfH7c7FA2NCn43vBmhZiqu1MRJ7ivMy4UUPGJ5lk92m5rdc7nehZtKh02Qm5Twl6ybLaUODV3qsHUDzoyVedRi7977qNN2cTeuyIMJTyd4jMzX6ttIg4FVGkV1i6TIoG9n4kGWJe',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBERzxIwDuffh6GyR8--YHgOLSePw5Zl6ksUmUtjZlGKBBBvDuhQOoITy1V4x_6kQICRGuhwZSn6uRD5yISOiyoDuIdBN4DH_NS263sXddUPTtoxyJX7ZzqmfdAZbMVucuTLM19n_j-takCbpck65Km8ccD3ZOE6x13-g7VAB-F_omBRygVhk9uabcwBp9vVkuBACcK6kbmjwLEJaUtm3wU3D6MT63MDjF2g4awpw59imfS8bdlpMvDIP1mHyfbVyqherNCKy_Evrea',
];

export default function HomeScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const primaryText = colors.onPrimary; // Ensure high contrast for button text

  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchShops = useCallback(async () => {
    try {
      if (user?.role !== 'CUSTOMER' && user?.role !== undefined) return;

      setLoading(true);
      const data = await shopApi.getAllShops();
      setShops(data.data || data);
    } catch (error) {
      console.error('Failed to fetch shops', error);
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  const onRefresh = useCallback(() => {
    fetchShops();
  }, [fetchShops]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('APP_REFRESH_SCREEN', () => {
      onRefresh();
    });
    return () => sub.remove();
  }, [onRefresh]);

  useEffect(() => {
    if (user?.role === 'MANAGER' || user?.role === 'ADMIN') {
      setTimeout(() => router.replace('/(tabs)/manager-appointments'), 0);
    } else if (user?.role === 'STAFF') {
      setTimeout(() => router.replace('/(tabs)/staff-appointments'), 0);
    }
  }, [user, router]);

  useFocusEffect(
    React.useCallback(() => {
      const fetchShops = async () => {
        try {
          if (user?.role !== 'CUSTOMER' && user?.role !== undefined) return;

          setLoading(true);
          const data = await shopApi.getAllShops();
          setShops(data.data || data);
        } catch (error) {
          console.error('Failed to fetch shops', error);
        } finally {
          setLoading(false);
        }
      };
      fetchShops();
    }, [user?.role])
  );

  if (user?.role === 'MANAGER' || user?.role === 'ADMIN' || user?.role === 'STAFF') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.topBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={[styles.brand, { color: colors.primary }]}>B_Hair</Text>
          <View style={{ width: 1, height: 14, backgroundColor: colors.border }} />
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.secondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {t('home.featuredShops')}
          </Text>
        </View>
        <HeaderMenu />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.greeting}>
          <Text style={[styles.greetingLabel, { color: colors.secondary }]}>
            {t('home.welcome')} {user?.fullName || 'bạn'}
          </Text>
          {/* <Text style={[styles.greetingTitle, { color: colors.primary }]}>B_Hair</Text> */}
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)/search' as any)}
          style={[styles.searchBar, { backgroundColor: theme === 'dark' ? colors.surfaceAlt : colors.surfaceHighest }]}
        >
          <MaterialIcons name="search" size={20} color={colors.outline} />
          <TextInput
            editable={false}
            value=""
            placeholder={t('home.searchPlaceholder')}
            placeholderTextColor={colors.outline}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </TouchableOpacity>

        {loading ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="large" color={colors.secondary} />
          </View>
        ) : shops.length === 0 ? (
          <View style={styles.loadingBlock}>
            <Text style={{ color: colors.muted }}>No shops found.</Text>
          </View>
        ) : (
          <View style={styles.cards}>
            {shops.map((shop, index) => {
              const cover = shop.images1?.[0] || shop.image || SAMPLE_IMAGES[index % SAMPLE_IMAGES.length];
              const rating = shop.rating ?? shop.averageRating ?? (index % 2 ? 4.9 : 4.8);
              return (
                <View key={shop._id} style={styles.cardBlock}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={[styles.cardImageWrap, { backgroundColor: colors.surfaceAlt }]}
                    onPress={() => router.push({ pathname: '/shop/[id]', params: { id: shop._id } } as any)}
                  >
                    <Image source={{ uri: cover }} style={styles.cardImage} />
                    <View style={[styles.ratingBadge, { backgroundColor: theme === 'dark' ? `${colors.surfaceAlt}E6` : `${colors.cardAlt}E6` }]}>
                      <MaterialIcons name="star" size={14} color={colors.secondary} />
                      <Text style={[styles.ratingText, { color: colors.text }]}>{Number(rating).toFixed(1)}</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.cardMeta}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardTitle, { color: colors.primary }]} numberOfLines={1}>{shop.name}</Text>
                      <Text style={[styles.cardAddress, { color: colors.muted }]} numberOfLines={1}>{shop.address}</Text>
                      <Text style={[styles.cardHours, { color: colors.muted }]}>
                        {shop.openTime || '09:00'} - {shop.closeTime || '20:00'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={[styles.bookBtn, { backgroundColor: colors.primary }]}
                      onPress={() => router.push({ pathname: '/shop/[id]', params: { id: shop._id } } as any)}
                    >
                      <Text style={[styles.bookText, { color: primaryText }]}>{t('home.book')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  greeting: {
    marginTop: 6,
    marginBottom: 20,
  },
  greetingLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    fontWeight: '700',
  },
  greetingTitle: {
    fontSize: 30,
    fontWeight: '700',
    fontFamily: Fonts.headline,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 52,
    borderRadius: 14,
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  loadingBlock: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  cards: {
    gap: 28,
  },
  cardBlock: {
    gap: 12,
  },
  cardImageWrap: {
    borderRadius: 18,
    overflow: 'hidden',
    aspectRatio: 16 / 10,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  ratingBadge: {
    position: 'absolute',
    right: 12,
    top: 12,
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
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Fonts.headline,
  },
  cardAddress: {
    fontSize: 13,
    marginTop: 2,
  },
  cardHours: {
    fontSize: 12,
    marginTop: 4,
  },
  bookBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  bookText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
