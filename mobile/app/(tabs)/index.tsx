import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { useTranslation } from '../../hooks/useTranslation';
import { shopApi } from '../../api/shop.api';
import { useFocusEffect } from 'expo-router';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { t } = useTranslation();
  const router = useRouter();

  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      const fetchShops = async () => {
        try {
          setLoading(true);
          const data = await shopApi.getAllShops();
          setShops(data.data || data); // Depending on exact backend wrap
        } catch (error) {
          console.error('Failed to fetch shops', error);
        } finally {
          setLoading(false);
        }
      };
      fetchShops();
    }, [])
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t('home.featuredShops')}</Text>
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : shops.length === 0 ? (
          <Text style={{ color: colors.icon }}>No shops found.</Text>
        ) : (
          shops.map((shop) => (
            <TouchableOpacity
              key={shop._id}
              style={[styles.card, { backgroundColor: theme === 'dark' ? '#3E2723' : '#FFF', borderColor: colors.secondary }]}
              onPress={() => router.push({ pathname: '/shop/[id]', params: { id: shop._id } } as any)}
            >
              <Text style={[styles.cardTitle, { color: colors.text }]}>{shop.name}</Text>
              <Text style={{ color: colors.icon }}>{shop.address}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: 20,
  },
  card: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  }
});
