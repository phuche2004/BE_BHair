import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, FlatList, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Fonts } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { useTranslation } from '../../hooks/useTranslation';
import { shopApi } from '../../api/shop.api';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { HeaderMenu } from '../../components/ui/header-menu';
import { HapticTouch } from '../../components/ui/haptic-touch';
import { useVideoPlayer, VideoView } from 'expo-video';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAROUSEL_WIDTH = SCREEN_WIDTH - 40;

const VideoItem = React.memo(({ url, isActive }: { url: string; isActive: boolean }) => {
    const [hasBeenActive, setHasBeenActive] = useState(false);

    useEffect(() => {
        if (isActive && !hasBeenActive) {
            setHasBeenActive(true);
        }
    }, [isActive, hasBeenActive]);

    const player = useVideoPlayer(hasBeenActive ? url : null, (player) => {
        player.loop = true;
        player.muted = true; // Premium feel usually starts muted
    });

    useEffect(() => {
        if (isActive && hasBeenActive) {
            player.play();
        } else {
            player.pause();
        }
    }, [isActive, hasBeenActive, player]);

    return (
        <VideoView
            style={styles.carouselImage}
            player={player}
            fullscreenOptions={{ enable: true }}
            allowsPictureInPicture={false}
        />
    );
});

const VideoThumbnail = React.memo(({ url }: { url: string }) => {
    const player = useVideoPlayer(url, (player) => {
        player.muted = true;
    });

    return (
        <VideoView
            style={styles.thumbnailImage}
            player={player}
            fullscreenOptions={{ enable: false }}
            allowsPictureInPicture={false}
            nativeControls={false}
        />
    );
});

const HERO =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuA1EMmzLiUnvvExlXuuJ5TwhZ-UGvA7TSC12PvpAVXRpB8gbEV_fVp89prjitZINmGKQNMQHKOPZAcyvv6wezOjMviYcaNJWi-wMhzr_GSymToXbhBakwhrdhjstGeaGBdgatqGWfH7c7FA2NCn43vBmhZiqu1MRJ7ivMy4UUPGJ5lk92m5rdc7nehZtKh02Qm5Twl6ybLaUODV3qsHUDzoyVedRi7977qNN2cTeuyIMJTyd4jMzX6ttIg4FVGkV1i6TIoG9n4kGWJe';

