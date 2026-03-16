import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
  Alert,
  DeviceEventEmitter,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { HapticTouch } from './haptic-touch';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { useRouter, usePathname, useGlobalSearchParams } from 'expo-router';
import { useTranslation } from '../../hooks/useTranslation';

export const HeaderMenu = () => {
  const [visible, setVisible] = useState(false);
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const router = useRouter();
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const { t } = useTranslation();

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  const handleReload = () => {
    closeMenu();
    
    // Emit an event so screens can refetch data locally
    DeviceEventEmitter.emit('APP_REFRESH_SCREEN');
  };

  const handleReport = () => {
    closeMenu();
    Alert.alert(t('common.report'), t('common.reportSuccess'), [
      { text: t('auth.ok') }
    ]);
  };

  return (
    <View>
      <HapticTouch onPress={openMenu} style={styles.iconBtn}>
        <MaterialIcons name="more-vert" size={22} color={colors.primary} />
      </HapticTouch>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <TouchableWithoutFeedback onPress={closeMenu}>
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.menuContainer,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  top: Platform.OS === 'ios' ? 100 : 70,
                  right: 16,
                },
              ]}
            >
              <HapticTouch style={styles.menuItem} onPress={handleReload}>
                <MaterialIcons name="refresh" size={20} color={colors.primary} />
                <Text style={[styles.menuText, { color: colors.primary }]}>{t('common.reload')}</Text>
              </HapticTouch>
              
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              
              <HapticTouch style={styles.menuItem} onPress={handleReport}>
                <MaterialIcons name="report" size={20} color={colors.error} />
                <Text style={[styles.menuText, { color: colors.error }]}>{t('common.report')}</Text>
              </HapticTouch>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  menuContainer: {
    position: 'absolute',
    minWidth: 150,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginHorizontal: 12,
  },
});
