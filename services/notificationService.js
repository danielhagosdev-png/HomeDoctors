/**
 * notificationService.js
 *
 * Handles all local notifications:
 *  - Appointment reminders (1 hour before, one-time)
 *  - Medication reminders (daily repeating at chosen time)
 *
 * Notification IDs are stored on each record so they can be cancelled
 * when the user edits or deletes an item.
 *
 * On app startup, call rescheduleAll() so notifications survive restarts.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ─── Global notification handler ──────────────────────────────────────────────
// Call this once before your NavigationContainer renders.
export function setupNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge:  false,
    }),
  });
}

// ─── Android notification channel ─────────────────────────────────────────────
async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('hd_reminders', {
    name:             'Health Reminders',
    importance:       Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 300, 200, 300],
    lightColor:       '#007AFF',
    sound:            true,
    enableVibrate:    true,
  });
}

// ─── Permission request ────────────────────────────────────────────────────────
export async function requestNotificationPermissions() {
  await ensureChannel();
  const { status: current } = await Notifications.getPermissionsAsync();
  if (current === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ─── Appointment reminder ──────────────────────────────────────────────────────
/**
 * Schedule a one-time notification 1 hour before an appointment.
 * @param {{ id, doctorName, date: 'YYYY-MM-DD', time: 'HH:MM' }} appt
 * @returns {string|null} notificationId
 */
export async function scheduleAppointmentReminder(appt) {
  try {
    const [y, m, d] = appt.date.split('-').map(Number);
    const [h, min]  = appt.time.split(':').map(Number);
    const apptDate  = new Date(y, m - 1, d, h, min, 0);
    const fireAt    = new Date(apptDate.getTime() - 60 * 60 * 1000); // 1 hour before

    if (fireAt <= new Date()) return null; // already past

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title:     '🏥 Appointment in 1 Hour',
        body:      `Dr. ${appt.doctorName} — ${appt.time}${appt.notes ? `\n${appt.notes}` : ''}`,
        data:      { type: 'appointment', id: appt.id },
        sound:     true,
        channelId: 'hd_reminders',
      },
      trigger: { type: 'date', date: fireAt },
    });
    return id;
  } catch (e) {
    console.warn('[Notifications] scheduleAppointment failed:', e.message);
    return null;
  }
}

// ─── Medication reminder ───────────────────────────────────────────────────────
/**
 * Schedule a daily repeating notification.
 * @param {{ id, name, dosage, hour: number, minute: number }} med
 * @returns {string|null} notificationId
 */
export async function scheduleMedicationReminder(med) {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title:     '💊 Medication Reminder',
        body:      `Time to take ${med.name}${med.dosage ? ` — ${med.dosage}` : ''}`,
        data:      { type: 'medication', id: med.id },
        sound:     true,
        channelId: 'hd_reminders',
      },
      trigger: {
        type:    'daily',
        hour:    med.hour,
        minute:  med.minute,
      },
    });
    return id;
  } catch (e) {
    console.warn('[Notifications] scheduleMedication failed:', e.message);
    return null;
  }
}

// ─── Cancel a single notification ─────────────────────────────────────────────
export async function cancelNotification(notificationId) {
  if (!notificationId) return;
  try { await Notifications.cancelScheduledNotificationAsync(notificationId); } catch {}
}

// ─── Re-schedule everything on app startup ────────────────────────────────────
/**
 * Called once in App.js on mount. Cancels all pending notifications then
 * re-schedules from the stored lists so they survive app restarts.
 *
 * @param {Array} appointments
 * @param {Array} medications
 * @returns {{ appointments: {[id]: notifId}, medications: {[id]: notifId} }}
 */
export async function rescheduleAll(appointments, medications) {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const result = { appointments: {}, medications: {} };

  for (const appt of appointments) {
    result.appointments[appt.id] = await scheduleAppointmentReminder(appt);
  }
  for (const med of medications) {
    if (med.enabled) {
      result.medications[med.id] = await scheduleMedicationReminder(med);
    }
  }
  return result;
}
