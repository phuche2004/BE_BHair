import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/useAuthStore';
import { Colors, Fonts } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { useTranslation } from '../../hooks/useTranslation';
import { FloatingBubble } from '../../components/ui/floating-bubble';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
    const router = useRouter();
    const theme = useColorScheme() ?? 'light';
    const colors = Colors[theme];
    const { t } = useTranslation();
    const primaryText = colors.onPrimary;
    const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
    const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
    const expoOwner = Constants.expoConfig?.owner;
    const expoSlug = Constants.expoConfig?.slug;
    const proxyRedirectUri = expoOwner && expoSlug
        ? `https://auth.expo.io/@${expoOwner}/${expoSlug}`
        : 'https://auth.expo.io/@phuche2004/b-hair';
    const redirectUri = isExpoGo
        ? proxyRedirectUri
        : AuthSession.makeRedirectUri({
            native: 'com.bhair.app:/oauthredirect',
            scheme: 'com.bhair.app',
        });

    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const login = useAuthStore((state) => state.login);

    // Google Auth Request
    // Note: To work in Expo Go, it uses a proxy. In Standalone (APK), it uses the Native ID.
    const [request, response, promptAsync] = Google.useAuthRequest({
        androidClientId: isExpoGo ? undefined : androidClientId,
        iosClientId: isExpoGo ? undefined : iosClientId,
        webClientId,
        clientId: isExpoGo ? webClientId : undefined,
        redirectUri,
    });

    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            handleGoogleAuth(id_token);
        }
    }, [response]);

    const handleGoogleAuth = async (idToken: string) => {
        try {
            setLoading(true);
            setErrorMsg('');
            const data = await authApi.googleLogin(idToken);
            await login(data.user, data.token);
            router.replace('/(tabs)');
        } catch (error: any) {
            console.error('Google Login Error:', error.response?.data || error.message || error);
            const message = error.response?.data?.message || 'Đăng nhập Google thất bại';
            setErrorMsg(message);
            Alert.alert(t('auth.error'), message);
        } finally {
            setLoading(false);
        }
    };

    const bubbles = useMemo(() => {
        const zones = [
            { minContainerTop: -10, maxContainerTop: 35 }, // Top Zone
            { minContainerTop: 55, maxContainerTop: 90 }, // Bottom Zone
        ];

        const isDark = theme === 'dark';

        return zones.flatMap((zone, zoneIdx) => {
            const count = Math.floor(Math.random() * 2) + 1; // 1 to 2 bubbles per zone for cleaner look
            return Array.from({ length: count }).map((_, i) => ({
                id: `${zoneIdx}-${i}`,
                size: Math.floor(Math.random() * 100) + 120, // 120 to 220
                top: `${Math.floor(Math.random() * (zone.maxContainerTop - zone.minContainerTop)) + zone.minContainerTop}%`,
                left: `${Math.floor(Math.random() * 80) - 5}%`, // -5% to 75%
                opacity: isDark
                    ? Math.random() * 0.15 + 0.12  // Dark: 12% - 27%
                    : Math.random() * 0.30 + 0.55, // Light: 25% - 45% (Boosted contrast)
                duration: Math.floor(Math.random() * 3000) + 4000, // Faster: 4s - 7s
                delay: Math.floor(Math.random() * 3000),
                displacement: Math.floor(Math.random() * 40) + 120, // 30 to 70
                color: isDark ? colors.accent : colors.highlight,
            }));
        });
    }, [theme, colors]);

    const handleLogin = async () => {
        if (!phoneNumber || !password) {
            Alert.alert(t('auth.error'), t('auth.fillAllFields'));
            return;
        }

        try {
            setLoading(true);
            setErrorMsg('');
            const data = await authApi.login(phoneNumber, password);
            // login function in store will save token to AsyncStorage
            await login(data.user, data.token);
            router.replace('/(tabs)');
        } catch (error: any) {
            console.error('Login Error:', error.response?.data || error.message || error);
            const message = error.response?.data?.message || t('auth.loginFailed');
            setErrorMsg(message);
            Alert.alert(t('auth.error'), message);
        } finally {
            setLoading(false);
        }
    };

    const handleGooglePress = async () => {
        if (isExpoGo) {
            Alert.alert(
                t('auth.error'),
                'Google Sign-In không hỗ trợ trên Expo Go (proxy đã bị gỡ). Hãy dùng Dev Build hoặc APK.'
            );
            return;
        }
        await promptAsync();
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
                {bubbles.map((b: any) => (
                    <FloatingBubble
                        key={b.id}
                        size={b.size}
                        color={b.color}
                        top={b.top}
                        left={b.left}
                        opacity={b.opacity}
                        duration={b.duration}
                        delay={b.delay}
                        displacement={b.displacement}
                    />
                ))}

                <View style={styles.headerContainer}>
                    <Text style={[styles.brand, { color: theme === 'dark' ? colors.text : colors.primary }]}>B_Hair</Text>
                    <Text style={[styles.tagline, { color: colors.secondary }]}>ĐẶT LỊCH CẮT TÓC</Text>
                </View>

                <View style={[styles.card, { backgroundColor: theme === 'dark' ? colors.surface : colors.cardAlt, borderColor: colors.border }]}>
                    <View style={styles.formContainer}>
                        <View style={styles.fieldBlock}>
                            <Text style={[styles.label, { color: theme === 'dark' ? colors.text : colors.muted }]}>{t('auth.phoneLabel')}</Text>
                            <View style={[styles.inputRow, { borderBottomColor: colors.border }]}>
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder={t('auth.phonePlaceholder')}
                                    placeholderTextColor={theme === 'dark' ? '#FFFFFF40' : `${colors.outline}99`}
                                    keyboardType="phone-pad"
                                    value={phoneNumber}
                                    onChangeText={setPhoneNumber}
                                    autoCapitalize="none"
                                />
                                <MaterialIcons name="phone" size={20} color={colors.outline} />
                            </View>
                        </View>

                        <View style={styles.fieldBlock}>
                            <Text style={[styles.label, { color: theme === 'dark' ? colors.text : colors.muted }]}>{t('auth.passwordLabel')}</Text>
                            <View style={[styles.inputRow, { borderBottomColor: colors.border }]}>
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    placeholder={t('auth.passwordPlaceholder')}
                                    placeholderTextColor={theme === 'dark' ? '#FFFFFF40' : `${colors.outline}99`}
                                    secureTextEntry
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <MaterialIcons name="lock" size={20} color={colors.outline} />
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
                            onPress={handleLogin}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color={primaryText} />
                            ) : (
                                <Text style={[styles.buttonText, { color: primaryText }]}>{t('auth.signIn')}</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.linkBtn} activeOpacity={0.8}>
                            <Text style={[styles.linkText, { color: colors.secondary }]}>{t('auth.forgotPassword')}</Text>
                        </TouchableOpacity>

                        <View style={styles.dividerRow}>
                            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                            <Text style={[styles.dividerText, { color: colors.outline }]}>Hoặc</Text>
                            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                        </View>

                        <TouchableOpacity
                            style={[styles.googleButton, { borderColor: colors.border }]}
                            onPress={handleGooglePress}
                            disabled={!request || loading}
                            activeOpacity={0.8}
                        >
                            <FontAwesome5 name="google" size={18} color={colors.text} />
                            <Text style={[styles.googleButtonText, { color: colors.text }]}>Đăng nhập với Google</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.secondaryButton, { borderColor: colors.border }]}
                            onPress={(() => router.push('/auth/register')) as any}
                            activeOpacity={0.8}
                        >
                            <MaterialIcons name="account-circle" size={20} color={colors.secondary} />
                            <Text style={[styles.secondaryText, { color: colors.secondary }]}>{t('auth.signUp')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.footerIcons}>
                    <MaterialIcons name="share" size={20} color={colors.outline} />
                    <MaterialIcons name="language" size={20} color={colors.outline} />
                    <MaterialIcons name="help-outline" size={20} color={colors.outline} />
                </View>
                <Text style={[styles.footerCopy, { color: colors.outline }]}>B_HAIR ATELIER © 2026</Text>
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
        justifyContent: 'center',
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    brand: {
        fontSize: 42,
        fontWeight: '700',
        letterSpacing: -0.5,
        fontFamily: Fonts.headline,
    },
    tagline: {
        marginTop: 6,
        fontSize: 11,
        letterSpacing: 3,
        fontWeight: '600',
    },
    card: {
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 4,
    },
    formContainer: {
        width: '100%',
        gap: 18,
    },
    fieldBlock: {
        gap: 6,
    },
    label: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        paddingVertical: 6,
    },
    input: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 6,
        paddingHorizontal: 4,
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
        lineHeight: 16,
    },
    button: {
        height: 52,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
        elevation: 2,
    },
    buttonText: {
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.4,
    },
    linkBtn: {
        alignSelf: 'center',
        marginTop: 6,
    },
    linkText: {
        fontSize: 13,
        fontWeight: '600',
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 4,
    },
    dividerLine: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        fontSize: 10,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    secondaryButton: {
        height: 52,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    secondaryText: {
        fontSize: 14,
        fontWeight: '600',
    },
    googleButton: {
        height: 52,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 12,
        marginTop: 4,
    },
    googleButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    footerIcons: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
        marginTop: 24,
    },
    footerCopy: {
        textAlign: 'center',
        fontSize: 10,
        letterSpacing: 2,
        marginTop: 12,
        fontWeight: '600',
    }
});
