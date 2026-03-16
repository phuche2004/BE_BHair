import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, Text, Linking, Platform } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { shopApi } from '@/api/shop.api';
import { MaterialIcons } from '@expo/vector-icons';
import { HapticTouch } from './haptic-touch';

interface Shop {
    _id: string;
    name: string;
    address: string;
    location: {
        coordinates: [number, number]; // [long, lat]
    };
}

export function ShopMap() {
    const theme = useColorScheme() ?? 'light';
    const colors = Colors[theme];
    
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLocationAndShops = async (requestPermission = false) => {
        try {
            setLoading(true);
            setErrorMsg(null);
            
            // Nếu requestPermission = true, ta sẽ gọi pop-up hệ thống
            // Nếu = false (lúc mới mở), ta chỉ kiểm tra xem đã có quyền chưa
            const { status } = requestPermission 
                ? await Location.requestForegroundPermissionsAsync()
                : await Location.getForegroundPermissionsAsync();

            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                setLoading(false);
                return;
            }

            const currentLocation = await Location.getCurrentPositionAsync({});
            setLocation(currentLocation);
            
            const nearbyShops = await shopApi.getNearbyShops(
                currentLocation.coords.latitude,
                currentLocation.coords.longitude
            );
            setShops(nearbyShops);
        } catch (error) {
            console.error('Error fetching location or shops:', error);
            setErrorMsg('Có lỗi xảy ra khi xác định vị trí');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Lúc mới mở App, chỉ kiểm tra ngầm, không hiện pop-up
        fetchLocationAndShops(false);
    }, []);

    const handleRequestPermission = async () => {
        const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
        
        if (status === 'denied' && !canAskAgain) {
            // Nếu đã bị khóa vĩnh viễn, mở cài đặt
            Linking.openSettings();
        } else {
            // Nếu chưa hỏi hoặc có thể hỏi lại, gọi pop-up
            fetchLocationAndShops(true);
        }
    };

    const openDirections = (shop: Shop) => {
        const [long, lat] = shop.location.coordinates;
        if (Platform.OS === 'web') {
            const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${long}`;
            Linking.openURL(url);
            return;
        }
        
        const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
        const latLng = `${lat},${long}`;
        const label = shop.name;
        const url = Platform.select({
            ios: `${scheme}${label}@${latLng}`,
            android: `${scheme}${latLng}(${label})`
        });

        if (url) {
            Linking.openURL(url);
        }
    };

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: 10, color: colors.secondary }}>Đang xác định vị trí...</Text>
            </View>
        );
    }

    if (errorMsg) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background, padding: 20 }]}>
                <MaterialIcons name="location-off" size={64} color={colors.error} />
                <Text style={[styles.errorTitle, { color: colors.primary }]}>Không thể truy cập vị trí</Text>
                <Text style={[styles.errorText, { color: colors.secondary }]}>
                    Chúng tôi cần vị trí của bạn để tìm các tiệm gần nhất.
                </Text>
                
                <HapticTouch
                    activeOpacity={0.8}
                    style={[styles.retryBtn, { backgroundColor: colors.primary }]}
                    onPress={handleRequestPermission}
                >
                    <MaterialIcons name="settings" size={20} color={colors.onPrimary} />
                    <Text style={[styles.retryText, { color: colors.onPrimary }]}>Cấp quyền truy cập</Text>
                </HapticTouch>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MapView
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                style={styles.map}
                initialRegion={{
                    latitude: location?.coords.latitude || 21.0285,
                    longitude: location?.coords.longitude || 105.8542,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
                showsUserLocation={true}
                showsMyLocationButton={true}
                userLocationAnnotationTitle="Vị trí của bạn"
            >
                {shops.map((shop) => (
                    <Marker
                        key={shop._id}
                        coordinate={{
                            latitude: shop.location.coordinates[1],
                            longitude: shop.location.coordinates[0],
                        }}
                    >
                        <View style={[styles.markerContainer, { backgroundColor: colors.primary }]}>
                            <MaterialIcons name="content-cut" size={16} color={colors.onPrimary} />
                        </View>
                        <Callout tooltip onPress={() => openDirections(shop)}>
                            <View style={[styles.callout, { backgroundColor: colors.surface }]}>
                                <Text style={[styles.calloutTitle, { color: colors.primary }]}>{shop.name}</Text>
                                <Text style={[styles.calloutText, { color: colors.muted }]}>{shop.address}</Text>
                                <View style={[styles.directionBtn, { backgroundColor: colors.primary }]}>
                                    <MaterialIcons name="directions" size={16} color={colors.onPrimary} />
                                    <Text style={[styles.directionText, { color: colors.onPrimary }]}>Chỉ đường</Text>
                                </View>
                            </View>
                        </Callout>
                    </Marker>
                ))}
            </MapView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    markerContainer: {
        padding: 5,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#FFF',
    },
    callout: {
        padding: 12,
        borderRadius: 12,
        width: 200,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    calloutTitle: {
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
    },
    calloutText: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 4,
        marginBottom: 8,
    },
    directionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 6,
    },
    directionText: {
        fontSize: 12,
        fontWeight: '600',
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginTop: 16,
    },
    errorText: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 24,
        lineHeight: 20,
    },
    retryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 16,
        gap: 8,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    retryText: {
        fontSize: 15,
        fontWeight: '700',
    },
});
