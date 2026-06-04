import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DiseaseCard from '../components/DiseaseCard';
import { getFavoriteIds, toggleFavoriteId } from '../utils/favoritesStorage';
import { useAppTheme } from '../context/ThemeContext';

// Load master DB once
const ALL_DISEASES = require('../assets/diseases.json').diseases;
const BY_ID = Object.fromEntries(ALL_DISEASES.map((d) => [d.id, d]));

export default function FavoritesScreen({ navigation }) {
  const { colors } = useAppTheme();
  const [favorites, setFavorites] = useState([]);

  useFocusEffect(
    useCallback(() => {
      getFavoriteIds().then((ids) => {
        setFavorites(ids.map((id) => BY_ID[id]).filter(Boolean));
      });
    }, [])
  );

  const handleRemove = async (disease) => {
    await toggleFavoriteId(disease.id);
    setFavorites((prev) => prev.filter((d) => d.id !== disease.id));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['bottom']}>
      <FlatList
        data={favorites}
        keyExtractor={(d) => d.id}
        renderItem={({ item }) => (
          <DiseaseCard
            disease={item}
            bookmarked
            onBookmark={() => handleRemove(item)}
            onPress={() => navigation.navigate('DiseaseDetail', { disease: item })}
          />
        )}
        contentContainerStyle={
          favorites.length === 0 ? styles.emptyContainer : { paddingBottom: 32, paddingTop: 8 }
        }
        ListHeaderComponent={
          favorites.length > 0 ? (
            <Text style={[styles.countLabel, { color: colors.subtle }]}>
              {favorites.length} saved condition{favorites.length !== 1 ? 's' : ''}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <LinearGradient colors={['#007AFF22', '#007AFF11']} style={styles.emptyCircle}>
              <Ionicons name="heart-outline" size={52} color={colors.primary} />
            </LinearGradient>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Saved Conditions</Text>
            <Text style={[styles.emptyBody, { color: colors.subtle }]}>
              No bookmarked remedies yet.{'\n'}Save your first one from the Home screen.
            </Text>
            <TouchableOpacity
              style={[styles.browseBtn, { backgroundColor: colors.primary }]}
              onPress={() => navigation.getParent()?.navigate('HomeTab')}
            >
              <Ionicons name="home-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.browseBtnText}>Browse Conditions</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1 },
  countLabel:     { fontSize: 13, fontFamily: 'Poppins_400Regular', marginHorizontal: 20, marginTop: 12, marginBottom: 4 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  emptyWrap:      { alignItems: 'center', padding: 32 },
  emptyCircle:    { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyTitle:     { fontSize: 22, fontFamily: 'Poppins_700Bold', marginBottom: 10 },
  emptyBody:      { fontSize: 14, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  browseBtn:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 13, borderRadius: 12 },
  browseBtnText:  { color: '#fff', fontFamily: 'Poppins_700Bold', fontSize: 15 },
});
