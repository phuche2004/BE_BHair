import { Stack } from 'expo-router';
import { useTranslation } from '../../hooks/useTranslation';

export default function ShopLayout() {
    const { t } = useTranslation();

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="[id]" options={{ title: t('shop.imageMap'), headerBackTitle: t('common.back') }} />
        </Stack>
    );
}
