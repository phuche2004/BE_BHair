import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { shopApi } from '../../api/shop.api';
import { useAuthStore } from '../../store/useAuthStore';
import { MaterialIcons } from '@expo/vector-icons';
import { HeaderMenu } from '../../components/ui/header-menu';
import { HapticTouch } from '../../components/ui/haptic-touch';

function getPast7Days(): string[] {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
}

export default function HistoryScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const days = React.useMemo(() => getPast7Days(), []);

  const fetchHistory = useCallback(async (dateToFetch: string) => {
    const shopId = (user as any)?.shopId;
    if (!shopId) return setLoading(false);

    try {
      setLoading(true);
      setError(null);
      const res = await shopApi.getShopHistory(shopId, dateToFetch);
      setLogs(Array.isArray(res) ? res : res.data ?? []);
    } catch (e: any) {
      console.log('Failed to fetch history', e);
      setError(e.response?.data?.message || e.message || 'Lỗi khi tải dữ liệu');
      setLogs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchHistory(selectedDate);
    }, [fetchHistory, selectedDate])
  );

  useEffect(() => {
    if (days.includes(selectedDate)) {
      // scroll to end ideally, but we will just fetch
      fetchHistory(selectedDate);
    }
  }, [selectedDate, fetchHistory, days]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATED_APPOINTMENT': return 'add-circle';
      case 'UPDATED_STATUS': return 'edit-calendar';
      case 'EDITED_SERVICES': return 'build';
      default: return 'info';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATED_APPOINTMENT': return colors.success;
      case 'UPDATED_STATUS': return colors.primary;
      case 'EDITED_SERVICES': return colors.secondary;
      default: return colors.text;
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const date = new Date(item.createdAt);
    const dateStr = date.toLocaleDateString('vi-VN');
    const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={[styles.logCard, { backgroundColor: theme === 'dark' ? colors.surfaceAlt : colors.card }]}>
        <View style={[styles.iconBox, { backgroundColor: getActionColor(item.action) + '20' }]}>
          <MaterialIcons name={getActionIcon(item.action) as any} size={24} color={getActionColor(item.action)} />
        </View>
        <View style={styles.logContent}>
          <Text style={[styles.details, { color: colors.text }]} numberOfLines={2} allowFontScaling={false}>{item.details}</Text>
          <View style={styles.logMeta}>
            <MaterialIcons name="person" size={14} color={colors.muted} />
            <Text style={[styles.actor, { color: colors.muted }]} numberOfLines={1} allowFontScaling={false}>{item.actorName}</Text>
            <Text style={[styles.dot, { color: colors.muted }]} allowFontScaling={false}>•</Text>
            <Text style={[styles.time, { color: colors.muted }]} numberOfLines={1} allowFontScaling={false}>{timeStr} - {dateStr}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.topBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={[styles.brand, { color: colors.primary }]}>B_Hair</Text>
          <View style={{ width: 1, height: 14, backgroundColor: colors.border }} />
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.secondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Lịch sử hoạt động
          </Text>
        </View>
        <HeaderMenu />
      </View>

      <View style={styles.dateSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>
          {days.map((date) => {
            const isSelected = selectedDate === date;
            const d = new Date(date);
            return (
              <HapticTouch
                key={date}
                style={[
                  styles.dateItem,
                  { backgroundColor: isSelected ? colors.primary : colors.surface, borderColor: colors.border },
                ]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[styles.dateDay, { color: isSelected ? colors.onPrimary : colors.secondary }]} allowFontScaling={false} numberOfLines={1}>
                  {d.toLocaleDateString('vi-VN', { weekday: 'short' })}
                </Text>
                <Text style={[styles.dateNum, { color: isSelected ? colors.onPrimary : colors.primary }]} allowFontScaling={false} numberOfLines={1}>
                  {d.getDate()}
                </Text>
              </HapticTouch>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchHistory(selectedDate); }} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialIcons name={error ? "error-outline" : "history"} size={48} color={error ? colors.error : colors.border} />
              <Text style={[styles.emptyText, { color: error ? colors.error : colors.muted }]}>
                {error ? `Lỗi: ${error}` : "Chưa có lịch sử hoạt động"}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  brand: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  dateSelector: {
    borderBottomWidth: 1,
    borderBottomColor: '#00000010',
    backgroundColor: 'transparent',
  },
  dateScroll: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  dateItem: {
    width: 60,
    height: 80,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dateDay: {
    fontSize: 13,
    fontWeight: '600',
  },
  dateNum: {
    fontSize: 18,
    fontWeight: '700',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
    gap: 16,
    paddingBottom: 100,
  },
  logCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logContent: {
    flex: 1,
  },
  details: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 8,
    lineHeight: 22,
  },
  logMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actor: {
    fontSize: 13,
    fontWeight: '600',
  },
  time: {
    fontSize: 12,
  },
  dot: {
    fontSize: 12,
    marginHorizontal: 4,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
  }
});
