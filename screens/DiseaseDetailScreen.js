import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Animated, Share, LayoutAnimation,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { incrementInterstitialCount } from '../utils/storage';
import { toggleFavoriteId, isFavorite } from '../utils/favoritesStorage';
import { maybeShowInterstitial, AD_UNITS } from '../services/adManager';
import { getCategoryMeta } from '../utils/imageMapper';
import { useAppTheme } from '../context/ThemeContext';

// Safe AdMob import
let BannerAd = null, BannerAdSize = null;
try {
  const admob = require('react-native-google-mobile-ads');
  BannerAd = admob.BannerAd; BannerAdSize = admob.BannerAdSize;
} catch {}

// ── Accordion section ─────────────────────────────────────────────────────────
function AccordionSection({ title, icon, accentColor, children, defaultOpen = false }) {
  const { colors } = useAppTheme();
  const [open, setOpen] = useState(defaultOpen);
  const rotate = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
    Animated.timing(rotate, { toValue: open ? 0 : 1, duration: 220, useNativeDriver: true }).start();
  };

  const arrowRotation = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <View style={[accordion.wrapper, { backgroundColor: colors.card }]}>
      <TouchableOpacity style={accordion.header} onPress={toggle} activeOpacity={0.8}>
        <View style={[accordion.iconBadge, { backgroundColor: accentColor + '22' }]}>
          <Ionicons name={icon} size={18} color={accentColor} />
        </View>
        <Text style={[accordion.title, { color: accentColor }]}>{title}</Text>
        <Animated.View style={{ transform: [{ rotate: arrowRotation }], marginLeft: 'auto' }}>
          <Ionicons name="chevron-down" size={18} color={accentColor} />
        </Animated.View>
      </TouchableOpacity>
      {open && <View style={accordion.body}>{children}</View>}
    </View>
  );
}

