import React, { useState, useCallback, useEffect, memo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, Switch, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../context/ThemeContext';
import {
  getAppointments, saveAppointments,
  getMedications,  saveMedications,
} from '../utils/storage';
import {
  requestNotificationPermissions,
  scheduleAppointmentReminder,
  scheduleMedicationReminder,
  cancelNotification,
} from '../services/notificationService';
import AppointmentForm from '../components/AppointmentForm';
import MedicationForm  from '../components/MedicationForm';

const pad = (n) => String(n).padStart(2, '0');
let _uid = Date.now();
const uid = () => String(++_uid);

function formatApptDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}
function formatApptTime(timeStr) {
  const [h, min] = timeStr.split(':').map(Number);
  const dt = new Date(2000, 0, 1, h, min);
  return dt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}
function formatMedTime(h, m) {
  const dt = new Date(2000, 0, 1, h, m);
  return dt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

// ── Appointment card ──────────────────────────────────────────────────────────
const AppointmentCard = memo(function AppointmentCard({ item, colors, onEdit, onDelete }) {
  const isPast = new Date(`${item.date}T${item.time}`) < new Date();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, opacity: isPast ? 0.6 : 1 }]}>
      <LinearGradient colors={['#007AFF', '#0055CC']} style={styles.cardAccent} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.doctorName, { color: colors.text }]} numberOfLines={1}>
              Dr. {item.doctorName}
            </Text>
            <View style={styles.dtRow}>
              <Ionicons name="calendar-outline" size={13} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.dtText, { color: colors.subtle }]}>{formatApptDate(item.date)}</Text>
            </View>
            <View style={styles.dtRow}>
              <Ionicons name="time-outline" size={13} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.dtText, { color: colors.subtle }]}>{formatApptTime(item.time)}</Text>
              {isPast && <Text style={[styles.pastTag, { color: colors.subtle }]}>  (Past)</Text>}
            </View>
            {item.notes ? (
              <Text style={[styles.notes, { color: colors.subtle }]} numberOfLines={2}>{item.notes}</Text>
            ) : null}
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.primarySoft ?? '#E8F2FF' }]} onPress={() => onEdit(item)}>
              <Ionicons name="pencil-outline" size={15} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: '#FEE2E2', marginTop: 6 }]} onPress={() => onDelete(item)}>
              <Ionicons name="trash-outline" size={15} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
});

