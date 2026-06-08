import React from 'react';
import {
  View, Text, ScrollView, Switch, TouchableOpacity,
  StyleSheet, Share, Linking, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../context/ThemeContext';
import Constants from 'expo-constants';

const APP_VERSION   = Constants.expoConfig?.version ?? '1.0.0';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.home.doctors';

function SectionHeader({ title, colors }) {
  return <Text style={[styles.sectionHeader, { color: colors.primary }]}>{title.toUpperCase()}</Text>;
}

function SettingRow({ icon, iconColor, label, sublabel, onPress, right, colors, noBorder }) {
  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: colors.card, borderBottomColor: noBorder ? 'transparent' : colors.border }]}
      onPress={() => { if (onPress) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); } }}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.rowIcon, { backgroundColor: (iconColor ?? colors.primary) + '18' }]}>
        <Ionicons name={icon} size={20} color={iconColor ?? colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
        {sublabel ? <Text style={[styles.rowSub, { color: colors.subtle }]}>{sublabel}</Text> : null}
      </View>
      <View style={styles.rowRight}>{right}</View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen({ navigation }) {
  const { isDark, colors, toggleTheme } = useAppTheme();

  const handleRateUs = async () => {
    try { await Linking.openURL(PLAY_STORE_URL); } catch {}
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: '🩺 Check out Home Doctors – your home remedy guide!\n\nGet free health tips for 1,000+ conditions including home remedies, symptoms, and when to see a doctor.\n\nDownload free on Google Play!',
      });
    } catch {}
  };

  const handleEmail = async () => {
    try { await Linking.openURL('mailto:home.doctors@example.com?subject=Home Doctors App Feedback'); } catch {}
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── About ── */}
        <SectionHeader title="About" colors={colors} />
        <LinearGradient
          colors={isDark ? ['#1a2a3e', '#0D1A2E'] : ['#EAF4FF', '#DBEEFF']}
          style={[styles.aboutCard, { borderColor: colors.border }]}
        >
          <View style={[styles.aboutIconWrap, { backgroundColor: colors.primary + '22' }]}>
            <Ionicons name="medkit" size={36} color={colors.primary} />
          </View>
          <Text style={[styles.aboutAppName, { color: colors.text }]}>Home Doctors</Text>
          <Text style={[styles.aboutVersion, { color: colors.subtle }]}>Version {APP_VERSION}</Text>
          <Text style={[styles.aboutMission, { color: colors.textSoft ?? colors.subtle }]}>
            Making home remedies simple and{'\n'}accessible for everyone.
          </Text>
          <View style={[styles.aboutDivider, { backgroundColor: colors.border }]} />
          <Text style={[styles.aboutDev, { color: colors.text }]}>
            Developed by{' '}
            <Text style={{ color: colors.primary, fontFamily: 'Poppins_700Bold' }}>Daniel Hagos</Text>
          </Text>
          <TouchableOpacity onPress={handleEmail} style={styles.aboutEmailRow}>
            <Ionicons name="mail-outline" size={14} color={colors.subtle} style={{ marginRight: 5 }} />
            <Text style={[styles.aboutEmail, { color: colors.subtle }]}>home.doctors@example.com</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* ── Appearance ── */}
        <SectionHeader title="Appearance" colors={colors} />
        <View style={styles.card}>
          <SettingRow
            icon="moon-outline" iconColor="#6C63FF"
            label="Dark Mode" sublabel={isDark ? 'Currently dark' : 'Currently light'}
            colors={colors} noBorder
            right={
              <Switch
                value={isDark}
                onValueChange={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); toggleTheme(); }}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            }
          />
        </View>

        {/* ── Language ── */}
        <SectionHeader title="Language" colors={colors} />
        <View style={styles.card}>
          <SettingRow
            icon="language-outline" iconColor="#22C55E" label="English"
            colors={colors} noBorder
            right={<Text style={[styles.comingSoon, { color: colors.subtle }]}>Coming soon</Text>}
          />
        </View>

        {/* ── Support ── */}
        <SectionHeader title="Support" colors={colors} />
        <View style={styles.card}>
          <SettingRow
            icon="star-outline" iconColor="#F59E0B" label="Rate Us"
            sublabel="Enjoying the app? Leave a review!"
            colors={colors} onPress={handleRateUs}
            right={<Ionicons name="chevron-forward" size={18} color={colors.subtle} />}
          />
          <SettingRow
            icon="share-social-outline" iconColor="#007AFF" label="Share App"
            sublabel="Tell a friend about Home Doctors"
            colors={colors} onPress={handleShareApp}
            right={<Ionicons name="chevron-forward" size={18} color={colors.subtle} />}
          />
          <SettingRow
            icon="mail-outline" iconColor="#22C55E" label="Contact Us"
            sublabel="home.doctors@example.com"
            colors={colors} onPress={handleEmail} noBorder
            right={<Ionicons name="chevron-forward" size={18} color={colors.subtle} />}
          />
        </View>

        {/* ── Legal ── */}
        <SectionHeader title="Legal" colors={colors} />
        <View style={styles.card}>
          <SettingRow
            icon="document-text-outline" iconColor="#64748B" label="Terms & Conditions"
            colors={colors} onPress={() => navigation.navigate('Terms')}
            right={<Ionicons name="chevron-forward" size={18} color={colors.subtle} />}
          />
          <SettingRow
            icon="shield-checkmark-outline" iconColor="#64748B" label="Privacy Policy"
            colors={colors} onPress={() => navigation.navigate('Privacy')} noBorder
            right={<Ionicons name="chevron-forward" size={18} color={colors.subtle} />}
          />
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Text style={[styles.footerDisclaimer, { color: colors.subtle }]}>
            ⚠️ For educational purposes only.{'\n'}Not a substitute for professional medical advice.
          </Text>
          <Text style={[styles.footerCopy, { color: colors.border }]}>
            © 2026 Daniel Hagos · Home Doctors v{APP_VERSION}
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1 },
  scroll:        { paddingBottom: 40 },
  sectionHeader: { fontSize: 11, fontFamily: 'Poppins_700Bold', letterSpacing: 1, marginHorizontal: 20, marginTop: 24, marginBottom: 6 },

  aboutCard: {
    marginHorizontal: 16, borderRadius: 18, padding: 24,
    alignItems: 'center', borderWidth: 1,
  },
  aboutIconWrap: { width: 72, height: 72, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  aboutAppName:  { fontSize: 22, fontFamily: 'Poppins_800ExtraBold', marginBottom: 2 },
  aboutVersion:  { fontSize: 13, fontFamily: 'Poppins_400Regular', marginBottom: 12 },
  aboutMission:  { fontSize: 14, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 22, marginBottom: 16 },
  aboutDivider:  { height: 1, width: '80%', marginBottom: 14 },
  aboutDev:      { fontSize: 14, fontFamily: 'Poppins_400Regular', marginBottom: 6 },
  aboutEmailRow: { flexDirection: 'row', alignItems: 'center' },
  aboutEmail:    { fontSize: 12, fontFamily: 'Poppins_400Regular' },

  card: { marginHorizontal: 16, borderRadius: 14, overflow: 'hidden', elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth, minHeight: 56,
  },
  rowIcon:    { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  rowLabel:   { fontSize: 15, fontFamily: 'Poppins_400Regular' },
  rowSub:     { fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 1 },
  rowRight:   { marginLeft: 8 },
  comingSoon: { fontSize: 12, fontFamily: 'Poppins_400Regular' },

  footer:          { alignItems: 'center', marginTop: 36, paddingHorizontal: 24 },
  footerDisclaimer:{ fontSize: 12, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 18, marginBottom: 12 },
  footerCopy:      { fontSize: 11, fontFamily: 'Poppins_400Regular' },
});
