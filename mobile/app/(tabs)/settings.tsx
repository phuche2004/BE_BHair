import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch } from 'react-native';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useTranslation } from '../../hooks/useTranslation';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
    const theme = useColorScheme() ?? 'light';
    const colors = Colors[theme];
    const { user, logout } = useAuthStore();
    const router = useRouter();
    const { t, language: hookLang } = useTranslation();
    const { theme: storedTheme, setTheme, language, setLanguage } = useThemeStore();

    const isDarkMode = storedTheme === 'dark';

    const toggleSwitch = () => {
        setTheme(isDarkMode ? 'light' : 'dark');
    };

    const handleLogout = () => {
        Alert.alert(t('settings.logoutConfirmTitle'), t('settings.logoutConfirmMsg'), [
            { text: t('settings.cancel'), style: 'cancel' },
            {
                text: t('settings.logout'),
                style: 'destructive',
                onPress: async () => {
                    await logout();
                    router.replace('/auth/login' as any);
                }
            }
        ]);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                    <Text style={styles.avatarText}>{user?.fullName?.charAt(0) || 'U'}</Text>
                </View>
                <Text style={[styles.name, { color: colors.text }]}>{user?.fullName || 'User Name'}</Text>
                <Text style={[styles.phone, { color: colors.icon }]}>{user?.phoneNumber || t('settings.noPhone')}</Text>
            </View>

            <View style={styles.section}>
                <View style={[styles.menuItem, { borderBottomColor: colors.secondary }]}>
                    <Text style={[styles.menuText, { color: colors.text }]}>{t('settings.darkMode')}</Text>
                    <Switch
                        trackColor={{ false: colors.secondary, true: colors.primary }}
                        thumbColor={'#FFF'}
                        onValueChange={toggleSwitch}
                        value={isDarkMode}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.menuItem, { borderBottomColor: colors.secondary }]}
                    onPress={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
                >
                    <Text style={[styles.menuText, { color: colors.text }]}>{t('settings.language')}</Text>
                    <Text style={[styles.menuText, { color: colors.primary }]}>
                        {language === 'vi' ? 'Tiếng Việt 🇻🇳' : 'English 🇺🇸'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.secondary }]}>
                    <Text style={[styles.menuText, { color: colors.text }]}>{t('settings.accountSettings')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.secondary }]}>
                    <Text style={[styles.menuText, { color: colors.text }]}>{t('settings.paymentMethods')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.secondary }]}>
                    <Text style={[styles.menuText, { color: colors.text }]}>{t('settings.helpSupport')}</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={[styles.logoutButton, { backgroundColor: colors.primary }]}
                onPress={handleLogout}
            >
                <Text style={styles.logoutText}>{t('settings.logout')}</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        paddingTop: 60,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarText: {
        fontSize: 40,
        color: '#FFF',
        fontWeight: 'bold',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    phone: {
        fontSize: 16,
    },
    section: {
        marginBottom: 40,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    menuText: {
        fontSize: 16,
        fontWeight: '500',
    },
    logoutButton: {
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    logoutText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    }
});
