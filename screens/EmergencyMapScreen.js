import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Linking, Platform, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { fetchNearbyHospitals, formatDistance } from '../services/hospitalService';

const SEARCH_RADIUS = 5000; // 5 km

const ICON_BY_TYPE = {
  hospital:      '🏥',
  clinic:        '🏨',
  doctors:       '👨‍⚕️',
  health_centre: '⚕️',
};

// ── Status states ─────────────────────────────────────────────────────────────
const STATUS = {
  IDLE:           'idle',
  LOCATION:       'location',
  FETCHING:       'fetching',
  READY:          'ready',
  ERROR_LOCATION: 'error_location',
  ERROR_NETWORK:  'error_network',
};

export default function EmergencyMapScreen() {
  const { colors } = useAppTheme();
  const mapRef = useRef(null);

  const [status,     setStatus]     = useState(STATUS.IDLE);
  const [errorMsg,   setErrorMsg]   = useState('');
  const [location,   setLocation]   = useState(null);    // { latitude, longitude }
  const [hospitals,  setHospitals]  = useState([]);
  const [selected,   setSelected]   = useState(null);   // selected hospital
  const [listVisible, setListVisible] = useState(false);

  const load = useCallback(async () => {
    setSelected(null);
    setErrorMsg('');

    // 1. Request location permission
    setStatus(STATUS.LOCATION);
    const { status: perm } = await Location.requestForegroundPermissionsAsync();
    if (perm !== 'granted') {
      setStatus(STATUS.ERROR_LOCATION);
      setErrorMsg('Location access is required to find nearby hospitals.');
      return;
    }

    // 2. Get current position
    let pos;
    try {
      pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    } catch (e) {
      setStatus(STATUS.ERROR_LOCATION);
      setErrorMsg('Could not get your location. Please enable GPS and try again.');
      return;
    }

    const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    setLocation(coords);

    // 3. Fly map to location
    mapRef.current?.animateToRegion({
      ...coords,
      latitudeDelta:  0.05,
      longitudeDelta: 0.05,
    }, 800);

    // 4. Fetch hospitals
    setStatus(STATUS.FETCHING);
    try {
      const results = await fetchNearbyHospitals(coords.latitude, coords.longitude, SEARCH_RADIUS);
      setHospitals(results);
      setStatus(STATUS.READY);
    } catch (e) {
      setStatus(STATUS.ERROR_NETWORK);
      setErrorMsg(e.message || 'Unable to fetch hospitals. Please check your connection.');
    }
  }, []);

  useEffect(() => { load(); }, []);

  const openSettings = () => {
    if (Platform.OS === 'ios') Linking.openURL('app-settings:');
    else Linking.openSettings();
  };

  const openDirections = (h) => {
    const url = Platform.OS === 'ios'
      ? `maps://?daddr=${h.lat},${h.lon}&dirflg=d`
      : `geo:${h.lat},${h.lon}?q=${encodeURIComponent(h.name)}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lon}`);
    });
  };

  const centerOnUser = () => {
    if (!location) return;
    mapRef.current?.animateToRegion({ ...location, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 600);
  };

  // ── Overlay states ───────────────────────────────────────────────────────────
  const isLoading = status === STATUS.LOCATION || status === STATUS.FETCHING;
  const loadingMsg = status === STATUS.LOCATION ? 'Getting your location…' : 'Finding nearby hospitals…';

  // ── Hospital list item ───────────────────────────────────────────────────────
  const renderHospital = ({ item }) => (
    <TouchableOpacity
      style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.border },
        selected?.id === item.id && { borderColor: colors.primary, borderWidth: 2 }]}
      onPress={() => {
        setSelected(item);
        setListVisible(false);
        mapRef.current?.animateToRegion({ latitude: item.lat, longitude: item.lon, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 600);
      }}
    >
      <Text style={styles.listEmoji}>{ICON_BY_TYPE[item.type] || '🏥'}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.listName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[styles.listDist, { color: colors.subtle }]}>{formatDistance(item.distance)}</Text>
        {item.address ? <Text style={[styles.listAddr, { color: colors.subtle }]} numberOfLines={1}>{item.address}</Text> : null}
      </View>
      <Ionicons name="navigate-outline" size={18} color={colors.primary} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* ── Map ── */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_DEFAULT}
        showsUserLocation={!!location}
        showsMyLocationButton={false}
        initialRegion={{
          latitude:       location?.latitude  ?? 51.505,
          longitude:      location?.longitude ?? -0.09,
          latitudeDelta:  0.05,
          longitudeDelta: 0.05,
        }}
        onPress={() => { setSelected(null); }}
      >
        {/* OpenStreetMap tiles — free, no API key */}
        <UrlTile
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
          tileSize={256}
          shouldReplaceMapContent={true}
        />

        {/* Hospital markers */}
        {hospitals.map((h) => (
          <Marker
            key={h.id}
            coordinate={{ latitude: h.lat, longitude: h.lon }}
            title={h.name}
            description={h.address ?? formatDistance(h.distance)}
            onPress={() => setSelected(h)}
          >
            <View style={[styles.markerWrap, selected?.id === h.id && styles.markerSelected]}>
              <Text style={styles.markerEmoji}>{ICON_BY_TYPE[h.type] || '🏥'}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* ── Header ── */}
      <SafeAreaView style={styles.headerSafe} edges={['top']}>
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Emergency Map</Text>
            <Text style={[styles.headerSub, { color: colors.subtle }]}>
              {status === STATUS.READY
                ? `${hospitals.length} hospital${hospitals.length !== 1 ? 's' : ''} found nearby`
                : isLoading ? loadingMsg : ''}
            </Text>
          </View>
          {/* List / Refresh buttons */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {status === STATUS.READY && (
              <TouchableOpacity style={[styles.hdrBtn, { backgroundColor: colors.primarySoft ?? '#E8F2FF' }]}
                onPress={() => setListVisible((v) => !v)}>
                <Ionicons name="list-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.hdrBtn, { backgroundColor: colors.primarySoft ?? '#E8F2FF' }]}
              onPress={load}>
              <Ionicons name="refresh-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* ── Loading overlay ── */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={[styles.loadingCard, { backgroundColor: colors.card }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>{loadingMsg}</Text>
          </View>
        </View>
      )}

      {/* ── Error overlay ── */}
      {(status === STATUS.ERROR_LOCATION || status === STATUS.ERROR_NETWORK) && (
        <View style={styles.loadingOverlay}>
          <View style={[styles.errorCard, { backgroundColor: colors.card }]}>
            <Ionicons name={status === STATUS.ERROR_LOCATION ? 'location-outline' : 'wifi-outline'} size={52} color="#EF4444" />
            <Text style={[styles.errorTitle, { color: colors.text }]}>
              {status === STATUS.ERROR_LOCATION ? 'Location Unavailable' : 'Connection Error'}
            </Text>
            <Text style={[styles.errorBody, { color: colors.subtle }]}>{errorMsg}</Text>
            {status === STATUS.ERROR_LOCATION ? (
              <TouchableOpacity style={[styles.errBtn, { backgroundColor: colors.primary }]} onPress={openSettings}>
                <Text style={styles.errBtnText}>Open Settings</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.errBtn, { backgroundColor: colors.primary }]} onPress={load}>
                <Text style={styles.errBtnText}>Try Again</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* ── Centre-on-me FAB ── */}
      {location && !isLoading && (
        <TouchableOpacity
          style={[styles.locationFab, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={centerOnUser}
        >
          <Ionicons name="locate-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      )}

      {/* ── Hospital detail card ── */}
      {selected && (
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <View style={styles.infoRow}>
            <Text style={styles.infoEmoji}>{ICON_BY_TYPE[selected.type] || '🏥'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoName, { color: colors.text }]}>{selected.name}</Text>
              <Text style={[styles.infoDist, { color: colors.primary }]}>{formatDistance(selected.distance)} away</Text>
              {selected.address ? <Text style={[styles.infoAddr, { color: colors.subtle }]}>{selected.address}</Text> : null}
              {selected.phone   ? <Text style={[styles.infoPhone, { color: colors.subtle }]}>📞 {selected.phone}</Text> : null}
              {selected.emergency && <Text style={{ color: '#22C55E', fontSize: 12, fontFamily: 'Poppins_600SemiBold', marginTop: 2 }}>✅ Emergency services</Text>}
            </View>
            <TouchableOpacity onPress={() => setSelected(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color={colors.subtle} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.directionsBtn, { backgroundColor: colors.primary }]}
            onPress={() => openDirections(selected)}>
            <Ionicons name="navigate" size={16} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.directionsBtnText}>Get Directions</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Hospital list sheet ── */}
      {listVisible && (
        <View style={[styles.listSheet, { backgroundColor: colors.bg }]}>
          <View style={[styles.listHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.listTitle, { color: colors.text }]}>Nearby ({hospitals.length})</Text>
            <TouchableOpacity onPress={() => setListVisible(false)}>
              <Ionicons name="close" size={22} color={colors.subtle} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={hospitals}
            keyExtractor={(h) => h.id}
            renderItem={renderHospital}
            contentContainerStyle={{ padding: 12 }}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1 },
  headerSafe:      { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 12, marginTop: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, elevation: 4, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  headerTitle:     { fontFamily: 'Poppins_700Bold', fontSize: 16 },
  headerSub:       { fontFamily: 'Poppins_400Regular', fontSize: 12, marginTop: 1 },
  hdrBtn:          { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  loadingOverlay:  { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.35)' },
  loadingCard:     { borderRadius: 20, padding: 28, alignItems: 'center', width: 220 },
  loadingText:     { fontFamily: 'Poppins_400Regular', fontSize: 14, marginTop: 14, textAlign: 'center' },
  errorCard:       { borderRadius: 20, padding: 28, alignItems: 'center', marginHorizontal: 32 },
  errorTitle:      { fontFamily: 'Poppins_700Bold', fontSize: 18, marginTop: 14, marginBottom: 8 },
  errorBody:       { fontFamily: 'Poppins_400Regular', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  errBtn:          { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 },
  errBtnText:      { color: '#fff', fontFamily: 'Poppins_700Bold', fontSize: 15 },
  locationFab:     { position: 'absolute', right: 16, bottom: 220, width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', elevation: 4, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  markerWrap:      { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  markerSelected:  { borderWidth: 2, borderColor: '#007AFF' },
  markerEmoji:     { fontSize: 20 },
  infoCard:        { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, elevation: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: -3 } },
  infoRow:         { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  infoEmoji:       { fontSize: 36, marginRight: 12 },
  infoName:        { fontFamily: 'Poppins_700Bold', fontSize: 16, lineHeight: 22 },
  infoDist:        { fontFamily: 'Poppins_600SemiBold', fontSize: 13, marginTop: 2 },
  infoAddr:        { fontFamily: 'Poppins_400Regular', fontSize: 12, marginTop: 3 },
  infoPhone:       { fontFamily: 'Poppins_400Regular', fontSize: 12, marginTop: 2 },
  directionsBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 13, paddingVertical: 13 },
  directionsBtnText:{ color: '#fff', fontFamily: 'Poppins_700Bold', fontSize: 15 },
  listSheet:       { position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', borderTopLeftRadius: 20, borderTopRightRadius: 20, elevation: 12 },
  listHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  listTitle:       { fontFamily: 'Poppins_700Bold', fontSize: 16 },
  listItem:        { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, marginBottom: 8 },
  listEmoji:       { fontSize: 28, marginRight: 10 },
  listName:        { fontFamily: 'Poppins_600SemiBold', fontSize: 14 },
  listDist:        { fontFamily: 'Poppins_400Regular', fontSize: 12, marginTop: 2 },
  listAddr:        { fontFamily: 'Poppins_400Regular', fontSize: 11, marginTop: 2 },
});
