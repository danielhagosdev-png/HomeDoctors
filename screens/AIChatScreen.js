import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { sendChatMessage, checkProxyHealth, PROXY_ENABLED } from '../services/groqService';

// ─── Initial greeting ─────────────────────────────────────────────────────────
const INITIAL_MESSAGE = {
  id:   '0',
  role: 'assistant',
  content:
    `Hi! 👋 I'm your Home Doctors AI Health Assistant.\n\nAsk me about home remedies and general health tips for common conditions — like headaches, cold & flu, stomach pain, skin issues, and more.\n\n**Examples you can try:**\n• "What helps a sore throat?"\n• "Home remedies for back pain"\n• "How to reduce a fever naturally"\n\n⚠️ *I'm for informational purposes only. Always consult a real doctor for medical diagnosis or treatment.*`,
  time: new Date(),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Render **bold** markdown simply */
function BubbleText({ text, isUser, textColor }) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return (
    <Text style={[styles.msgText, { color: textColor }]}>
      {parts.map((part, i) =>
        i % 2 === 1
          ? <Text key={i} style={{ fontFamily: 'Poppins_700Bold' }}>{part}</Text>
          : <Text key={i} style={{ fontFamily: 'Poppins_400Regular' }}>{part}</Text>
      )}
    </Text>
  );
}

