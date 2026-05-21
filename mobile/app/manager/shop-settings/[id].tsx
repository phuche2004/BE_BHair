import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  ActivityIndicator, Alert, Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Colors } from '../../../constants/theme';
import { useColorScheme } from '../../../hooks/use-color-scheme';
import { shopApi } from '../../../api/shop.api';
import { serviceApi } from '../../../api/service.api';
import { MaterialIcons } from '@expo/vector-icons';
import { HapticTouch } from '../../../components/ui/haptic-touch';
import { ServiceFormModal } from '../../../components/ui/service-form-modal';

export default function ShopSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState(true);
  const [savingShop, setSavingShop] = useState(false);

  // Shop state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [openTime, setOpenTime] = useState('');
  const [closeTime, setCloseTime] = useState('');
  const [breakStart, setBreakStart] = useState('');
  const [breakEnd, setBreakEnd] = useState('');
  const [slotDuration, setSlotDuration] = useState('30');

  // Services state
  const [services, setServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);

  const fetchShopData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await shopApi.getShopDetails(id as string);
      if (res) {
        setName(res.name || '');
        setAddress(res.address || '');
        setPhone(res.phone || '');
        setOpenTime(res.openTime || '09:00');
        setCloseTime(res.closeTime || '21:00');
        setBreakStart(res.breakStart || '');
        setBreakEnd(res.breakEnd || '');
        setSlotDuration(res.slotDuration?.toString() || '30');
      }
    } catch (e) {
      console.log('Failed to fetch shop details', e);
      Alert.alert('Lỗi', 'Không thể tải thông tin tiệm');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchServicesData = useCallback(async () => {
    try {
      setLoadingServices(true);
      const res = await shopApi.getShopServices(id as string);
      setServices(Array.isArray(res) ? res : res.data ?? []);
    } catch (e) {
      console.log('Failed to fetch shop services', e);
    } finally {
      setLoadingServices(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      fetchShopData();
      fetchServicesData();
    }, [fetchShopData, fetchServicesData])
  );

  const handleSaveShopInfo = async () => {
    try {
      setSavingShop(true);
      await shopApi.updateShop(id as string, {
        name, address, phone,
        openTime, closeTime, breakStart, breakEnd,
        slotDuration: Number(slotDuration)
      });
      Alert.alert('Thành công', 'Đã cập nhật thông tin tiệm');
    } catch (e) {
      console.log(e);
      Alert.alert('Lỗi', 'Không thể cập nhật thông tin tiệm');
    } finally {
      setSavingShop(false);
    }
  };

  const handleDeleteService = (serviceId: string) => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc chắn muốn ẩn/xóa dịch vụ này không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await serviceApi.deleteService(serviceId);
              fetchServicesData();
            } catch (e) {
              console.log(e);
              Alert.alert('Lỗi', 'Không thể xóa dịch vụ');
            }
          }
        }
      ]
    );
  };

  const openAddService = () => {
    setSelectedService(null);
    setShowServiceModal(true);
  };

  const openEditService = (service: any) => {
    setSelectedService(service);
    setShowServiceModal(true);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <HapticTouch style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
        </HapticTouch>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>Cấu hình Tiệm</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* SECTION 1: SHOP INFO */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Thông tin cơ bản</Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.secondary }]}>Tên tiệm</Text>
              <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} value={name} onChangeText={setName} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.secondary }]}>Địa chỉ</Text>
              <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} value={address} onChangeText={setAddress} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.secondary }]}>Số điện thoại</Text>
              <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            </View>
          </View>
        </View>

        {/* SECTION 2: SCHEDULE */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Lịch trình (Giờ:Phút)</Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.secondary }]}>Giờ mở cửa</Text>
                <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} value={openTime} onChangeText={setOpenTime} placeholder="09:00" />
              </View>
              <View style={{ width: 12 }} />
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.secondary }]}>Giờ đóng cửa</Text>
                <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} value={closeTime} onChangeText={setCloseTime} placeholder="21:00" />
              </View>
            </View>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.secondary }]}>Nghỉ trưa (Bắt đầu)</Text>
                <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} value={breakStart} onChangeText={setBreakStart} placeholder="12:00" />
              </View>
              <View style={{ width: 12 }} />
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.secondary }]}>Nghỉ trưa (Kết thúc)</Text>
                <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} value={breakEnd} onChangeText={setBreakEnd} placeholder="13:00" />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.secondary }]}>Thời lượng mỗi Slot (phút)</Text>
              <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} value={slotDuration} onChangeText={setSlotDuration} keyboardType="numeric" />
            </View>
          </View>

          <HapticTouch style={[styles.btnSave, { backgroundColor: colors.primary }]} onPress={handleSaveShopInfo} disabled={savingShop}>
            {savingShop ? <ActivityIndicator color={isDark ? '#000' : '#FFF'} /> : <Text style={[styles.btnSaveText, { color: isDark ? '#000' : '#FFF' }]}>Lưu thay đổi Tiệm</Text>}
          </HapticTouch>
        </View>

        {/* SECTION 3: SERVICES */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.primary, marginBottom: 0 }]}>Quản lý Dịch vụ</Text>
            <HapticTouch style={[styles.btnAddService, { backgroundColor: colors.highlight }]} onPress={openAddService}>
              <MaterialIcons name="add" size={20} color={colors.primary} />
              <Text style={[styles.btnAddServiceText, { color: colors.primary }]}>Thêm</Text>
            </HapticTouch>
          </View>

          {loadingServices ? (
            <ActivityIndicator style={{ margin: 20 }} color={colors.primary} />
          ) : (
            <View style={[styles.servicesList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {services.length === 0 ? (
                <Text style={{ textAlign: 'center', padding: 20, color: colors.muted }}>Chưa có dịch vụ nào.</Text>
              ) : (
                services.map((svc, idx) => (
                  <View key={svc._id} style={[styles.serviceItem, { borderBottomColor: colors.border, borderBottomWidth: idx === services.length - 1 ? 0 : 1 }]}>
                    <HapticTouch style={{ flex: 1 }} onPress={() => openEditService(svc)}>
                      <Text style={[styles.serviceName, { color: colors.text }]}>{svc.name}</Text>
                      <Text style={[styles.servicePrice, { color: colors.primary }]}>
                        {svc.price.toLocaleString('vi-VN')} đ • {svc.duration} phút
                        {svc.managerExtraFee > 0 && ` (Phụ thu Mng: ${svc.managerExtraFee.toLocaleString('vi-VN')} đ)`}
                      </Text>
                    </HapticTouch>
                    <HapticTouch style={styles.deleteBtn} onPress={() => handleDeleteService(svc._id)}>
                      <MaterialIcons name="delete-outline" size={24} color={colors.error} />
                    </HapticTouch>
                  </View>
                ))
              )}
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <ServiceFormModal
        visible={showServiceModal}
        onClose={() => setShowServiceModal(false)}
        onSuccess={() => {
          fetchServicesData();
        }}
        shopId={id as string}
        initialData={selectedService}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
  },
  btnSave: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  btnSaveText: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  btnAddService: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  btnAddServiceText: {
    fontWeight: '600',
    marginLeft: 4,
  },
  servicesList: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: 13,
  },
  deleteBtn: {
    padding: 8,
  }
});
