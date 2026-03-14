import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, ImageBackground,
  ActivityIndicator, TouchableOpacity, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Colors, Fonts } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { shopApi } from '../../api/shop.api';
import { MaterialIcons } from '@expo/vector-icons';

const SAMPLE_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA1EMmzLiUnvvExlXuuJ5TwhZ-UGvA7TSC12PvpAVXRpB8gbEV_fVp89prjitZINmGKQNMQHKOPZAcyvv6wezOjMviYcaNJWi-wMhzr_GSymToXbhBakwhrdhjstGeaGBdgatqGWfH7c7FA2NCn43vBmhZiqu1MRJ7ivMy4UUPGJ5lk92m5rdc7nehZtKh02Qm5Twl6ybLaUODV3qsHUDzoyVedRi7977qNN2cTeuyIMJTyd4jMzX6ttIg4FVGkV1i6TIoG9n4kGWJe',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBPSHcmKTyocBKUuJqCc2wBqyLE6PTk4qyGTfup5ulljstQZJu2H0V3xMtYYzvfespOpPP5PsVvPHv_4e17SXv5jmawxZgmuFl77xtYU6z4LGa_B98NYU47RHZztSMbA7DcfUN9DKFLMjHn0U75csIgIHe9j3dWHl_eiAToV2E_SzHPgLO0SBSVEx3rWv8Ss6bbWQ2_ezRTXTKwGWYCyhD8CQd2P4Y8DU--9rZM3gShG2LOOp08akXEBhSJBLRwJCSB661PIR-xYAxg',
];

export default function ManagerShopsScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const isDark = theme === 'dark';
  const primaryText = theme === 'dark' ? colors.text : '#FFF';

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

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const coverImage = item.images1 && item.images1.length > 0
      ? { uri: item.images1[0] }
      : { uri: SAMPLE_IMAGES[index % SAMPLE_IMAGES.length] };

    return (
      <View style={styles.card}>
        <ImageBackground source={coverImage} style={styles.cardImage} imageStyle={styles.cardImageRadius}>
          <View style={[styles.cardOverlay, { backgroundColor: isDark ? '#00000055' : '#00000033' }]} />
        </ImageBackground>
        <View style={[styles.infoCard, { backgroundColor: theme === 'dark' ? colors.surfaceAlt : colors.cardAlt }]}>
          <View style={{ flex: 1 }}>
            <View style={styles.cardTopRow}>
              <Text style={[styles.cardTitle, { color: colors.primary }]} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={[styles.statusPill, { backgroundColor: colors.highlight }]}>
                <Text style={[styles.statusText, { color: colors.primary }]}>
                  {item.isActive === false ? 'INACTIVE' : 'ACTIVE'}
                </Text>
              </View>
            </View>
            <View style={styles.cardMetaRow}>
              <MaterialIcons name="location-on" size={14} color={colors.muted} />
              <Text style={[styles.cardAddress, { color: colors.muted }]} numberOfLines={2}>
                {item.address}
              </Text>
            </View>
            <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />
            <View style={styles.metricsRow}>
              <View>
                <Text style={[styles.metricLabel, { color: colors.muted }]}>APPOINTMENTS</Text>
                <Text style={[styles.metricValue, { color: colors.primary }]}>
                  {item.todayAppointments ?? 24} Today
                </Text>
              </View>
              <TouchableOpacity style={[styles.circleBtn, { backgroundColor: colors.primary }]}>
                <MaterialIcons name="chevron-right" size={20} color={primaryText} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="arrow-back" size={22} color={colors.primary} />
          <Text style={[styles.headerTitle, { color: colors.primary }]}>Tiệm của tôi</Text>
        </View>
        <TouchableOpacity style={[styles.addButton, { borderColor: colors.border }]} onPress={() => console.log('Navigate to Create Shop')}>
          <Text style={[styles.addButtonText, { color: colors.primary }]}>Tạo tiệm</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.secondary} />
        </View>
      ) : (shops.length === 0 ? (
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: colors.muted }]}>Bạn chưa quản lý tiệm nào.</Text>
        </View>
      ) : (
        <FlatList
          data={shops}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.secondary} />}
          showsVerticalScrollIndicator={false}
        />
      ))}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', fontFamily: Fonts.headline },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  addButtonText: { fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16 },
  listContainer: { padding: 16, paddingBottom: 100, gap: 24 },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardImage: { width: '100%', height: 200, backgroundColor: '#E0E0E0' },
  cardImageRadius: { borderRadius: 20 },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  infoCard: {
    marginHorizontal: 16,
    marginTop: -40,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', fontFamily: Fonts.headline },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardAddress: { fontSize: 12, flex: 1 },
  metaDivider: {
    height: 1,
    marginVertical: 12,
    opacity: 0.2,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricLabel: { fontSize: 10, letterSpacing: 1.4, fontWeight: '700' },
  metricValue: { fontSize: 16, fontWeight: '700', marginTop: 6 },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
