import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';
import { shopApi } from '../../api/shop.api';
import { useAuthStore } from '../../store/useAuthStore';
import { HapticTouch } from '../../components/ui/haptic-touch';
import { HeaderMenu } from '../../components/ui/header-menu';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Modal } from 'react-native';

LocaleConfig.locales['vi'] = {
  monthNames: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
  monthNamesShort: ['Th.1', 'Th.2', 'Th.3', 'Th.4', 'Th.5', 'Th.6', 'Th.7', 'Th.8', 'Th.9', 'Th.10', 'Th.11', 'Th.12'],
  dayNames: ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'],
  dayNamesShort: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
  today: 'Hôm nay'
};
LocaleConfig.defaultLocale = 'vi';

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
  const [showPicker, setShowPicker] = useState(false);

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

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATED_APPOINTMENT': return 'add-circle';
      case 'UPDATED_STATUS': return 'edit-calendar';
      case 'DELETED_SERVICE': return 'delete';
      case 'EDITED_SERVICES': return 'build';
      default: return 'info';
    }
  };

  const handleDayPress = (day: any) => {
    setShowPicker(false);
    setSelectedDate(day.dateString);
    fetchHistory(day.dateString);
  };

  const getDisplayDate = () => {
    const [y, m, d] = selectedDate.split('-');
    return `Ngày ${d}/${m}/${y}`;
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
        <Text style={[styles.headerTitle, { color: colors.primary }]}>Lịch sử hoạt động</Text>
        <HeaderMenu />
      </View>

      <View style={styles.datePickerContainer}>
        <HapticTouch style={[styles.dateButton, { backgroundColor: colors.surface }]} onPress={() => setShowPicker(true)}>
          <MaterialIcons name="calendar-today" size={20} color={colors.primary} />
          <Text style={[styles.dateButtonText, { color: colors.primary }]}>{getDisplayDate()}</Text>
          <MaterialIcons name="arrow-drop-down" size={24} color={colors.primary} />
        </HapticTouch>
      </View>

      <Modal visible={showPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Calendar
              current={selectedDate}
              maxDate={new Date().toISOString().split('T')[0]}
              onDayPress={handleDayPress}
              markedDates={{
                [selectedDate]: { selected: true, disableTouchEvent: true, selectedColor: colors.primary }
              }}
              theme={{
                calendarBackground: colors.background,
                textSectionTitleColor: colors.secondary,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: colors.onPrimary,
                todayTextColor: colors.primary,
                dayTextColor: colors.text,
                textDisabledColor: colors.muted,
                arrowColor: colors.primary,
                monthTextColor: colors.text,
              }}
            />
            <HapticTouch style={[styles.closeBtn, { backgroundColor: colors.surface }]} onPress={() => setShowPicker(false)}>
              <Text style={{ color: colors.text, fontWeight: '600' }}>Đóng</Text>
            </HapticTouch>
          </View>
        </View>
      </Modal>

      {loading && !refreshing ? (
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  datePickerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 16,
    overflow: 'hidden',
  },
  closeBtn: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  }
});
