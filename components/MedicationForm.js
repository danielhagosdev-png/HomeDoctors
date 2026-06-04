import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Platform, KeyboardAvoidingView, Switch,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';

const pad = (n) => String(n).padStart(2, '0');

function formatTime(h, m) {
  const d = new Date(2000, 0, 1, h, m);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export default function MedicationForm({ visible, initial, onSave, onClose }) {
  const { colors } = useAppTheme();

  const [name,     setName]     = useState('');
  const [dosage,   setDosage]   = useState('');
  const [hour,     setHour]     = useState(8);
  const [minute,   setMinute]   = useState(0);
  const [enabled,  setEnabled]  = useState(true);
  const [showTime, setShowTime] = useState(false);
  const [errors,   setErrors]   = useState({});

  useEffect(() => {
    if (visible) {
      if (initial) {
        setName(initial.name || '');
        setDosage(initial.dosage || '');
        setHour(initial.hour ?? 8);
        setMinute(initial.minute ?? 0);
        setEnabled(initial.enabled !== false);
      } else {
        setName(''); setDosage('');
        setHour(8); setMinute(0); setEnabled(true);
      }
      setErrors({});
    }
  }, [visible, initial]);

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Medication name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ name: name.trim(), dosage: dosage.trim(), hour, minute, enabled });
  };

  const onChangeTime = (_, selected) => {
    setShowTime(false);
    if (selected) { setHour(selected.getHours()); setMinute(selected.getMinutes()); }
  };

  const timeDate = new Date(2000, 0, 1, hour, minute);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>
              {initial ? 'Edit Medication' : 'Add Medication'}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={colors.subtle} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            {/* Medication name */}
            <Text style={[styles.label, { color: colors.text }]}>Medication Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: errors.name ? colors.danger : colors.border, color: colors.text }]}
              placeholder="e.g. Metformin, Aspirin, Vitamin D"
              placeholderTextColor={colors.subtle}
              value={name}
              onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: null })); }}
              returnKeyType="next"
            />
            {errors.name ? <Text style={styles.errText}>{errors.name}</Text> : null}

            {/* Dosage */}
            <Text style={[styles.label, { color: colors.text }]}>Dosage (optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              placeholder="e.g. 1 tablet, 500 mg, 2 puffs"
              placeholderTextColor={colors.subtle}
              value={dosage}
              onChangeText={setDosage}
              returnKeyType="done"
            />

            {/* Reminder Time */}
            <Text style={[styles.label, { color: colors.text }]}>Daily Reminder Time *</Text>
            <TouchableOpacity
              style={[styles.pickerBtn, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
              onPress={() => setShowTime(true)}
            >
              <Ionicons name="alarm-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.pickerText, { color: colors.text }]}>{formatTime(hour, minute)}</Text>
              <Text style={[styles.repeat, { color: colors.subtle }]}>Daily</Text>
            </TouchableOpacity>

            {/* Enable toggle */}
            <View style={[styles.toggleRow, { borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleLabel, { color: colors.text }]}>Enable Reminder</Text>
                <Text style={[styles.toggleSub,   { color: colors.subtle }]}>
                  You will receive a daily notification at {formatTime(hour, minute)}
                </Text>
              </View>
              <Switch
                value={enabled}
                onValueChange={setEnabled}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>

            {/* Save */}
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save Medication</Text>
            </TouchableOpacity>
          </ScrollView>

          {showTime && (
            <DateTimePicker
              value={timeDate}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onChangeTime}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:     { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:       { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%' },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  title:       { fontSize: 18, fontFamily: 'Poppins_700Bold' },
  body:        { padding: 20, paddingBottom: 40 },
  label:       { fontSize: 13, fontFamily: 'Poppins_600SemiBold', marginBottom: 6, marginTop: 14 },
  input:       { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: 'Poppins_400Regular' },
  pickerBtn:   { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13 },
  pickerText:  { fontSize: 14, fontFamily: 'Poppins_400Regular', flex: 1 },
  repeat:      { fontSize: 12, fontFamily: 'Poppins_400Regular' },
  toggleRow:   { flexDirection: 'row', alignItems: 'center', marginTop: 20, padding: 14, borderWidth: 1.5, borderRadius: 12 },
  toggleLabel: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', marginBottom: 3 },
  toggleSub:   { fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 16 },
  errText:     { fontSize: 12, color: '#EF4444', fontFamily: 'Poppins_400Regular', marginTop: 4 },
  saveBtn:     { marginTop: 28, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontFamily: 'Poppins_700Bold', fontSize: 16 },
});
