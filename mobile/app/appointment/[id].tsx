import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  ImageBackground,
  DeviceEventEmitter,
  Modal,
  FlatList,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Fonts } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { appointmentApi } from '../../api/appointment.api';
import { shopApi } from '../../api/shop.api';
import { useAuthStore } from '../../store/useAuthStore';
import { MaterialIcons } from '@expo/vector-icons';
import { HeaderMenu } from '../../components/ui/header-menu';

const HERO =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA1EMmzLiUnvvExlXuuJ5TwhZ-UGvA7TSC12PvpAVXRpB8gbEV_fVp89prjitZINmGKQNMQHKOPZAcyvv6wezOjMviYcaNJWi-wMhzr_GSymToXbhBakwhrdhjstGeaGBdgatqGWfH7c7FA2NCn43vBmhZiqu1MRJ7ivMy4UUPGJ5lk92m5rdc7nehZtKh02Qm5Twl6ybLaUODV3qsHUDzoyVedRi7977qNN2cTeuyIMJTyd4jMzX6ttIg4FVGkV1i6TIoG9n4kGWJe';

const VN_TZ = { timeZone: 'Asia/Ho_Chi_Minh' } as const;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', VN_TZ);
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('vi-VN', { ...VN_TZ, hour: '2-digit', minute: '2-digit' });
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  NO_SHOW: 'Không đến',
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: '#E65100',
  CONFIRMED: '#2E7D32',
  COMPLETED: '#1565C0',
  CANCELLED: '#B71C1C',
  NO_SHOW: '#6D4C41',
};

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const isDark = theme === 'dark';

  const user = useAuthStore((state) => state.user);
  const [appt, setAppt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  const [showEditServices, setShowEditServices] = useState(false);
  const [shopServices, setShopServices] = useState<any[]>([]);
  const [tempChanges, setTempChanges] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

  const openEditServices = async () => {
    setShowEditServices(true);
    setTempChanges(appt.serviceChanges || []);
    if (shopServices.length === 0) {
      setLoadingServices(true);
      try {
         const sId = typeof appt.shopId === 'object' ? appt.shopId._id : appt.shopId;
         const res = await shopApi.getShopServices(sId);
         setShopServices(Array.isArray(res) ? res : res.data ?? []);
      } catch(e) {
         console.log(e);
      } finally {
         setLoadingServices(false);
      }
    }
  };

  const handleSaveServices = async () => {
     try {
       setUpdating(true);
       await appointmentApi.updateAppointmentServices(id as string, tempChanges);
       setShowEditServices(false);
       Alert.alert('Thành công', 'Đã cập nhật dịch vụ');
       fetchData();
     } catch (error) {
       console.log(error);
       Alert.alert('Lỗi', 'Không thể cập nhật dịch vụ');
     } finally {
       setUpdating(false);
     }
  };

  const toggleService = (svc: any, isOriginal: boolean) => {
     const existingChangeIdx = tempChanges.findIndex((c) => (c.serviceId._id || c.serviceId) === svc._id);
     if (isOriginal) {
        if (existingChangeIdx >= 0) {
           setTempChanges(prev => prev.filter((_, i) => i !== existingChangeIdx));
        } else {
           setTempChanges(prev => [...prev, { action: 'REMOVED', serviceId: svc, byName: user?.fullName || 'Barber' }]);
        }
     } else {
        if (existingChangeIdx >= 0) {
           setTempChanges(prev => prev.filter((_, i) => i !== existingChangeIdx));
        } else {
           setTempChanges(prev => [...prev, { action: 'ADDED', serviceId: svc, byName: user?.fullName || 'Barber' }]);
        }
     }
  };

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await appointmentApi.getAppointmentById(id);
      setAppt(res.data ?? res);
    } catch (e: any) {
      Alert.alert('Lỗi', e.response?.data?.message ?? 'Không tải được lịch hẹn');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('APP_REFRESH_SCREEN', fetchData);
    return () => sub.remove();
  }, [fetchData]);

  const handleUpdateStatus = (newStatus: string, confirmMessage: string) => {
    Alert.alert('Cập nhật trạng thái', confirmMessage, [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Xác nhận',
        style: newStatus === 'CANCELLED' || newStatus === 'NO_SHOW' ? 'destructive' : 'default',
        onPress: async () => {
          try {
            setUpdating(true);
            await appointmentApi.updateAppointmentStatus(id, newStatus);
            setAppt((prev: any) => ({ ...prev, status: newStatus }));
            Alert.alert('Thành công', `Cập nhật trạng thái thành ${STATUS_LABEL[newStatus] || newStatus}.`);
          } catch (e: any) {
            Alert.alert('Lỗi', e.response?.data?.message ?? 'Không thể cập nhật trạng thái');
          } finally {
            setUpdating(false);
          }
        }
      }
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
    );
  }

  if (!appt) return null;

  const shopName = typeof appt.shopId === 'object' ? appt.shopId?.name : (appt.shopId ?? '—');
  const shopAddress = typeof appt.shopId === 'object' ? appt.shopId?.address : '';
  const barberName = appt.barberId
    ? (typeof appt.barberId === 'object' ? appt.barberId.fullName : 'Barber')
    : 'Bất kỳ (shop tự sắp xếp)';
  const services: any[] = appt.serviceIds ?? [];

  const statusLabel = STATUS_LABEL[appt.status] ?? appt.status;
  const statusColor = STATUS_COLOR[appt.status] ?? colors.secondary;
  const isActive = appt.status === 'PENDING' || appt.status === 'CONFIRMED';

  const isCustomer = user?.role === 'CUSTOMER';
  const isManagerOrStaff = user?.role === 'MANAGER' || user?.role === 'ADMIN' || user?.role === 'STAFF';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <MaterialIcons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: colors.primary }]}>Chi tiết lịch hẹn</Text>
        <HeaderMenu />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={styles.idRow}>
          <View>
            <Text style={[styles.idLabel, { color: colors.secondary }]}>MÃ LỊCH HẸN</Text>
            <Text style={[styles.idValue, { color: colors.primary }]}>{appt.bookingCode}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: `${statusColor}22` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        {!isManagerOrStaff && (
          <ImageBackground 
            source={{ uri: (typeof appt.shopId === 'object' && appt.shopId?.images1?.[0]) || HERO }} 
            style={styles.hero} 
            imageStyle={styles.heroImage}
          >
            <View style={styles.heroOverlay} />
            <Text style={styles.heroCaption}>Trải nghiệm dịch vụ tại {shopName}</Text>
          </ImageBackground>
        )}

        <View style={[styles.card, { backgroundColor: theme === 'dark' ? colors.surfaceAlt : colors.surface }]}>
          <View style={styles.timeRow}>
            <MaterialIcons name="calendar-today" size={18} color={colors.secondary} />
            <View>
              <Text style={[styles.sectionLabel, { color: colors.muted }]}>THỜI GIAN</Text>
              <Text style={[styles.timeValue, { color: colors.primary }]}>
                {fmtTime(appt.bookingDate)} - {fmtTime(appt.endTime)}
              </Text>
              <Text style={[styles.timeDate, { color: colors.secondary }]}>{fmtDate(appt.bookingDate)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.doubleRow}>
          {isCustomer ? (
            <View style={[styles.smallCard, { backgroundColor: theme === 'dark' ? colors.surfaceAlt : colors.surface }]}>
              <MaterialIcons name="location-on" size={18} color={colors.secondary} />
              <Text style={[styles.smallLabel, { color: colors.muted }]}>CỬA HÀNG</Text>
              <Text style={[styles.smallValue, { color: colors.primary }]} numberOfLines={1}>{shopName}</Text>
              {!!shopAddress && <Text style={[styles.smallSub, { color: colors.muted }]} numberOfLines={1}>{shopAddress}</Text>}
            </View>
          ) : (
            <View style={[styles.smallCard, { backgroundColor: theme === 'dark' ? colors.surfaceAlt : colors.surface }]}>
              <MaterialIcons name="person" size={18} color={colors.secondary} />
              <Text style={[styles.smallLabel, { color: colors.muted }]}>KHÁCH HÀNG</Text>
              <Text style={[styles.smallValue, { color: colors.primary }]} numberOfLines={1}>
                {appt.customerName || appt.userId?.fullName || 'Khách vãng lai'}
              </Text>
              <Text style={[styles.smallSub, { color: colors.muted }]}>
                {appt.customerPhone || appt.userId?.phoneNumber || appt.userId?.email || 'N/A'}
              </Text>
            </View>
          )}
          <View style={[styles.smallCard, { backgroundColor: theme === 'dark' ? colors.surfaceAlt : colors.surface }]}>
            <MaterialIcons name="content-cut" size={18} color={colors.secondary} />
            <Text style={[styles.smallLabel, { color: colors.muted }]}>BARBER</Text>
            <Text style={[styles.smallValue, { color: colors.primary }]} numberOfLines={1}>{barberName}</Text>
            {typeof appt.shopId === 'object' && !!appt.shopId?.phone && (
              <Text style={[styles.smallSub, { color: colors.muted }]}>Tel: {appt.shopId.phone}</Text>
            )}
          </View>
        </View>

        <View style={styles.servicesSection}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
             <Text style={[styles.servicesTitle, { color: colors.primary, marginBottom: 0 }]}>Dịch vụ</Text>
             {isManagerOrStaff && isActive && (
               <TouchableOpacity style={styles.editBtn} onPress={openEditServices}>
                 <MaterialIcons name="edit" size={16} color={colors.primary} />
                 <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>Cập nhật</Text>
               </TouchableOpacity>
             )}
          </View>

          {services.map((svc: any, idx: number) => {
            const svcId = typeof svc === 'object' ? svc._id : svc;
            const name = typeof svc === 'object' ? svc.name : svc;
            const price = typeof svc === 'object' ? svc.price : null;
            const dur = typeof svc === 'object' ? svc.duration : null;
            
            const isRemoved = appt.serviceChanges?.some((c: any) => c.action === 'REMOVED' && (c.serviceId._id === svcId || c.serviceId === svcId));
            const removedBy = isRemoved ? appt.serviceChanges.find((c: any) => c.action === 'REMOVED' && (c.serviceId._id === svcId || c.serviceId === svcId))?.byName : null;

            return (
              <View key={idx} style={[styles.serviceRow, isRemoved && { opacity: 0.5 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  {typeof svc === 'object' && !!svc.image && (
                    <ImageBackground source={{ uri: svc.image }} style={styles.serviceImage} imageStyle={{ borderRadius: 8 }} />
                  )}
                  <View>
                    <Text style={[styles.serviceName, { color: colors.primary, textDecorationLine: isRemoved ? 'line-through' : 'none' }]}>{name}</Text>
                    {dur && !isRemoved && <Text style={[styles.serviceMeta, { color: colors.muted }]}>{dur} phút</Text>}
                    {isRemoved && (
                      <Text style={{ color: colors.error, fontSize: 11, fontWeight: '700', marginTop: 2 }}>
                         {isCustomer ? 'Đã hủy' : `Hủy bởi ${removedBy || 'Barber'}`}
                      </Text>
                    )}
                  </View>
                </View>
                <Text style={[styles.servicePrice, { color: colors.secondary, textDecorationLine: isRemoved ? 'line-through' : 'none' }]}>
                  {price ? `${price.toLocaleString()}đ` : ''}
                </Text>
              </View>
            );
          })}

          {appt.serviceChanges?.filter((c: any) => c.action === 'ADDED').map((change: any, idx: number) => {
            const svc = change.serviceId;
            return (
              <View key={`add-${idx}`} style={styles.serviceRow}>
                 <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                   {!!svc.image && (
                    <ImageBackground source={{ uri: svc.image }} style={styles.serviceImage} imageStyle={{ borderRadius: 8 }} />
                   )}
                   <View>
                     <Text style={[styles.serviceName, { color: colors.primary }]}>{svc.name}</Text>
                     <Text style={{ color: colors.success, fontSize: 11, fontWeight: '700', marginTop: 2 }}>
                       {isCustomer ? 'Dịch vụ thêm' : `Thêm bởi ${change.byName || 'Barber'}`}
                     </Text>
                   </View>
                 </View>
                 <Text style={[styles.servicePrice, { color: colors.secondary }]}>
                   {svc.price ? `${svc.price.toLocaleString()}đ` : ''}
                 </Text>
              </View>
            )
          })}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.muted }]}>TỔNG CỘNG</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>
              {(() => {
                 let t = appt.totalPrice || 0;
                 if (appt.serviceChanges) {
                    appt.serviceChanges.forEach((c: any) => {
                       if (c.action === 'ADDED') t += (c.serviceId.price || 0);
                       if (c.action === 'REMOVED') t -= (c.serviceId.price || 0);
                    });
                 }
                 return t.toLocaleString();
              })()}đ
            </Text>
          </View>
        </View>

        {!!appt.note && (
          <View style={[styles.noteBox, { backgroundColor: theme === 'dark' ? colors.surfaceAlt : colors.surface }]}>
            <MaterialIcons name="sticky-note-2" size={16} color={colors.secondary} />
            <Text style={[styles.noteText, { color: colors.muted }]}>{appt.note}</Text>
          </View>
        )}

        <View style={[styles.notice, { backgroundColor: theme === 'dark' ? colors.surfaceHigh : colors.surface }]}>
          <Text style={[styles.noticeText, { color: colors.muted }]}>Vui lòng đến sớm 5 phút để được phục vụ tốt nhất.</Text>
        </View>

        {isActive && (
          <View style={styles.actionsContainer}>
            {(isCustomer || isManagerOrStaff) && (
              <TouchableOpacity
                style={[styles.outlineBtn, { borderColor: colors.error }]}
                activeOpacity={0.75}
                disabled={updating}
                onPress={() => handleUpdateStatus('CANCELLED', 'Bạn có chắc muốn hủy lịch hẹn này không?')}
              >
                {updating ? <ActivityIndicator color={colors.error} /> : <Text style={[styles.outlineText, { color: colors.error }]}>Hủy lịch hẹn</Text>}
              </TouchableOpacity>
            )}

            {isManagerOrStaff && (
              <>
                <TouchableOpacity
                  style={[styles.outlineBtn, { borderColor: '#6D4C41', marginTop: 12 }]}
                  activeOpacity={0.75}
                  disabled={updating}
                  onPress={() => handleUpdateStatus('NO_SHOW', 'Xác nhận khách không đến?')}
                >
                  {updating ? <ActivityIndicator color="#6D4C41" /> : <Text style={[styles.outlineText, { color: '#6D4C41' }]}>Đánh dấu khách không đến</Text>}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.filledBtn, { backgroundColor: '#1565C0', marginTop: 12 }]}
                  activeOpacity={0.75}
                  disabled={updating}
                  onPress={() => handleUpdateStatus('COMPLETED', 'Xác nhận đơn này đã hoàn thành?')}
                >
                  {updating ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.filledText}>Đánh dấu hoàn thành</Text>}
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={showEditServices} animationType="slide" transparent>
         <View style={styles.modalBg}>
            <View style={[styles.modalContainer, { backgroundColor: theme === 'dark' ? colors.surface : '#fff' }]}>
               <View style={styles.modalHeader}>
                 <Text style={[styles.modalTitle, { color: colors.primary }]}>Chỉnh sửa dịch vụ</Text>
                 <TouchableOpacity onPress={() => setShowEditServices(false)}>
                   <MaterialIcons name="close" size={24} color={colors.primary} />
                 </TouchableOpacity>
               </View>
               {loadingServices ? <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} /> : (
                 <FlatList 
                   data={shopServices}
                   keyExtractor={(item) => item._id}
                   contentContainerStyle={{ padding: 20 }}
                   renderItem={({ item }) => {
                     const isOriginal = services.some((s: any) => (s._id || s) === item._id);
                     const change = tempChanges.find((c) => c.serviceId._id === item._id || c.serviceId === item._id);
                     
                     let isActive = false;
                     if (isOriginal && (!change || change.action !== 'REMOVED')) isActive = true;
                     if (!isOriginal && change?.action === 'ADDED') isActive = true;

                     return (
                       <View style={styles.modalServiceRow}>
                         <View style={{ flex: 1, paddingRight: 10 }}>
                           <Text style={[styles.serviceName, { color: colors.primary }]}>{item.name}</Text>
                           <Text style={{ color: colors.secondary, fontSize: 13, marginTop: 4 }}>{item.price?.toLocaleString()}đ</Text>
                         </View>
                         <Switch 
                           value={isActive} 
                           onValueChange={() => toggleService(item, isOriginal)}
                           trackColor={{ true: colors.primary, false: colors.border }}
                         />
                       </View>
                     )
                   }}
                 />
               )}
               <View style={styles.modalFooter}>
                 <TouchableOpacity style={[styles.filledBtn, { backgroundColor: colors.primary, width: '100%' }]} onPress={handleSaveServices}>
                    <Text style={styles.filledText}>Lưu thay đổi</Text>
                 </TouchableOpacity>
               </View>
            </View>
         </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  topTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Fonts.headline,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 14,
  },
  idLabel: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
  },
  idValue: {
    fontSize: 26,
    fontWeight: '700',
    fontFamily: Fonts.headline,
  },
  statusPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  hero: {
    height: 180,
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  heroImage: {
    borderRadius: 18,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  heroCaption: {
    color: '#FFFFFF',
    fontSize: 12,
    margin: 12,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  timeValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  timeDate: {
    fontSize: 13,
    marginTop: 4,
  },
  doubleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  smallCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    gap: 6,
  },
  smallLabel: {
    fontSize: 10,
    letterSpacing: 1.4,
    fontWeight: '700',
  },
  smallValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  smallSub: {
    fontSize: 11,
  },
  servicesSection: {
    marginTop: 6,
    marginBottom: 18,
  },
  servicesTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Fonts.headline,
    textAlign: 'center',
    marginBottom: 12,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
  },
  serviceMeta: {
    fontSize: 11,
    marginTop: 4,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '700',
  },
  serviceImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 11,
    letterSpacing: 1.6,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  noteText: {
    fontSize: 12,
    flex: 1,
  },
  notice: {
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  noticeText: {
    fontSize: 11,
    textAlign: 'center',
  },
  actionsContainer: {
    marginTop: 8,
  },
  outlineBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  outlineText: { fontWeight: '700', fontSize: 14 },
  filledBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  filledText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '75%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalServiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
});
