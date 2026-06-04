import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from 'react-native';

export default function DisclaimerModal({ visible, onAccept }) {
  const isDark = useColorScheme() === 'dark';
  const colors = isDark ? dark : light;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.iconWrapper}>
            <Text style={styles.icon}>⚕️</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            Medical Disclaimer
          </Text>
          <Text style={[styles.body, { color: colors.subtle }]}>
            This app does <Text style={styles.bold}>not</Text> provide medical
            advice. All information is for{' '}
            <Text style={styles.bold}>educational purposes only</Text> and
            should not be used as a substitute for professional medical
            diagnosis, treatment, or advice.
            {'\n\n'}
            Always consult a qualified healthcare provider before starting any
            treatment or if you have questions about a medical condition.
          </Text>
          <TouchableOpacity style={styles.button} onPress={onAccept}>
            <Text style={styles.buttonText}>I Understand</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const light = { card: '#ffffff', text: '#1a1a2e', subtle: '#555' };
const dark  = { card: '#1e1e2e', text: '#e0e0ff', subtle: '#aaa' };

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  iconWrapper: { alignItems: 'center', marginBottom: 12 },
  icon: { fontSize: 48 },
  title: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  body: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  bold: { fontFamily: 'Poppins_700Bold' },
  button: {
    backgroundColor: '#1a8fe3',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
});
