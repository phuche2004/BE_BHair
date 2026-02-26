import { Stack } from 'expo-router';
import { useTranslation } from '../../hooks/useTranslation';

export default function BookingLayout() {
    const { t } = useTranslation();

    return (
        <Stack>
            <Stack.Screen name="index" options={{ title: t('booking.title'), headerBackTitle: t('common.back') }} />
        </Stack>
    );
}
