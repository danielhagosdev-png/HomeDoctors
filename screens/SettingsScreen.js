import React from 'react';
import {
  View, Text, ScrollView, Switch, TouchableOpacity,
  StyleSheet, Share, Linking, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import Constants from 'expo-constants';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.homeDoctors.app';

function SectionHeader({ title, colors }) {
  return (
    <Text style={[styles.sectionHeader, { color: colors.primary }]}>{title.toUpperCase()}</Text>
  );
}

function SettingRow({ icon, iconColor, label, onPress, right, colors, noBorder }) {
  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: colors.card, borderBottomColor: noBorder ? 'transparent' : colors.border }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.rowIcon, { backgroundColor: (iconColor ?? colors.primary) + '18' }]}>
        <Ionicons name={icon} size={20} color={iconColor ?? colors.primary} />
      </View>
      <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
      <View style={styles.rowRight}>{right}</View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen({ navigation }) {
  const { isDark, colors, toggleTheme } = useAppTheme();

  const handleRateUs = async () => {
    try {
      const url = Platform.OS === 'android' ? PLAY_STORE_URL : PLAY_STORE_URL;
      await Linking.openURL(url);
    } catch { /* store not available in dev */ }
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: '🩺 Check out Home Doctors – your home remedy guide! Get free health tips for 1000+ conditions. Download now!',
      });
    } catch {}
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Appearance ── */}
        <SectionHeader title="Appearance" colors={colors} />
        <View style={styles.card}>
          <SettingRow
            icon="moon-outline" iconColor="#6C63FF" label="Dark Mode"
            colors={colors} noBorder
            right={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
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
            colors={colors} onPress={handleRateUs}
            right={<Ionicons name="chevron-forward" size={18} color={colors.subtle} />}
          />
          <SettingRow
            icon="share-social-outline" iconColor="#007AFF" label="Share App"
            colors={colors} onPress={handleShareApp} noBorder
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
          <Ionicons name="medkit-outline" size={20} color={colors.subtle} />
          <Text style={[styles.footerApp, { color: colors.subtle }]}>Home Doctors</Text>
          <Text style={[styles.footerVersion, { color: colors.subtle }]}>Version {APP_VERSION}</Text>
          <Text style={[styles.footerNote, { color: colors.subtle }]}>
            For educational purposes only.{'\n'}Not a substitute for medical advice.
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
  card:          { marginHorizontal: 16, borderRadius: 14, overflow: 'hidden', elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, minHeight: 56,
  },
  rowIcon:       { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  rowLabel:      { flex: 1, fontSize: 15, fontFamily: 'Poppins_400Regular' },
  rowRight:      { marginLeft: 8 },
  comingSoon:    { fontSize: 12, fontFamily: 'Poppins_400Regular' },
  footer: {
    alignItems: 'center', marginTop: 40, paddingBottom: 8,
  },
  footerApp:     { fontSize: 15, fontFamily: 'Poppins_700Bold', marginTop: 6 },
  footerVersion: { fontSize: 13, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  footerNote:    { fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 8, textAlign: 'center', lineHeight: 17 },
});
