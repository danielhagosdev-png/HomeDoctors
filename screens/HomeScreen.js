import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, StatusBar, TextInput, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORIES, searchDiseases, TOTAL_DISEASES } from '../services/api';
import { getCategoryMeta } from '../utils/imageMapper';
import DisclaimerModal from '../components/DisclaimerModal';
import DiseaseCard from '../components/DiseaseCard';
import { hasAcceptedDisclaimer, acceptDisclaimer } from '../utils/storage';
import { useAppTheme } from '../context/ThemeContext';

function CategoryCard({ item, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const meta  = getCategoryMeta(item.id);
  const onIn  = () => Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, speed: 50 }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 30 }).start();

  return (
    <Animated.View style={[styles.catWrap, { transform: [{ scale }] }]}>
      <TouchableOpacity onPress={onPress} onPressIn={onIn} onPressOut={onOut} activeOpacity={1}>
        <LinearGradient colors={meta.gradient} style={styles.catCard}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.catIconCircle}>
            <Ionicons name={meta.icon} size={26} color="#fff" />
          </View>
          <Text style={styles.catLabel} numberOfLines={2}>{item.label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HomeScreen({ navigation }) {
  const { isDark, colors } = useAppTheme();
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [query,          setQuery]          = useState('');
  const [results,        setResults]        = useState([]);
  const [isSearching,    setIsSearching]    = useState(false);

  useEffect(() => {
    (async () => {
      if (!(await hasAcceptedDisclaimer())) setShowDisclaimer(true);
    })();
  }, []);

  const handleAccept = async () => { await acceptDisclaimer(); setShowDisclaimer(false); };

  const handleSearch = useCallback((text) => {
    setQuery(text);
    if (text.trim().length < 2) { setIsSearching(false); setResults([]); return; }
    setIsSearching(true);
    setResults(searchDiseases(text));
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <DisclaimerModal visible={showDisclaimer} onAccept={handleAccept} />

      {/* Header */}
      <LinearGradient
        colors={isDark ? ['#1a1a2e', '#121212'] : ['#e8f4ff', '#F8F9FA']}
        style={styles.header}
      >
        <View style={styles.titleRow}>
          <View>
            <Text style={[styles.appTitle, { color: colors.text }]}>Home Doctors</Text>
            <Text style={[styles.appSub,   { color: colors.subtle }]}>
              {TOTAL_DISEASES.toLocaleString()} conditions · {CATEGORIES.length} categories
            </Text>
          </View>
          <View style={[styles.logoCircle, { backgroundColor: colors.primary + '22' }]}>
            <Ionicons name="medkit" size={24} color={colors.primary} />
          </View>
        </View>

        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={18} color={colors.subtle} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search any disease or symptom…"
            placeholderTextColor={colors.subtle}
            value={query}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setIsSearching(false); setResults([]); }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={18} color={colors.subtle} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Search results */}
      {isSearching ? (
        <FlatList
          key="search-list"
          data={results}
          keyExtractor={(d) => d.id}
          renderItem={({ item }) => (
            <DiseaseCard
              disease={item}
              onPress={() => navigation.navigate('DiseaseDetail', { disease: item })}
            />
          )}
          contentContainerStyle={{ paddingVertical: 8, paddingBottom: 32 }}
          ListHeaderComponent={
            <Text style={[styles.resultsLabel, { color: colors.subtle }]}>
              {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>🔎</Text>
              <Text style={[styles.emptyText, { color: colors.subtle }]}>No results found.</Text>
            </View>
          }
          keyboardShouldPersistTaps="handled"
        />
      ) : (
        <FlatList
          key="category-grid"
          data={CATEGORIES}
          keyExtractor={(c) => c.id}
          numColumns={2}
          renderItem={({ item }) => (
            <CategoryCard
              item={item}
              onPress={() => navigation.navigate('DiseaseList', { category: item })}
            />
          )}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  header:       { paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14 },
  titleRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  appTitle:     { fontSize: 26, fontFamily: 'Poppins_800ExtraBold' },
  appSub:       { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  logoCircle:   { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 12, height: 46,
  },
  searchInput:  { flex: 1, fontSize: 14, fontFamily: 'Poppins_400Regular' },
  grid:         { paddingHorizontal: 10, paddingBottom: 32, paddingTop: 8 },
  catWrap:      { flex: 1, margin: 6 },
  catCard: {
    borderRadius: 18, padding: 16, minHeight: 118,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.12,
    shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  catIconCircle: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  catLabel:     { fontSize: 12, fontFamily: 'Poppins_700Bold', color: '#fff', textAlign: 'center' },
  resultsLabel: { fontSize: 13, fontFamily: 'Poppins_400Regular', marginHorizontal: 20, marginVertical: 8 },
  emptyWrap:    { alignItems: 'center', paddingTop: 60 },
  emptyEmoji:   { fontSize: 48, marginBottom: 12 },
  emptyText:    { fontSize: 15, fontFamily: 'Poppins_400Regular' },
});
