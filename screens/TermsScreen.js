import React from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../context/ThemeContext';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: 'By downloading or using the Home Doctors application, you agree to be bound by these Terms and Conditions. If you disagree with any part of these terms, you may not access the app.',
  },
  {
    title: '2. Medical Disclaimer',
    body: 'The content provided in Home Doctors is for general informational and educational purposes only. It is not intended to be a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified healthcare provider with any questions you may have regarding a medical condition.',
  },
  {
    title: '3. Use of the Application',
    body: 'Home Doctors is intended for personal, non-commercial use. You may not use the app for any unlawful purpose or in any way that could damage, disable, or impair the app or interfere with any other party\'s use.',
  },
  {
    title: '4. Information Accuracy',
    body: 'We strive to provide accurate and up-to-date health information, but we make no representations or warranties of any kind regarding the completeness, accuracy, reliability, or suitability of the information provided.',
  },
  {
    title: '5. Intellectual Property',
    body: 'All content in this application, including text, graphics, logos, and data, is the property of Home Doctors or its content suppliers and is protected by intellectual property laws.',
  },
  {
    title: '6. Limitation of Liability',
    body: 'Home Doctors and its developers shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use this application.',
  },
  {
    title: '7. Changes to Terms',
    body: 'We reserve the right to modify these terms at any time. Changes will be indicated by updating the "Last Updated" date. Continued use of the app after changes constitutes acceptance of the new terms.',
  },
  {
    title: '8. Contact',
    body: 'If you have questions about these Terms, please contact us through the app\'s support channel.',
  },
];

export default function TermsScreen() {
  const { colors } = useAppTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.lastUpdated, { color: colors.subtle }]}>Last updated: June 2026</Text>
        <Text style={[styles.intro, { color: colors.textSoft ?? colors.text }]}>
          Please read these Terms and Conditions carefully before using the Home Doctors app.
        </Text>
        {SECTIONS.map((s) => (
          <View key={s.title} style={styles.section}>
            <Text style={[styles.sTitle, { color: colors.text }]}>{s.title}</Text>
            <Text style={[styles.sBody,  { color: colors.textSoft ?? colors.subtle }]}>{s.body}</Text>
          </View>
        ))}
        <Text style={[styles.placeholder, { color: colors.subtle }]}>
          Terms will be updated with full legal content soon.
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
