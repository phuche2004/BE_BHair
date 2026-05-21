import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Switch } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { Colors } from '../../constants/theme';
import { shopApi } from '../../api/shop.api';
import { appointmentApi } from '../../api/appointment.api';
import { useAuthStore } from '../../store/useAuthStore';

interface CreateAppointmentModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedDate?: string; // YYYY-MM-DD
}

export function CreateAppointmentModal({ visible, onClose, onSuccess, selectedDate }: CreateAppointmentModalProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { user } = useAuthStore();

  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  
  const [services, setServices] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible && user?.shopId) {
       fetchData();
    }
  }, [visible, user?.shopId, selectedDate]);

  const fetchData = async () => {
     setLoading(true);
     try {
       const [svcRes, slotRes] = await Promise.all([
         shopApi.getShopServices(user?.shopId as string),
         shopApi.getShopSlots(user?.shopId as string, selectedDate || new Date().toISOString().split('T')[0])
       ]);
       setServices(Array.isArray(svcRes) ? svcRes : svcRes.data ?? []);
       const rawSlots = Array.isArray(slotRes) ? slotRes : slotRes.slots ?? slotRes.data?.slots ?? slotRes.data ?? [];
       setSlots(rawSlots);
     } catch (e) {
       console.log(e);
     } finally {
       setLoading(false);
     }
  };

  const handleCreate = async () => {
    if (!guestName.trim()) return Alert.alert('Lỗi', 'Vui lòng nhập tên khách hàng');
    if (!selectedTime) return Alert.alert('Lỗi', 'Vui lòng chọn giờ');
    if (selectedServices.length === 0) return Alert.alert('Lỗi', 'Vui lòng chọn ít nhất 1 dịch vụ');

    setSubmitting(true);
    try {
       const dateStr = selectedDate || new Date().toISOString().split('T')[0];
       const bookingDate = new Date(`${dateStr}T${selectedTime}:00`);

       await appointmentApi.createAppointment({
         shopId: user?.shopId,
         barberId: user?._id, // Assign to current staff
         serviceIds: selectedServices,
         bookingDate: bookingDate.toISOString(),
         isManual: true,
         guestName,
         guestPhone,
         note: 'Tạo thủ công bởi ' + user?.fullName
       });
       Alert.alert('Thành công', 'Đã tạo lịch hẹn mới');
       setGuestName('');
       setGuestPhone('');
       setSelectedTime('');
       setSelectedServices([]);
       onSuccess();
    } catch(e: any) {
       console.log(e);
       Alert.alert('Lỗi', e.response?.data?.message || 'Không thể tạo lịch hẹn');
    } finally {
       setSubmitting(false);
    }
  };

  const toggleService = (id: string) => {
    setSelectedServices(prev => 
       prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
       <View style={styles.modalBg}>
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
             <View style={styles.modalHeader}>
               <Text style={[styles.modalTitle, { color: colors.primary }]}>Thêm lịch hẹn</Text>
               <TouchableOpacity onPress={onClose}>
                 <MaterialIcons name="close" size={24} color={colors.primary} />
               </TouchableOpacity>
             </View>
             
             {loading ? <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} /> : (
               <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: 40 }}>
                 <Text style={[styles.label, { color: colors.primary }]}>Khách hàng vãng lai</Text>
                 <TextInput 
                   style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                   placeholder="Tên khách hàng"
                   placeholderTextColor={colors.muted}
                   value={guestName}
                   onChangeText={setGuestName}
                 />
                 <TextInput 
                   style={[styles.input, { borderColor: colors.border, color: colors.text, marginTop: 12 }]}
                   placeholder="Số điện thoại (Tuỳ chọn)"
                   placeholderTextColor={colors.muted}
                   keyboardType="phone-pad"
                   value={guestPhone}
                   onChangeText={setGuestPhone}
                 />

                 <Text style={[styles.label, { color: colors.primary, marginTop: 24 }]}>Chọn giờ ({selectedDate})</Text>
                 <View style={styles.timeGrid}>
                   {slots.map((slot, idx) => {
                      const isSelected = selectedTime === slot.time;
                      return (
                        <TouchableOpacity 
                          key={idx} 
                          style={[styles.timeSlot, isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                          onPress={() => setSelectedTime(slot.time)}
                        >
                          <Text style={[styles.timeText, isSelected && { color: '#fff' }]}>{slot.time}</Text>
                        </TouchableOpacity>
                      )
                   })}
                 </View>

                 <Text style={[styles.label, { color: colors.primary, marginTop: 24 }]}>Chọn dịch vụ</Text>
                 {services.map((svc, idx) => {
                    const isSelected = selectedServices.includes(svc._id);
                    return (
                      <View key={idx} style={[styles.serviceRow, { borderBottomColor: colors.border }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.serviceName, { color: colors.primary }]}>{svc.name}</Text>
                          <Text style={{ color: colors.secondary, fontSize: 13, marginTop: 4 }}>{svc.price?.toLocaleString()}đ</Text>
                        </View>
                        <Switch 
                          value={isSelected} 
                          onValueChange={() => toggleService(svc._id)}
                          trackColor={{ true: colors.primary, false: colors.border }}
                        />
                      </View>
                    )
                 })}
               </ScrollView>
             )}

             <View style={styles.modalFooter}>
               <TouchableOpacity 
                 style={[styles.filledBtn, { backgroundColor: colors.primary, width: '100%', opacity: submitting ? 0.7 : 1 }]} 
                 onPress={handleCreate}
                 disabled={submitting}
               >
                 {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.filledText}>Tạo lịch hẹn</Text>}
               </TouchableOpacity>
             </View>
          </View>
       </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#00000010',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalBody: {
    padding: 20,
  },
  label: {
    fontSize: 15,
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
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  timeText: {
    fontSize: 14,
    color: '#333',
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#00000010',
  },
  filledBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filledText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
