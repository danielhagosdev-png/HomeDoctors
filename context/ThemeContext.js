import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DefaultTheme, DarkTheme } from '@react-navigation/native';

const THEME_KEY = 'hd_theme_preference';

// ─── Palettes ─────────────────────────────────────────────────────────────────
export const LIGHT_COLORS = {
  bg:         '#F8F9FA',
  surface:    '#FFFFFF',
  card:       '#FFFFFF',
  cardAlt:    '#F2F4F7',
  text:       '#1A1A1A',
  textSoft:   '#3D3D3D',
  subtle:     '#6B7280',
  border:     '#E5E7EB',
  primary:    '#007AFF',
  primarySoft:'#E8F2FF',
  headerBg:   '#FFFFFF',
  headerText: '#1A1A1A',
  inputBg:    '#F2F4F7',
  tabBar:     '#FFFFFF',
  tabActive:  '#007AFF',
  tabInactive:'#9CA3AF',
  danger:     '#EF4444',
  success:    '#22C55E',
};

export const DARK_COLORS = {
  bg:         '#121212',
  surface:    '#1E1E1E',
  card:       '#1E1E1E',
  cardAlt:    '#2A2A2A',
  text:       '#E0E0E0',
  textSoft:   '#B0B0B0',
  subtle:     '#6B7280',
  border:     '#2D2D2D',
  primary:    '#007AFF',
  primarySoft:'#1A2A3A',
  headerBg:   '#1A1A1A',
  headerText: '#E0E0E0',
  inputBg:    '#2A2A2A',
  tabBar:     '#1A1A1A',
  tabActive:  '#007AFF',
  tabInactive:'#6B7280',
  danger:     '#EF4444',
  success:    '#22C55E',
};

// ─── React Navigation themes ──────────────────────────────────────────────────
export const NAV_LIGHT = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: LIGHT_COLORS.bg,
    primary:    LIGHT_COLORS.primary,
    card:       LIGHT_COLORS.headerBg,
    text:       LIGHT_COLORS.text,
    border:     LIGHT_COLORS.border,
  },
};

export const NAV_DARK = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: DARK_COLORS.bg,
    primary:    DARK_COLORS.primary,
    card:       DARK_COLORS.headerBg,
    text:       DARK_COLORS.text,
    border:     DARK_COLORS.border,
  },
};

// ─── Context ──────────────────────────────────────────────────────────────────
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const system = useColorScheme();
  const [userPref, setUserPref] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then((v) => { if (v === 'dark' || v === 'light') setUserPref(v); })
      .catch(() => {});
  }, []);

  const isDark = userPref !== null ? userPref === 'dark' : system === 'dark';
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  const toggleTheme = async () => {
    const next = isDark ? 'light' : 'dark';
    setUserPref(next);
    try { await AsyncStorage.setItem(THEME_KEY, next); } catch {}
  };

  const setTheme = async (mode) => {
    setUserPref(mode);
    try { await AsyncStorage.setItem(THEME_KEY, mode); } catch {}
  };

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be inside ThemeProvider');
  return ctx;
}
