import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { HapticTouch } from './haptic-touch';
import { MaterialIcons } from '@expo/vector-icons';
import { serviceApi } from '../../api/service.api';

interface ServiceFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  shopId: string;
  initialData?: any; // If provided, it's an edit
}

export function ServiceFormModal({ visible, onClose, onSuccess, shopId, initialData }: ServiceFormModalProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const isDark = theme === 'dark';

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [managerExtraFee, setManagerExtraFee] = useState('');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setName(initialData.name || '');
        setPrice(initialData.price?.toString() || '');
        setManagerExtraFee(initialData.managerExtraFee?.toString() || '0');
        setDuration(initialData.duration?.toString() || '30');
        setDescription(initialData.description || '');
      } else {
        setName('');
        setPrice('');
        setManagerExtraFee('0');
        setDuration('30');
        setDescription('');
      }
    }
  }, [visible, initialData]);

  const handleSave = async () => {
    if (!name || !price || !duration) {
      Alert.alert('Lỗi', 'Vui lòng nhập Tên, Giá và Thời gian');
      return;
    }

    try {
      setLoading(true);
      const data = {
        shopId,
        name,
        price: Number(price),
        managerExtraFee: Number(managerExtraFee),
        duration: Number(duration),
        description,
      };

      if (initialData?._id) {
        await serviceApi.updateService(initialData._id, data);
      } else {
        await serviceApi.createService(data);
      }

      onSuccess();
      onClose();
    } catch (e: any) {
      console.log(e);
      Alert.alert('Lỗi', e.response?.data?.message || 'Không thể lưu dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={[styles.overlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.primary }]}>
              {initialData ? 'Sửa dịch vụ' : 'Thêm dịch vụ mới'}
            </Text>
            <HapticTouch onPress={onClose}>
              <MaterialIcons name="close" size={24} color={colors.text} />
            </HapticTouch>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.secondary }]}>Tên dịch vụ *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                value={name}
                onChangeText={setName}
                placeholder="VD: Cắt tóc nam"
                placeholderTextColor={colors.muted}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.secondary }]}>Giá (VNĐ) *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                  placeholder="VD: 50000"
                  placeholderTextColor={colors.muted}
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.secondary }]}>Thời gian (phút) *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  value={duration}
                  onChangeText={setDuration}
                  keyboardType="numeric"
                  placeholder="VD: 30"
                  placeholderTextColor={colors.muted}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.secondary }]}>Phụ thu Manager (VNĐ)</Text>
              <Text style={[styles.hint, { color: colors.muted }]}>Mức phí cộng thêm nếu đích thân Quản lý (Manager) cắt</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                value={managerExtraFee}
                onChangeText={setManagerExtraFee}
                keyboardType="numeric"
                placeholder="VD: 20000"
                placeholderTextColor={colors.muted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.secondary }]}>Mô tả chi tiết</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Nhập mô tả..."
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <HapticTouch
              style={[styles.btnSave, { backgroundColor: colors.primary }]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={isDark ? '#000' : '#FFF'} />
              ) : (
                <Text style={[styles.btnSaveText, { color: isDark ? '#000' : '#FFF' }]}>Lưu dịch vụ</Text>
              )}
            </HapticTouch>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#00000010',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  body: {
    padding: 20,
  },
  row: {
    flexDirection: 'row',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    marginBottom: 8,
    marginTop: -4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
  },
  btnSave: {
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnSaveText: {
    fontSize: 16,
    fontWeight: '700',
  }
});
