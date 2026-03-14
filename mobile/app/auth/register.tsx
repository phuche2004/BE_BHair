import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { authApi } from '../../api/auth.api';
import { Colors, Fonts } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { useTranslation } from '../../hooks/useTranslation';

export default function RegisterScreen() {
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { t } = useTranslation();
  const primaryText = theme === 'dark' ? colors.text : '#FFF';

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegister = async () => {
    if (!fullName || !phoneNumber || !password) {
      Alert.alert(t('auth.error'), t('auth.fillAllFields'));
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      await authApi.register(fullName, phoneNumber, password);
      Alert.alert(t('auth.success'), t('auth.registerSuccess'), [
        { text: t('auth.ok'), onPress: (() => router.replace('/auth/login')) as any }
      ]);
    } catch (error: any) {
      console.error('Register Error:', error.response?.data || error.message || error);
      const message = error.response?.data?.message || t('auth.registerFailed');
      setErrorMsg(message);
      Alert.alert(t('auth.error'), message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[{ backgroundColor: colors.background, flex: 1 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.glow, { backgroundColor: colors.highlight }]} />

        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <MaterialIcons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.brand, { color: colors.text }]}>B_Hair</Text>
          <View style={styles.iconBtn} />
        </View>

        <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: colors.text }]}>{t('auth.createAccount')}</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>{t('auth.joinToday')}</Text>
        </View>

        <View style={[styles.formContainer, { backgroundColor: theme === 'dark' ? colors.surface : colors.cardAlt, borderColor: colors.border }]}>
          <View style={styles.fieldBlock}>
            <Text style={[styles.label, { color: colors.secondary }]}>{t('auth.fullNameLabel')}</Text>
            <View style={[styles.inputRow, { borderBottomColor: colors.border }]}>
              <MaterialIcons name="person" size={20} color={colors.outline} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={t('auth.fullNamePlaceholder')}
                placeholderTextColor={theme === 'dark' ? '#FFFFFF40' : `${colors.outline}99`}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={[styles.label, { color: colors.secondary }]}>{t('auth.phoneLabel')}</Text>
            <View style={[styles.inputRow, { borderBottomColor: colors.border }]}>
              <MaterialIcons name="phone" size={20} color={colors.outline} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={t('auth.phonePlaceholder')}
                placeholderTextColor={theme === 'dark' ? '#FFFFFF40' : `${colors.outline}99`}
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={[styles.label, { color: colors.secondary }]}>{t('auth.passwordLabel')}</Text>
            <View style={[styles.inputRow, { borderBottomColor: colors.border }]}>
              <MaterialIcons name="lock" size={20} color={colors.outline} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={t('auth.passwordPlaceholder')}
                placeholderTextColor={theme === 'dark' ? '#FFFFFF40' : `${colors.outline}99`}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              <MaterialIcons name="visibility" size={20} color={colors.outline} />
            </View>
          </View>

          {!!errorMsg && (
            <View style={[styles.errorBox, { backgroundColor: theme === 'dark' ? `${colors.error}33` : `${colors.errorContainer}` }]}>
              <MaterialIcons name="error-outline" size={18} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{errorMsg}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={primaryText} />
            ) : (
              <Text style={[styles.buttonText, { color: primaryText }]}>{t('auth.signUp')}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={(() => router.push('/auth/login')) as any} style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.outline }]}>{t('auth.haveAccount')}</Text>
            <Text style={[styles.footerLink, { color: colors.secondary }]}>{t('auth.signIn')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  glow: {
    position: 'absolute',
    top: -140,
    right: -100,
    width: 260,
    height: 260,
    borderRadius: 140,
    opacity: 0.25,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
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
  },
  headerContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: Fonts.headline,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 6,
  },
  formContainer: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    gap: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  fieldBlock: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    letterSpacing: 1.4,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 6,
    fontFamily: Fonts.body,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#00000012',
  },
  errorText: {
    fontSize: 12,
    flex: 1,
  },
  button: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  footerText: {
    fontSize: 13,
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '700',
  }
});
