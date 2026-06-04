import { registerRootComponent } from 'expo';
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts, Poppins_400Regular, Poppins_600SemiBold,
  Poppins_700Bold, Poppins_800ExtraBold,
} from '@expo-google-fonts/poppins';

import { ThemeProvider, useAppTheme, NAV_LIGHT, NAV_DARK } from './context/ThemeContext';
import { loadInterstitial } from './services/adManager';
import { setupNotificationHandler, rescheduleAll } from './services/notificationService';
import { getAppointments, getMedications } from './utils/storage';

// ── Screens ───────────────────────────────────────────────────────────────────
import HomeScreen          from './screens/HomeScreen';
import DiseaseListScreen   from './screens/DiseaseListScreen';
import DiseaseDetailScreen from './screens/DiseaseDetailScreen';
import FavoritesScreen     from './screens/FavoritesScreen';
import AIChatScreen        from './screens/AIChatScreen';
import RemindersScreen     from './screens/RemindersScreen';
import EmergencyMapScreen  from './screens/EmergencyMapScreen';
import SettingsScreen      from './screens/SettingsScreen';
import TermsScreen         from './screens/TermsScreen';
import PrivacyScreen       from './screens/PrivacyScreen';

SplashScreen.preventAutoHideAsync();

// Set up notification handler ONCE before any component renders
setupNotificationHandler();

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

// ── Tab icon map ───────────────────────────────────────────────────────────────
const TAB_ICONS = {
  HomeTab:      { active: 'home',          inactive: 'home-outline' },
  Favorites:    { active: 'heart',         inactive: 'heart-outline' },
  AIChat:       { active: 'chatbubble',    inactive: 'chatbubble-outline' },
  RemindersTab: { active: 'notifications', inactive: 'notifications-outline' },
  Emergency:    { active: 'location',      inactive: 'location-outline' },
  SettingsTab:  { active: 'settings',      inactive: 'settings-outline' },
};

// ── Shared stack screen options ───────────────────────────────────────────────
function stackOpts(colors) {
  return {
    headerStyle:            { backgroundColor: colors.headerBg },
    headerTintColor:        colors.headerText,
    headerTitleStyle:       { fontFamily: 'Poppins_700Bold', fontSize: 17 },
    headerBackTitleVisible: false,
    animation:              'slide_from_right',
  };
}

// ── Stacks ────────────────────────────────────────────────────────────────────
function HomeStack() {
  const { colors } = useAppTheme();
  return (
    <Stack.Navigator screenOptions={stackOpts(colors)}>
      <Stack.Screen name="HomeMain"      component={HomeScreen}          options={{ headerShown: false }} />
      <Stack.Screen name="DiseaseList"   component={DiseaseListScreen}   options={{ title: 'Conditions' }} />
      <Stack.Screen name="DiseaseDetail" component={DiseaseDetailScreen} options={{ title: '' }} />
    </Stack.Navigator>
  );
}

function FavoritesStack() {
  const { colors } = useAppTheme();
  return (
    <Stack.Navigator screenOptions={stackOpts(colors)}>
      <Stack.Screen name="FavoritesMain" component={FavoritesScreen}     options={{ title: 'Saved Conditions' }} />
      <Stack.Screen name="DiseaseDetail" component={DiseaseDetailScreen} options={{ title: '' }} />
    </Stack.Navigator>
  );
}

function RemindersStack() {
  const { colors } = useAppTheme();
  return (
    <Stack.Navigator screenOptions={stackOpts(colors)}>
      <Stack.Screen name="RemindersMain" component={RemindersScreen} options={{ title: 'Reminders' }} />
    </Stack.Navigator>
  );
}

function SettingsStack() {
  const { colors } = useAppTheme();
  return (
    <Stack.Navigator screenOptions={stackOpts(colors)}>
      <Stack.Screen name="SettingsMain" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="Terms"        component={TermsScreen}    options={{ title: 'Terms & Conditions' }} />
      <Stack.Screen name="Privacy"      component={PrivacyScreen}  options={{ title: 'Privacy Policy' }} />
    </Stack.Navigator>
  );
}

// ── Tab navigator ─────────────────────────────────────────────────────────────
function TabNavigator() {
  const { isDark, colors } = useAppTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const icons = TAB_ICONS[route.name] ?? { active: 'ellipse', inactive: 'ellipse-outline' };
        return {
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? icons.active : icons.inactive} size={23} color={color} />
          ),
          tabBarStyle: {
            backgroundColor:  colors.tabBar,
            borderTopColor:   colors.border,
            borderTopWidth:   StyleSheet.hairlineWidth ?? 1,
            height:           58,
            paddingBottom:    6,
            paddingTop:       4,
          },
          tabBarActiveTintColor:   colors.tabActive,
          tabBarInactiveTintColor: colors.tabInactive,
          tabBarLabelStyle: { fontFamily: 'Poppins_600SemiBold', fontSize: 10 },
        };
      }}
    >
      <Tab.Screen name="HomeTab"      component={HomeStack}        options={{ title: 'Home' }} />
      <Tab.Screen name="Favorites"    component={FavoritesStack}   options={{ title: 'Saved' }} />
      <Tab.Screen name="AIChat"       component={AIChatScreen}     options={{ title: 'AI Chat' }} />
      <Tab.Screen name="RemindersTab" component={RemindersStack}   options={{ title: 'Reminders' }} />
      <Tab.Screen name="Emergency"    component={EmergencyMapScreen} options={{ title: 'Nearby' }} />
      <Tab.Screen name="SettingsTab"  component={SettingsStack}    options={{ title: 'Settings' }} />
    </Tab.Navigator>
  );
}


// ── Root app (fonts + startup tasks) ─────────────────────────────────────────
function AppNavigator() {
  const { isDark, colors } = useAppTheme();

  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular, Poppins_600SemiBold,
    Poppins_700Bold, Poppins_800ExtraBold,
  });

  useEffect(() => {
    // Preload interstitial ad
    const cleanup = loadInterstitial();
    return cleanup;
  }, []);

  useEffect(() => {
    // Re-schedule all notifications on startup
    (async () => {
      const [appointments, medications] = await Promise.all([
        getAppointments(),
        getMedications(),
      ]);
      await rescheduleAll(appointments, medications);
    })();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={isDark ? NAV_DARK : NAV_LIGHT}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <TabNavigator />
    </NavigationContainer>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppNavigator />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

registerRootComponent(App);
