import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Platform, KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';

const pad = (n) => String(n).padStart(2, '0');
const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toTimeStr = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const parseDateTime = (dateStr, timeStr) => {
  const [y, m, day] = dateStr.split('-').map(Number);
  const [h, min]    = timeStr.split(':').map(Number);
  return new Date(y, m - 1, day, h, min);
};

function formatDisplayDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
}
function formatDisplayTime(timeStr) {
  const [h, min] = timeStr.split(':').map(Number);
  const dt = new Date(2000, 0, 1, h, min);
  return dt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export default function AppointmentForm({ visible, initial, onSave, onClose }) {
  const { colors } = useAppTheme();

  const tomorrow = new Date(Date.now() + 86_400_000);
  const [doctorName, setDoctorName] = useState('');
  const [dateStr,    setDateStr]    = useState(toDateStr(tomorrow));
  const [timeStr,    setTimeStr]    = useState('09:00');
  const [notes,      setNotes]      = useState('');
  const [showDate,   setShowDate]   = useState(false);
  const [showTime,   setShowTime]   = useState(false);
  const [errors,     setErrors]     = useState({});

  useEffect(() => {
    if (visible) {
      if (initial) {
        setDoctorName(initial.doctorName || '');
        setDateStr(initial.date || toDateStr(tomorrow));
        setTimeStr(initial.time || '09:00');
        setNotes(initial.notes || '');
      } else {
        setDoctorName(''); setDateStr(toDateStr(tomorrow));
        setTimeStr('09:00'); setNotes('');
      }
      setErrors({});
    }
  }, [visible, initial]);

  const validate = () => {
    const e = {};
    if (!doctorName.trim()) e.doctorName = 'Doctor name is required';
    const apptTime = parseDateTime(dateStr, timeStr);
    if (apptTime <= new Date()) e.time = 'Please choose a future date and time';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ doctorName: doctorName.trim(), date: dateStr, time: timeStr, notes: notes.trim() });
  };

  const onChangeDatePicker = (_, selected) => {
    setShowDate(false);
    if (selected) setDateStr(toDateStr(selected));
  };
  const onChangeTimePicker = (_, selected) => {
    setShowTime(false);
    if (selected) setTimeStr(toTimeStr(selected));
  };

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
              {initial ? 'Edit Appointment' : 'New Appointment'}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={colors.subtle} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            {/* Doctor Name */}
            <Text style={[styles.label, { color: colors.text }]}>Doctor / Specialist *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: errors.doctorName ? colors.danger : colors.border, color: colors.text }]}
              placeholder="e.g. Dr. Ahmed Hassan"
              placeholderTextColor={colors.subtle}
              value={doctorName}
              onChangeText={(t) => { setDoctorName(t); setErrors((e) => ({ ...e, doctorName: null })); }}
              returnKeyType="next"
            />
            {errors.doctorName ? <Text style={styles.errText}>{errors.doctorName}</Text> : null}

            {/* Date */}
            <Text style={[styles.label, { color: colors.text }]}>Date *</Text>
            <TouchableOpacity
              style={[styles.pickerBtn, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
              onPress={() => setShowDate(true)}
            >
              <Ionicons name="calendar-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.pickerText, { color: colors.text }]}>{formatDisplayDate(dateStr)}</Text>
            </TouchableOpacity>

            {/* Time */}
            <Text style={[styles.label, { color: colors.text }]}>Time *</Text>
            <TouchableOpacity
              style={[styles.pickerBtn, { backgroundColor: colors.inputBg, borderColor: errors.time ? colors.danger : colors.border }]}
              onPress={() => setShowTime(true)}
            >
              <Ionicons name="time-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.pickerText, { color: colors.text }]}>{formatDisplayTime(timeStr)}</Text>
            </TouchableOpacity>
            {errors.time ? <Text style={styles.errText}>{errors.time}</Text> : null}

            {/* Notes */}
            <Text style={[styles.label, { color: colors.text }]}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.multiline, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              placeholder="e.g. Fasting required, bring test results…"
              placeholderTextColor={colors.subtle}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            {/* Save */}
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save Appointment</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Native pickers */}
          {showDate && (
            <DateTimePicker
              value={parseDateTime(dateStr, timeStr)}
              mode="date"
              minimumDate={new Date()}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onChangeDatePicker}
            />
          )}
          {showTime && (
            <DateTimePicker
              value={parseDateTime(dateStr, timeStr)}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onChangeTimePicker}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:   { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:     { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  title:     { fontSize: 18, fontFamily: 'Poppins_700Bold' },
  body:      { padding: 20, paddingBottom: 40 },
  label:     { fontSize: 13, fontFamily: 'Poppins_600SemiBold', marginBottom: 6, marginTop: 14 },
  input:     { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: 'Poppins_400Regular' },
  multiline: { height: 80, paddingTop: 12 },
  pickerBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13 },
  pickerText:{ fontSize: 14, fontFamily: 'Poppins_400Regular', flex: 1 },
  errText:   { fontSize: 12, color: '#EF4444', fontFamily: 'Poppins_400Regular', marginTop: 4 },
  saveBtn:   { marginTop: 28, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  saveBtnText:{ color: '#fff', fontFamily: 'Poppins_700Bold', fontSize: 16 },
});