// ── Medication card ───────────────────────────────────────────────────────────
const MedicationCard = memo(function MedicationCard({ item, colors, onToggle, onEdit, onDelete }) {
  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <LinearGradient colors={['#22C55E', '#16A34A']} style={styles.cardAccent} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.doctorName, { color: colors.text }]} numberOfLines={1}>
              💊 {item.name}
            </Text>
            {item.dosage ? (
              <Text style={[styles.dtText, { color: colors.subtle, marginBottom: 2 }]}>{item.dosage}</Text>
            ) : null}
            <View style={styles.dtRow}>
              <Ionicons name="alarm-outline" size={13} color="#22C55E" style={{ marginRight: 4 }} />
              <Text style={[styles.dtText, { color: colors.subtle }]}>
                Daily at {formatMedTime(item.hour, item.minute)}
              </Text>
            </View>
          </View>
          <View style={styles.cardActions}>
            <Switch
              value={item.enabled}
              onValueChange={() => onToggle(item)}
              trackColor={{ false: colors.border, true: '#22C55E' }}
              thumbColor="#fff"
              style={{ marginBottom: 8 }}
            />
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.primarySoft ?? '#E8F2FF' }]} onPress={() => onEdit(item)}>
              <Ionicons name="pencil-outline" size={15} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: '#FEE2E2', marginTop: 6 }]} onPress={() => onDelete(item)}>
              <Ionicons name="trash-outline" size={15} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function RemindersScreen() {
  const { colors } = useAppTheme();
  const [tab,          setTab]          = useState('appointments'); // 'appointments' | 'medications'
  const [appointments, setAppointments] = useState([]);
  const [medications,  setMedications]  = useState([]);
  const [showApptForm, setShowApptForm] = useState(false);
  const [showMedForm,  setShowMedForm]  = useState(false);
  const [editingAppt,  setEditingAppt]  = useState(null);
  const [editingMed,   setEditingMed]   = useState(null);
  const [notifGranted, setNotifGranted] = useState(true);

  useFocusEffect(useCallback(() => {
    getAppointments().then(setAppointments);
    getMedications().then(setMedications);
  }, []));

  useEffect(() => {
    requestNotificationPermissions().then(setNotifGranted);
  }, []);

  // ── Appointments CRUD ───────────────────────────────────────────────────────
  const handleSaveAppt = async (data) => {
    if (editingAppt) {
      // cancel old notification
      await cancelNotification(editingAppt.notificationId);
      const updated = appointments.map((a) =>
        a.id === editingAppt.id ? { ...editingAppt, ...data, notificationId: null } : a
      );
      const notifId = await scheduleAppointmentReminder({ ...editingAppt, ...data });
      const final   = updated.map((a) => a.id === editingAppt.id ? { ...a, notificationId: notifId } : a);
      setAppointments(final);
      await saveAppointments(final);
    } else {
      const newAppt  = { id: uid(), ...data, notificationId: null };
      const notifId  = await scheduleAppointmentReminder(newAppt);
      const withNotif = { ...newAppt, notificationId: notifId };
      const updated  = [...appointments, withNotif].sort((a, b) =>
        new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`)
      );
      setAppointments(updated);
      await saveAppointments(updated);
    }
    setShowApptForm(false);
    setEditingAppt(null);
  };

  const handleDeleteAppt = (item) => {
    Alert.alert('Delete Appointment', `Remove appointment with Dr. ${item.doctorName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await cancelNotification(item.notificationId);
          const updated = appointments.filter((a) => a.id !== item.id);
          setAppointments(updated);
          await saveAppointments(updated);
        },
      },
    ]);
  };

  // ── Medications CRUD ────────────────────────────────────────────────────────
  const handleSaveMed = async (data) => {
    if (editingMed) {
      await cancelNotification(editingMed.notificationId);
      const base    = { ...editingMed, ...data, notificationId: null };
      const notifId = data.enabled ? await scheduleMedicationReminder(base) : null;
      const final   = { ...base, notificationId: notifId };
      const updated = medications.map((m) => m.id === editingMed.id ? final : m);
      setMedications(updated);
      await saveMedications(updated);
    } else {
      const newMed  = { id: uid(), ...data, notificationId: null };
      const notifId = data.enabled ? await scheduleMedicationReminder(newMed) : null;
      const final   = { ...newMed, notificationId: notifId };
      const updated = [...medications, final];
      setMedications(updated);
      await saveMedications(updated);
    }
    setShowMedForm(false);
    setEditingMed(null);
  };

  const handleToggleMed = async (item) => {
    const newEnabled = !item.enabled;
    let notifId = item.notificationId;
    if (newEnabled) {
      notifId = await scheduleMedicationReminder({ ...item, enabled: true });
    } else {
      await cancelNotification(item.notificationId);
      notifId = null;
    }
    const updated = medications.map((m) =>
      m.id === item.id ? { ...m, enabled: newEnabled, notificationId: notifId } : m
    );
    setMedications(updated);
    await saveMedications(updated);
  };

  const handleDeleteMed = (item) => {
    Alert.alert('Delete Reminder', `Remove reminder for ${item.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await cancelNotification(item.notificationId);
          const updated = medications.filter((m) => m.id !== item.id);
          setMedications(updated);
          await saveMedications(updated);
        },
      },
    ]);
  };

  const isAppts = tab === 'appointments';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['bottom']}>
      {/* Notification permission banner */}
      {!notifGranted && (
        <View style={[styles.permBanner, { backgroundColor: '#FEF3C7' }]}>
          <Ionicons name="warning-outline" size={16} color="#B45309" />
          <Text style={styles.permText}>Enable notifications in Settings to receive reminders.</Text>
        </View>
      )}

      {/* Medication disclaimer */}
      {!isAppts && (
        <View style={[styles.disclaimer, { backgroundColor: colors.card, borderColor: '#F59E0B' }]}>
          <Text style={[styles.disclaimerText, { color: colors.textSoft ?? colors.subtle }]}>
            ⚠️ This app only provides reminders. You are responsible for taking medication as prescribed by your doctor. Always follow your prescription.
          </Text>
        </View>
      )}

      {/* Segmented control */}
      <View style={[styles.segRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {['appointments', 'medications'].map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.segBtn, tab === t && { backgroundColor: colors.primary }]}
            onPress={() => setTab(t)}
          >
            <Ionicons
              name={t === 'appointments' ? 'calendar-outline' : 'medkit-outline'}
              size={15}
              color={tab === t ? '#fff' : colors.subtle}
              style={{ marginRight: 5 }}
            />
            <Text style={[styles.segText, { color: tab === t ? '#fff' : colors.subtle }]}>
              {t === 'appointments' ? `Appointments (${appointments.length})` : `Medications (${medications.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={isAppts ? appointments : medications}
        keyExtractor={(d) => d.id}
        renderItem={({ item }) =>
          isAppts
            ? <AppointmentCard item={item} colors={colors}
                onEdit={(a) => { setEditingAppt(a); setShowApptForm(true); }}
                onDelete={handleDeleteAppt} />
            : <MedicationCard item={item} colors={colors}
                onToggle={handleToggleMed}
                onEdit={(m) => { setEditingMed(m); setShowMedForm(true); }}
                onDelete={handleDeleteMed} />
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, paddingTop: 8 }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons
              name={isAppts ? 'calendar-outline' : 'medkit-outline'}
              size={64} color={colors.border}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {isAppts ? 'No Appointments' : 'No Medication Reminders'}
            </Text>
            <Text style={[styles.emptySub, { color: colors.subtle }]}>
              {isAppts
                ? 'Tap + to schedule your next doctor visit.'
                : 'Tap + to set up a daily medication reminder.'}
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => {
          if (isAppts) { setEditingAppt(null); setShowApptForm(true); }
          else          { setEditingMed(null);  setShowMedForm(true); }
        }}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Forms */}
      <AppointmentForm
        visible={showApptForm}
        initial={editingAppt}
        onSave={handleSaveAppt}
        onClose={() => { setShowApptForm(false); setEditingAppt(null); }}
      />
      <MedicationForm
        visible={showMedForm}
        initial={editingMed}
        onSave={handleSaveMed}
        onClose={() => { setShowMedForm(false); setEditingMed(null); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1 },
  permBanner:    { flexDirection: 'row', alignItems: 'center', padding: 10, paddingHorizontal: 16, gap: 8 },
  permText:      { flex: 1, fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#B45309' },
  disclaimer:    { margin: 12, marginBottom: 4, padding: 12, borderRadius: 12, borderWidth: 1 },
  disclaimerText:{ fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 18 },
  segRow:        { flexDirection: 'row', margin: 12, borderRadius: 14, borderWidth: 1, padding: 4, overflow: 'hidden' },
  segBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 9, borderRadius: 10 },
  segText:       { fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  card: {
    flexDirection: 'row', borderRadius: 16, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 3, overflow: 'hidden',
  },
  cardAccent:    { width: 5 },
  cardBody:      { flex: 1, padding: 14 },
  cardTop:       { flexDirection: 'row', alignItems: 'flex-start' },
  doctorName:    { fontSize: 15, fontFamily: 'Poppins_700Bold', marginBottom: 5 },
  dtRow:         { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  dtText:        { fontSize: 13, fontFamily: 'Poppins_400Regular' },
  pastTag:       { fontSize: 11, fontFamily: 'Poppins_400Regular', fontStyle: 'italic' },
  notes:         { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 6, fontStyle: 'italic' },
  cardActions:   { alignItems: 'center', marginLeft: 10 },
  iconBtn:       { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  emptyWrap:     { alignItems: 'center', paddingTop: 80 },
  emptyTitle:    { fontSize: 18, fontFamily: 'Poppins_700Bold', marginTop: 16, marginBottom: 8 },
  emptySub:      { fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'center' },
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
});
