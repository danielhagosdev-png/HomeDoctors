import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DiseaseCard from '../components/DiseaseCard';
import { fetchDiseasesByCategory } from '../services/api';
import { getCategoryMeta } from '../utils/imageMapper';
import { toggleFavoriteId, isFavorite } from '../utils/favoritesStorage';
import { useAppTheme } from '../context/ThemeContext';

export default function DiseaseListScreen({ route, navigation }) {
  const { category } = route.params;
  const { colors } = useAppTheme();
  const meta    = getCategoryMeta(category.id);

  const [diseases,    setDiseases]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [error,       setError]       = useState(null);
  const [bookmarkedIds, setBookmarkedIds] = useState({});

  useEffect(() => {
    navigation.setOptions({ title: category.label });
    load();
  }, []);

  const load = useCallback(async () => {
    try {
      setError(null);
      const list = await fetchDiseasesByCategory(category.id);
      setDiseases(list);

      // Load bookmark states
      const bm = {};
      await Promise.all(list.map(async (d) => { bm[d.id] = await isFavorite(d.id); }));
      setBookmarkedIds(bm);
    } catch (e) {
      setError('Could not load conditions. Tap to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [category.id]);

  const handleBookmark = async (disease) => {
    const nowFavorited = await toggleFavoriteId(disease.id);
    setBookmarkedIds((prev) => ({ ...prev, [disease.id]: nowFavorited }));
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={meta.accent} />
        <Text style={[styles.loadingText, { color: colors.subtle }]}>Loading…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bg }]}>
        <Text style={styles.errEmoji}>⚠️</Text>
        <Text style={[styles.errText, { color: colors.text }]}>{error}</Text>
        <TouchableOpacity style={[styles.retryBtn, { backgroundColor: meta.accent }]}
          onPress={() => { setLoading(true); load(); }}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['bottom']}>
      <FlatList
        data={diseases}
        keyExtractor={(d) => d.id}
        renderItem={({ item }) => (
          <DiseaseCard
            disease={item}
            bookmarked={!!bookmarkedIds[item.id]}
            onBookmark={() => handleBookmark(item)}
            onPress={() => navigation.navigate('DiseaseDetail', { disease: item })}
          />
        )}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={meta.accent} colors={[meta.accent]} />
        }
        ListHeaderComponent={
          <LinearGradient colors={meta.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.listHeader}>
            <Text style={styles.listHeaderEmoji}>{meta.emoji}</Text>
            <Text style={styles.listHeaderTitle}>{category.label}</Text>
            <Text style={styles.listHeaderCount}>{diseases.length} conditions</Text>
          </LinearGradient>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1 },
  centered:       { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText:    { marginTop: 12, fontFamily: 'Poppins_400Regular', fontSize: 14 },
  errEmoji:       { fontSize: 48, marginBottom: 12 },
  errText:        { fontSize: 15, fontFamily: 'Poppins_400Regular', textAlign: 'center', marginBottom: 20 },
  retryBtn:       { paddingHorizontal: 32, paddingVertical: 12, borderRadius: 12 },
  retryText:      { color: '#fff', fontFamily: 'Poppins_700Bold', fontSize: 15 },
  listHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  listHeaderEmoji: { fontSize: 48, marginBottom: 8 },
  listHeaderTitle: { fontSize: 24, fontFamily: 'Poppins_800ExtraBold', color: '#fff' },
  listHeaderCount: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.85)', marginTop: 4 },
});