// ─── Bubble component ─────────────────────────────────────────────────────────
function MessageBubble({ item, colors }) {
  const isUser = item.role === 'user';
  return (
    <View style={[styles.msgRow, isUser ? styles.rowRight : styles.rowLeft]}>
      {!isUser && (
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Ionicons name="medkit" size={13} color="#fff" />
        </View>
      )}
      <View style={[
        styles.bubble,
        isUser
          ? [styles.bubbleUser, { backgroundColor: colors.primary }]
          : [styles.bubbleBot,  { backgroundColor: colors.card, borderColor: colors.border }],
      ]}>
        <BubbleText
          text={item.content}
          isUser={isUser}
          textColor={isUser ? '#fff' : colors.text}
        />
        {item.error ? (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle-outline" size={12} color="#ff6b6b" />
            <Text style={styles.errorLabel}>Failed to send</Text>
          </View>
        ) : null}
        <Text style={[styles.timeText, { color: isUser ? 'rgba(255,255,255,0.65)' : colors.subtle }]}>
          {formatTime(item.time)}
        </Text>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function AIChatScreen() {
  const { isDark, colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [messages,  setMessages]  = useState([INITIAL_MESSAGE]);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [serverOk,  setServerOk]  = useState(null); // null = checking

  const listRef = useRef(null);

  // Check proxy health once on mount
  useEffect(() => {
    checkProxyHealth().then(({ ok }) => setServerOk(ok));
  }, []);

  const scrollToBottom = useCallback((animated = true) => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated }), 80);
  }, []);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');

    const userMsg = {
      id:      Date.now().toString(),
      role:    'user',
      content: text,
      time:    new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    scrollToBottom();

    try {
      // Build history: exclude the greeting (index 0), keep last 10 turns
      const history = [...messages, userMsg]
        .filter((m, i) => i > 0)               // skip greeting
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));

      const reply = await sendChatMessage(history);

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: reply, time: new Date() },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id:      (Date.now() + 1).toString(),
          role:    'assistant',
          content: `⚠️ ${err.message || 'Something went wrong. Please try again.'}`,
          time:    new Date(),
          error:   true,
        },
      ]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }, [input, loading, messages, scrollToBottom]);

  // ── Status banner ────────────────────────────────────────────────────────────
  const statusColor  = PROXY_ENABLED ? (serverOk ? '#22C55E' : '#EF4444') : '#F59E0B';
  const statusLabel  = PROXY_ENABLED
    ? (serverOk === null ? 'Connecting…' : serverOk ? 'Groq AI · Live' : 'Server offline — offline mode')
    : 'Offline mode · No server configured';

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>

      {/* ── Header ── */}
      <View style={[styles.header, {
        backgroundColor:  colors.headerBg,
        borderBottomColor: colors.border,
        paddingTop:        insets.top + 10,
      }]}>
        <View style={[styles.headerAvatar, { backgroundColor: colors.primary }]}>
          <Ionicons name="medkit" size={20} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Health Assistant</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: colors.subtle }]}>{statusLabel}</Text>
          </View>
        </View>
      </View>

      {/* ── Chat list + input ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <MessageBubble item={item} colors={colors} />}
          contentContainerStyle={[styles.list, { paddingBottom: 8 }]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollToBottom(false)}
        />

        {/* Typing indicator */}
        {loading && (
          <View style={[styles.typingRow, { paddingHorizontal: 16 }]}>
            <View style={[styles.avatar, { backgroundColor: colors.primary, marginRight: 8 }]}>
              <Ionicons name="medkit" size={13} color="#fff" />
            </View>
            <View style={[styles.typingBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.typingText, { color: colors.subtle }]}>Thinking…</Text>
            </View>
          </View>
        )}

        {/* Disclaimer */}
        <View style={[styles.disclaimer, { backgroundColor: colors.cardAlt ?? colors.card, borderTopColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={13} color={colors.subtle} />
          <Text style={[styles.disclaimerText, { color: colors.subtle }]}>
            {'  '}For informational purposes only. Always consult a qualified doctor.
          </Text>
        </View>

        {/* Input row */}
        <View style={[styles.inputRow, {
          backgroundColor:  colors.card,
          borderTopColor:   colors.border,
          paddingBottom:    insets.bottom + 8,
        }]}>
          <TextInput
            style={[styles.textInput, {
              backgroundColor: colors.inputBg,
              borderColor:     colors.border,
              color:           colors.text,
            }]}
            placeholder="Ask about a symptom or condition…"
            placeholderTextColor={colors.subtle}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={600}
            returnKeyType="send"
            blurOnSubmit
            onSubmitEditing={send}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              { backgroundColor: input.trim() && !loading ? colors.primary : colors.border },
            ]}
            onPress={send}
            disabled={!input.trim() || loading}
          >
            <Ionicons name="send" size={17} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  headerTitle:  { fontFamily: 'Poppins_700Bold', fontSize: 16 },
  statusRow:    { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  statusDot:    { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
  statusText:   { fontFamily: 'Poppins_400Regular', fontSize: 11 },

  // Chat list
  list: { paddingHorizontal: 14, paddingTop: 14 },

  // Messages
  msgRow:    { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  rowLeft:   { justifyContent: 'flex-start' },
  rowRight:  { justifyContent: 'flex-end' },
  avatar:    { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 6, flexShrink: 0 },
  bubble:    { maxWidth: '78%', borderRadius: 18, padding: 12 },
  bubbleUser:{ borderBottomRightRadius: 4 },
  bubbleBot: { borderBottomLeftRadius: 4, borderWidth: StyleSheet.hairlineWidth },
  msgText:   { fontSize: 14, lineHeight: 21 },
  timeText:  { fontSize: 10, fontFamily: 'Poppins_400Regular', marginTop: 4, alignSelf: 'flex-end' },
  errorRow:  { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  errorLabel:{ fontSize: 10, color: '#ff6b6b', fontFamily: 'Poppins_400Regular', marginLeft: 3 },

  // Typing indicator
  typingRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, marginBottom: 4 },
  typingBubble: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
  typingText:   { fontSize: 13, fontFamily: 'Poppins_400Regular' },

  // Disclaimer
  disclaimer:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 7, borderTopWidth: StyleSheet.hairlineWidth },
  disclaimerText:{ flex: 1, fontSize: 11, fontFamily: 'Poppins_400Regular', lineHeight: 16 },

  // Input
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 12, paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  textInput: {
    flex: 1, borderWidth: 1.5, borderRadius: 22,
    paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 14, fontFamily: 'Poppins_400Regular',
    maxHeight: 110, marginRight: 10,
  },
  sendBtn: {
    width: 46, height: 46, borderRadius: 23,
    justifyContent: 'center', alignItems: 'center',
  },
});
