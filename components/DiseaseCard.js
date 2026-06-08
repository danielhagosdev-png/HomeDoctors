import React, { useRef } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Animated,
  useColorScheme,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { getCategoryMeta } from '../utils/imageMapper';

export default function DiseaseCard({ disease, onPress, onBookmark, bookmarked = false }) {
  const isDark = useColorScheme() === 'dark';
  const colors = isDark ? dark : light;
  const scale  = useRef(new Animated.Value(1)).current;
  const meta   = getCategoryMeta(disease.category_id || disease.category || '');

  const onPressIn  = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  };
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();

  return (
    <Animated.View style={[styles.wrap, { transform: [{ scale }] }]}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card }]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        {/* Gradient swatch replacing grey image box */}
        <LinearGradient
          colors={meta.gradient}
          style={styles.swatch}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.swatchEmoji}>{meta.emoji}</Text>
        </LinearGradient>

        {/* Text */}
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
            {disease.name}
          </Text>
          <Text style={[styles.intro, { color: colors.subtle }]} numberOfLines={2}>
            {disease.intro}
          </Text>
          <View style={[styles.tag, { backgroundColor: meta.accent + '20', borderColor: meta.accent + '50' }]}>
            <Text style={[styles.tagText, { color: meta.accent }]}>
              {disease.category || meta.label}
            </Text>
          </View>
        </View>

        {/* Bookmark */}
        {onBookmark && (
          <TouchableOpacity
            style={styles.bookmarkBtn}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onBookmark(); }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={bookmarked ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={bookmarked ? '#1a8fe3' : colors.subtle}
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const light = { card: '#FFFFFF', text: '#1a1a2e', subtle: '#666' };
const dark  = { card: '#1E1E2E', text: '#E0E0FF', subtle: '#AAA' };

const styles = StyleSheet.create({
  wrap: { marginHorizontal: 16, marginVertical: 6 },
  card: {
    flexDirection: 'row',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.09,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  swatch: {
    width: 70,
    height: 70,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  swatchEmoji: { fontSize: 32 },
  info: { flex: 1, marginLeft: 14, marginRight: 4 },
  name: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 22,
    marginBottom: 3,
  },
  intro: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 17,
    marginBottom: 6,
  },
  tag: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagText: { fontSize: 10, fontFamily: 'Poppins_600SemiBold' },
  bookmarkBtn: { paddingLeft: 4 },
});