const accordion = StyleSheet.create({
  wrapper:   { marginHorizontal: 16, marginBottom: 10, borderRadius: 16, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  header:    { flexDirection: 'row', alignItems: 'center', padding: 14 },
  iconBadge: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  title:     { fontSize: 15, fontFamily: 'Poppins_700Bold', flex: 1 },
  body:      { paddingHorizontal: 16, paddingBottom: 14, paddingTop: 4 },
});

// ── Bullet row ────────────────────────────────────────────────────────────────
function BulletItem({ text, color, index, numbered = false }) {
  const { colors } = useAppTheme();
  return (
    <View style={detail.bulletRow}>
      {numbered ? (
        <View style={[detail.numBadge, { backgroundColor: color }]}>
          <Text style={detail.numText}>{index + 1}</Text>
        </View>
      ) : (
        <View style={[detail.dot, { backgroundColor: color }]} />
      )}
      <Text style={[detail.bulletText, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function DiseaseDetailScreen({ route, navigation }) {
  const { disease }         = route.params;
  const { isDark, colors }  = useAppTheme();
  const meta                = getCategoryMeta(disease.category_id || disease.category || '');
  const shown               = useRef(false);
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: '' });
    (async () => {
      setFavorited(await isFavorite(disease.id));
      if (!shown.current) {
        shown.current = true;
        const count = await incrementInterstitialCount();
        await maybeShowInterstitial(count);
      }
    })();
  }, []);

  // ── Heart / bookmark toggle ──────────────────────────────────────────────────
  const handleFavorite = async () => {
    const now = await toggleFavoriteId(disease.id);
    setFavorited(now);
  };

  // ── Share ────────────────────────────────────────────────────────────────────
  const handleShare = async () => {
    const remedies   = disease.home_remedies || disease.remedies || [];
    const firstTip   = remedies[0] || 'See the app for home remedies.';
    try {
      await Share.share({
        title:   disease.name,
        message: `🩺 ${disease.name}\n\n${disease.intro}\n\n💊 Home tip: ${firstTip}\n\nDownload the Home Doctors app to learn more!`,
      });
    } catch {}
  };

  const remedies    = disease.home_remedies || disease.remedies || [];
  const doctorItems = Array.isArray(disease.doctor_visit_if)
    ? disease.doctor_visit_if
    : disease.seeDoctor ? [disease.seeDoctor] : [];

  return (
    <SafeAreaView style={[detail.container, { backgroundColor: colors.bg }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>

        {/* ── Hero gradient banner ── */}
        <LinearGradient
          colors={meta.gradient}
          style={detail.hero}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          {/* Back */}
          <TouchableOpacity style={detail.heroBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>

          {/* Right-side actions: heart + share */}
          <View style={detail.heroBtnRight}>
            <TouchableOpacity style={detail.heroBtn} onPress={handleFavorite}>
              <Ionicons
                name={favorited ? 'heart' : 'heart-outline'}
                size={22}
                color={favorited ? '#FF6B6B' : '#fff'}
              />
            </TouchableOpacity>
            <TouchableOpacity style={[detail.heroBtn, { marginLeft: 8 }]} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={detail.heroContent}>
            <View style={detail.heroBadge}>
              <Text style={detail.heroBadgeText}>{meta.emoji}  {disease.category || meta.label}</Text>
            </View>
            <Text style={detail.heroEmoji}>{meta.emoji}</Text>
            <Text style={detail.heroTitle}>{disease.name}</Text>
          </View>
        </LinearGradient>

        {/* ── Intro card ── */}
        <View style={[detail.introCard, { backgroundColor: colors.card }]}>
          <Text style={[detail.introText, { color: colors.subtle }]}>{disease.intro}</Text>
        </View>

        {/* ── Accordion sections ── */}
        <AccordionSection title="Causes" icon="flask-outline" accentColor={meta.accent} defaultOpen>
          {(disease.causes || []).map((c, i) => (
            <BulletItem key={i} text={c} color={meta.accent} index={i} />
          ))}
        </AccordionSection>

        <AccordionSection title="Symptoms" icon="pulse-outline" accentColor="#e74c3c" defaultOpen>
          {(disease.symptoms || []).map((s, i) => (
            <BulletItem key={i} text={s} color="#e74c3c" index={i} />
          ))}
        </AccordionSection>

        <AccordionSection title="Home Remedies" icon="leaf-outline" accentColor="#27ae60" defaultOpen>
          {remedies.map((r, i) => (
            <BulletItem key={i} text={r} color="#27ae60" index={i} numbered />
          ))}
        </AccordionSection>

        <AccordionSection title="When to See a Doctor" icon="medkit-outline" accentColor="#e67e22">
          {doctorItems.map((d, i) => (
            <BulletItem key={i} text={d} color="#e67e22" index={i} />
          ))}
        </AccordionSection>

        {/* ── Footer disclaimer ── */}
        <View style={[
          detail.disclaimer,
          { backgroundColor: isDark ? '#1a1a0d' : '#fff8e1', borderColor: '#f39c12' },
        ]}>
          <Ionicons name="warning-outline" size={15} color="#f39c12" style={{ marginRight: 6, marginTop: 1 }} />
          <Text style={[detail.disclaimerText, { color: isDark ? '#f0c040' : '#7d5a00' }]}>
            For educational purposes only. Always consult a qualified healthcare provider.
          </Text>
        </View>
      </ScrollView>

      {/* ── Banner Ad ── */}
      {BannerAd && BannerAdSize && (
        <View style={{ alignItems: 'center' }}>
          <BannerAd
            unitId={AD_UNITS.BANNER}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            requestOptions={{ requestNonPersonalizedAdsOnly: true }}
            onAdFailedToLoad={(e) => console.warn('[AdMob] Banner failed:', e)}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const detail = StyleSheet.create({
  container: { flex: 1 },

  hero: {
    minHeight: 250, paddingTop: 52, paddingBottom: 28,
    paddingHorizontal: 20, justifyContent: 'flex-end',
  },
  heroBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.22)',
    justifyContent: 'center', alignItems: 'center',
  },
  heroBtnRight: {
    position: 'absolute', top: 52, right: 16,
    flexDirection: 'row',
  },
  heroContent: { alignItems: 'flex-start', marginTop: 20 },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 10,
  },
  heroBadgeText: { color: '#fff', fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  heroEmoji:     { fontSize: 44, marginBottom: 6 },
  heroTitle:     { fontSize: 26, fontFamily: 'Poppins_800ExtraBold', color: '#fff', lineHeight: 34 },

  introCard: {
    margin: 16, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  introText: { fontSize: 14, fontFamily: 'Poppins_400Regular', lineHeight: 22 },

  bulletRow: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start' },
  dot:       { width: 8, height: 8, borderRadius: 4, marginTop: 6, marginRight: 10, flexShrink: 0 },
  numBadge:  { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', marginRight: 10, marginTop: 1, flexShrink: 0 },
  numText:   { color: '#fff', fontSize: 11, fontFamily: 'Poppins_700Bold' },
  bulletText:{ flex: 1, fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 20 },

  disclaimer: {
    flexDirection: 'row', alignItems: 'flex-start',
    margin: 16, borderRadius: 12, padding: 12, borderWidth: 1,
  },
  disclaimerText: { flex: 1, fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 18 },
});