export default function ShopDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const theme = useColorScheme() ?? 'light';
    const colors = Colors[theme];
    const { t } = useTranslation();
    const primaryText = colors.onPrimary;
    const insets = useSafeAreaInsets();

    const [shop, setShop] = useState<any>(null);
    const [services, setServices] = useState<any[]>([]);
    const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);

    const carouselRef = useRef<FlatList>(null);
    const autoPlayTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const fetchShopData = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const [shopRes, servicesRes] = await Promise.all([
                    shopApi.getShopDetails(id as string),
                    shopApi.getShopServices(id as string)
                ]);

                const shopData = shopRes.data || shopRes;
                const svcData = servicesRes.data || servicesRes;
                setShop(shopData);
                setServices(svcData);
                if (svcData?.length) {
                    setSelectedServiceId(svcData[0]._id);
                }
            } catch (error) {
                console.error('Failed to fetch shop details', error);
            } finally {
                setLoading(false);
            }
        };

        fetchShopData();
    }, [id]);

    // Combined media array
    const media = React.useMemo(() => {
        if (!shop) return [{ type: 'image', url: HERO }];
        const items: { type: 'image' | 'video'; url: string }[] = [];
        // if (shop.images1?.length) shop.images1.forEach((u: string) => items.push({ type: 'image', url: u }));
        if (shop.images2?.length) shop.images2.forEach((u: string) => items.push({ type: 'image', url: u }));
        if (shop.images3?.length) shop.images3.forEach((u: string) => items.push({ type: 'image', url: u }));
        if (shop.videos?.length) shop.videos.forEach((u: string) => items.push({ type: 'video', url: u }));

        if (items.length === 0 && shop.image) items.push({ type: 'image', url: shop.image });
        if (items.length === 0) items.push({ type: 'image', url: HERO });

        return items;
    }, [shop]);

    // Auto-play logic removed as per user request
    const isDragging = useRef(false);

    const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (!isDragging.current) return;
        const slideSize = event.nativeEvent.layoutMeasurement.width;
        const offset = event.nativeEvent.contentOffset.x;
        const index = Math.round(offset / slideSize);
        if (index !== activeIndex && index >= 0 && index < media.length) {
            setActiveIndex(index);
        }
    }, [activeIndex, media.length]);

    const goToIndex = (index: number) => {
        setActiveIndex(index);
        carouselRef.current?.scrollToIndex({ index, animated: true });
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.secondary} />
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

    const rating = shop.rating ?? shop.averageRating ?? 4.8;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
                <View style={styles.topBar}>
                    <HapticTouch onPress={() => router.back()} style={styles.iconBtn}>
                        <MaterialIcons name="arrow-back" size={22} color={colors.primary} />
                    </HapticTouch>
                    <Text style={[styles.brand, { color: colors.primary }]}>{shop.name}</Text>
                    <HeaderMenu />
                </View>

                {/* Media Carousel */}
                <View style={styles.carouselContainer}>
                    <FlatList
                        ref={carouselRef}
                        data={media}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={onScroll}
                        onScrollBeginDrag={() => { isDragging.current = true; }}
                        onMomentumScrollEnd={(event) => {
                            isDragging.current = false;
                            const slideSize = event.nativeEvent.layoutMeasurement.width;
                            const offset = event.nativeEvent.contentOffset.x;
                            const index = Math.round(offset / slideSize);
                            setActiveIndex(index);
                        }}
                        scrollEventThrottle={16}
                        getItemLayout={(_, index) => ({
                            length: CAROUSEL_WIDTH,
                            offset: CAROUSEL_WIDTH * index,
                            index,
                        })}
                        keyExtractor={(_, index) => index.toString()}
                        renderItem={({ item, index }) => (
                            <View style={styles.carouselItem}>
                                {item.type === 'video' ? (
                                    <VideoItem url={item.url} isActive={activeIndex === index} />
                                ) : (
                                    <Image source={{ uri: item.url }} style={styles.carouselImage} resizeMode="cover" />
                                )}
                            </View>
                        )}
                    />
                </View>

                {/* Thumbnails */}
                <View style={styles.thumbnailContainer}>
                    <FlatList
                        horizontal
                        data={media}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.thumbnailScroll}
                        keyExtractor={(_, index) => `thumb-${index}`}
                        renderItem={({ item, index }) => (
                            <HapticTouch
                                onPress={() => goToIndex(index)}
                                style={[
                                    styles.thumbnailItem,
                                    { borderColor: activeIndex === index ? colors.primary : colors.background }
                                ]}
                            >
                                {item.type === 'video' ? (
                                    <VideoThumbnail url={item.url} />
                                ) : (
                                    <Image source={{ uri: item.url }} style={styles.thumbnailImage} />
                                )}
                                {item.type === 'video' && (
                                    <View style={styles.thumbVideoBadge}>
                                        <MaterialIcons name="play-arrow" size={10} color="#FFF" />
                                    </View>
                                )}
                            </HapticTouch>
                        )}
                    />
                </View>

                {/* Branding & Info below media */}
                <View style={styles.brandingSection}>
                    <View style={styles.brandingMain}>
                        <Text style={[styles.shopTitle, { color: colors.primary }]}>{shop.name}</Text>
                        <View style={styles.ratingRow}>
                            <MaterialIcons name="star" size={16} color={colors.secondary} />
                            <Text style={[styles.ratingText, { color: colors.text }]}>
                                {Number(rating).toFixed(1)} ({shop.totalReviews ?? 0} đánh giá)
                            </Text>
                        </View>
                    </View>

                    <HapticTouch
                        style={[styles.reviewsBtn, { backgroundColor: theme === 'dark' ? colors.surfaceAlt : colors.surfaceHighest }]}
                        onPress={() => {/* TODO: Navigate to reviews */ }}
                    >
                        <MaterialIcons name="rate-review" size={20} color={colors.primary} />
                        <Text style={[styles.reviewsBtnText, { color: colors.primary }]}>Reviews</Text>
                    </HapticTouch>
                </View>

                <View style={styles.infoSection}>
                    <View style={[styles.infoCard, { backgroundColor: theme === 'dark' ? colors.surfaceAlt : colors.surface }]}>
                        <MaterialIcons name="location-on" size={18} color={colors.secondary} />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.infoLabel, { color: colors.muted }]}>ĐỊA CHỈ</Text>
                            <Text style={[styles.infoValue, { color: colors.primary }]}>{shop.address}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={[styles.smallInfo, { backgroundColor: theme === 'dark' ? colors.surfaceAlt : colors.surface }]}>
                            <MaterialIcons name="schedule" size={18} color={colors.secondary} />
                            <Text style={[styles.smallLabel, { color: colors.muted }]}>GIỜ MỞ CỬA</Text>
                            <Text style={[styles.smallValue, { color: colors.primary }]}>{shop.openTime || '09:00'} - {shop.closeTime || '21:00'}</Text>
                        </View>
                        <View style={[styles.smallInfo, { backgroundColor: theme === 'dark' ? colors.surfaceAlt : colors.surface }]}>
                            <MaterialIcons name="phone" size={18} color={colors.secondary} />
                            <Text style={[styles.smallLabel, { color: colors.muted }]}>LIÊN HỆ</Text>
                            <Text style={[styles.smallValue, { color: colors.primary }]}>{shop.phone || '024 3456 789'}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.servicesSection}>
                    <Text style={[styles.sectionTitle, { color: colors.primary }]}>Dịch vụ</Text>
                    {services.length === 0 ? (
                        <Text style={{ color: colors.muted }}>No services available.</Text>
                    ) : (
                        services.map((service) => {
                            const selected = selectedServiceId === service._id;
                            return (
                                <HapticTouch
                                    key={service._id}
                                    style={[
                                        styles.serviceCard,
                                        {
                                            backgroundColor: selected ? colors.primary : (theme === 'dark' ? colors.surfaceAlt : colors.surface),
                                            borderColor: selected ? colors.primary : colors.border,
                                        }
                                    ]}
                                    onPress={() => setSelectedServiceId(service._id)}
                                    activeOpacity={0.85}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.serviceName, { color: selected ? colors.onPrimary : colors.primary }]}>{service.name}</Text>
                                        <Text style={[styles.serviceDesc, { color: selected ? (theme === 'dark' ? `${colors.onPrimary}CC` : '#F0F0F0') : colors.muted }]}>
                                            {service.description || 'Gội đầu massage, cắt kiểu, sấy tạo hình'}
                                        </Text>
                                    </View>
                                    <View style={styles.serviceRight}>
                                        <Text style={[styles.servicePrice, { color: selected ? colors.onPrimary : colors.primary }]}>{service.price.toLocaleString()}đ</Text>
                                        <View style={[styles.radio, { borderColor: selected ? colors.onPrimary : colors.border }]}>
                                            {selected && <View style={[styles.radioDot, { backgroundColor: colors.onPrimary }]} />}
                                        </View>
                                    </View>
                                </HapticTouch>
                            );
                        })
                    )}
                </View>
            </ScrollView>

            <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom + 16 }]}>
                <HapticTouch
                    style={[styles.bookButton, { backgroundColor: colors.primary }]}
                    onPress={() => router.push({ pathname: '/booking', params: { shopId: id, serviceId: selectedServiceId ?? undefined } } as any)}
                    activeOpacity={0.85}
                >
                    <MaterialIcons name="calendar-today" size={18} color={primaryText} />
                    <Text style={[styles.bookButtonText, { color: primaryText }]}>{t('shop.bookNow')}</Text>
                </HapticTouch>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topBar: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    iconBtn: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    brand: {
        fontSize: 18,
        fontWeight: '700',
        fontFamily: Fonts.headline,
        flex: 1,
        textAlign: 'center',
    },
    carouselContainer: {
        height: 240,
        marginHorizontal: 20,
        borderRadius: 24,
        overflow: 'hidden',
    },
    carouselItem: {
        width: CAROUSEL_WIDTH,
        height: 240,
        position: 'relative',
    },
    carouselImage: {
        width: '100%',
        height: '100%',
    },
    videoOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    thumbnailContainer: {
        marginTop: 12,
        paddingHorizontal: 20,
    },
    thumbnailScroll: {
        gap: 8,
    },
    thumbnailItem: {
        width: 60,
        height: 60,
        borderRadius: 12,
        borderWidth: 2,
        overflow: 'hidden',
    },
    thumbnailImage: {
        width: '100%',
        height: '100%',
    },
    thumbVideoBadge: {
        position: 'absolute',
        right: 4,
        top: 4,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 4,
        width: 14,
        height: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    brandingSection: {
        paddingHorizontal: 20,
        marginTop: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    brandingMain: {
        flex: 1,
    },
    shopTitle: {
        fontSize: 24,
        fontWeight: '800',
        fontFamily: Fonts.headline,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    ratingText: {
        fontSize: 13,
        fontWeight: '600',
    },
    reviewsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
    },
    reviewsBtnText: {
        fontSize: 13,
        fontWeight: '700',
    },
    infoSection: {
        paddingHorizontal: 20,
        marginTop: 20,
        gap: 12,
    },
    infoCard: {
        borderRadius: 16,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    infoLabel: {
        fontSize: 11,
        letterSpacing: 1.2,
        fontWeight: '700',
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 4,
    },
    infoRow: {
        flexDirection: 'row',
        gap: 12,
    },
    smallInfo: {
        flex: 1,
        borderRadius: 16,
        padding: 14,
        gap: 6,
    },
    smallLabel: {
        fontSize: 10,
        letterSpacing: 1.2,
        fontWeight: '700',
    },
    smallValue: {
        fontSize: 12,
        fontWeight: '600',
    },
    servicesSection: {
        paddingHorizontal: 20,
        marginTop: 18,
        gap: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        fontFamily: Fonts.headline,
        marginBottom: 6,
    },
    serviceCard: {
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    serviceName: {
        fontSize: 15,
        fontWeight: '700',
    },
    serviceDesc: {
        fontSize: 12,
        marginTop: 4,
    },
    serviceRight: {
        alignItems: 'flex-end',
        gap: 8,
    },
    servicePrice: {
        fontSize: 14,
        fontWeight: '700',
    },
    radio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    bottomBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        borderTopWidth: 1,
        paddingHorizontal: 20,
        paddingTop: 12,
    },
    bookButton: {
        height: 52,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    bookButtonText: {
        fontSize: 15,
        fontWeight: '700',
    },
});
