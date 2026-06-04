import React from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../context/ThemeContext';

const SECTIONS = [
  {
    title: '1. Information We Collect',
    body: 'Home Doctors does not collect personally identifiable information. The app stores your preferences (dark mode, bookmarks) locally on your device using AsyncStorage. This data never leaves your device.',
  },
  {
    title: '2. Health Data',
    body: 'The health information displayed in this app is sourced from publicly available medical references. We do not collect, store, or transmit any health data you enter or view.',
  },
  {
    title: '3. Analytics',
    body: 'We may use anonymous, aggregated analytics to understand app usage and improve the user experience. This data does not include personally identifiable information.',
  },
  {
    title: '4. Advertising',
    body: 'This app uses Google AdMob to display advertisements. AdMob may collect device identifiers and usage data in accordance with Google\'s Privacy Policy. You can opt out of personalised ads in your device settings.',
  },
  {
    title: '5. Third-Party Services',
    body: 'The AI chat feature may use third-party AI services (OpenRouter) when an API key is configured. In offline mode, all processing is done locally on your device.',
  },
  {
    title: '6. Data Security',
    body: 'We take reasonable measures to protect information stored on your device. However, no method of electronic storage is 100% secure.',
  },
  {
    title: '7. Children\'s Privacy',
    body: 'Home Doctors is not directed at children under 13. We do not knowingly collect data from children under 13.',
  },
  {
    title: '8. Changes to This Policy',
    body: 'We may update our Privacy Policy from time to time. Changes will be reflected by updating the "Last Updated" date on this page.',
  },
  {
    title: '9. Contact Us',
    body: 'If you have questions about this Privacy Policy, please contact us through the app\'s support channel.',
  },
];

export default function PrivacyScreen() {
  const { colors } = useAppTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.lastUpdated, { color: colors.subtle }]}>Last updated: June 2026</Text>
        <Text style={[styles.intro, { color: colors.textSoft ?? colors.text }]}>
          Your privacy is important to us. This policy explains what information we collect and how we use it.
        </Text>
        {SECTIONS.map((s) => (
          <View key={s.title} style={styles.section}>
            <Text style={[styles.sTitle, { color: colors.text }]}>{s.title}</Text>
            <Text style={[styles.sBody,  { color: colors.textSoft ?? colors.subtle }]}>{s.body}</Text>
          </View>
        ))}
        <Text style={[styles.placeholder, { color: colors.subtle }]}>
          Privacy Policy will be updated with full legal content soon.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1 },
  scroll:      { padding: 20, paddingBottom: 40 },
  lastUpdated: { fontSize: 12, fontFamily: 'Poppins_400Regular', marginBottom: 12 },
  intro:       { fontSize: 14, fontFamily: 'Poppins_400Regular', lineHeight: 22, marginBottom: 20 },
  section:     { marginBottom: 20 },
  sTitle:      { fontSize: 15, fontFamily: 'Poppins_700Bold', marginBottom: 6 },
  sBody:       { fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 21 },
  placeholder: { fontSize: 12, fontFamily: 'Poppins_400Regular', textAlign: 'center', marginTop: 20, fontStyle: 'italic' },
});
