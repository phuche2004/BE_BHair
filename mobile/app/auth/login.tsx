import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/useAuthStore';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { useTranslation } from '../../hooks/useTranslation';

export default function LoginScreen() {
    const router = useRouter();
    const theme = useColorScheme() ?? 'light';
    const colors = Colors[theme];
    const { t } = useTranslation();

    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const login = useAuthStore((state) => state.login);

    const handleLogin = async () => {
        if (!phoneNumber || !password) {
            Alert.alert(t('auth.error'), t('auth.fillAllFields'));
            return;
        }

        try {
            setLoading(true);
            const data = await authApi.login(phoneNumber, password);
            // login function in store will save token to AsyncStorage
            await login(data.user, data.token);
            router.replace('/(tabs)');
        } catch (error: any) {
            console.error('Login Error:', error.response?.data || error.message || error);
            const message = error.response?.data?.message || t('auth.loginFailed');
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
                <View style={styles.headerContainer}>
                    <Text style={[styles.title, { color: colors.primary }]}>B_Hair</Text>
                    <Text style={[styles.subtitle, { color: colors.text }]}>{t('auth.welcomeBack')}</Text>
                </View>

                <View style={styles.formContainer}>
                    <Text style={[styles.label, { color: colors.text }]}>{t('auth.phoneLabel')}</Text>
                    <TextInput
                        style={[styles.input, { color: colors.text, borderColor: colors.secondary, backgroundColor: theme === 'dark' ? '#3E2723' : '#FFF' }]}
                        placeholder={t('auth.phonePlaceholder')}
                        placeholderTextColor={colors.icon}
                        keyboardType="phone-pad"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        autoCapitalize="none"
                    />

                    <Text style={[styles.label, { color: colors.text }]}>{t('auth.passwordLabel')}</Text>
                    <TextInput
                        style={[styles.input, { color: colors.text, borderColor: colors.secondary, backgroundColor: theme === 'dark' ? '#3E2723' : '#FFF' }]}
                        placeholder={t('auth.passwordPlaceholder')}
                        placeholderTextColor={colors.icon}
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: colors.primary }]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={Colors.light.background} />
                        ) : (
                            <Text style={styles.buttonText}>{t('auth.signIn')}</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={{ color: colors.text }}>{t('auth.noAccount')}</Text>
                        <TouchableOpacity onPress={(() => router.push('/auth/register')) as any}>
                            <Text style={[styles.link, { color: colors.primary }]}>{t('auth.signUp')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center',
    },
    headerContainer: {
        marginBottom: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        opacity: 0.8,
    },
    formContainer: {
        width: '100%',
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 16,
        marginBottom: 20,
        fontSize: 16,
    },
    button: {
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    link: {
        fontWeight: 'bold',
    }
});
