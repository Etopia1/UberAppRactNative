import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Dimensions, Platform, ActivityIndicator, FlatList, Keyboard } from 'react-native';
import { theme } from '../constants/theme';
import MapboxGL from '@rnmapbox/maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';

// Make sure token is set
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiZXRvcGlhMTIzNCIsImEiOiJjbWtzMDZtenUxN3NlM2VzOTJobnp5dm1jIn0.nJ-d1lTNg9LBgfxp9BOR5A';
if (Platform.OS !== 'web') {
    MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN);
}

const { width, height } = Dimensions.get('window');

export default function NavigationScreen({ navigation }) {
    if (Platform.OS === 'web') {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Navigation not supported on Web</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20, padding: 10 }}>
                    <Text style={{ color: 'blue' }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const [destination, setDestination] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [routeInfo, setRouteInfo] = useState(null); // { distance, duration }
    const [coordinates, setCoordinates] = useState(null); // { start: [], end: [] }
    const [routeGeoJSON, setRouteGeoJSON] = useState(null); // Actual route path
    const [userLocation, setUserLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const cameraRef = useRef(null);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;
            let location = await Location.getCurrentPositionAsync({});
            setUserLocation([location.coords.longitude, location.coords.latitude]);
        })();
    }, []);

    // Search Address Suggestions (Mapbox Geocoding)
    const searchAddress = async (text) => {
        setDestination(text);
        if (text.length < 3) {
            setSuggestions([]);
            return;
        }

        try {
            const proximity = userLocation ? `&proximity=${userLocation[0]},${userLocation[1]}` : '';
            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(text)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=NG&limit=5${proximity}`
            );
            const data = await response.json();
            setSuggestions(data.features || []);
        } catch (error) {
            console.error('Geocoding error:', error);
        }
    };

    // Select Destination & Fetch Route
    const handleSelectDestination = async (feature) => {
        Keyboard.dismiss();
        setSuggestions([]);
        setDestination(feature.place_name);
        setLoading(true);

        const destCoords = feature.center; // [lng, lat]
        const startCoords = userLocation;

        if (!startCoords) {
            Toast.show({ type: 'error', text1: 'Location Error', text2: 'User location not found' });
            setLoading(false);
            return;
        }

        try {
            // Fetch Route from Mapbox Directions API
            const response = await fetch(
                `https://api.mapbox.com/directions/v5/mapbox/driving/${startCoords[0]},${startCoords[1]};${destCoords[0]},${destCoords[1]}?geometries=geojson&access_token=${MAPBOX_ACCESS_TOKEN}`
            );
            const data = await response.json();

            if (!data.routes || data.routes.length === 0) {
                Toast.show({ type: 'error', text1: 'Route Error', text2: 'No route found' });
                setLoading(false);
                return;
            }

            const route = data.routes[0];

            // Set Route Data
            setCoordinates({ start: startCoords, end: destCoords });
            setRouteGeoJSON({
                type: 'Feature',
                properties: {},
                geometry: route.geometry
            });

            setRouteInfo({
                duration: Math.round(route.duration / 60) + ' min',
                distance: (route.distance / 1000).toFixed(1) + ' km'
            });

            // Fit Camera to Route
            if (cameraRef.current) {
                cameraRef.current.fitBounds(
                    [Math.min(startCoords[0], destCoords[0]), Math.min(startCoords[1], destCoords[1])],
                    [Math.max(startCoords[0], destCoords[0]), Math.max(startCoords[1], destCoords[1])],
                    [100, 50, 100, 50], // padding: top, right, bottom, left
                    1000 // animation duration
                );
            }

        } catch (error) {
            console.error('Routing error:', error);
            Toast.show({ type: 'error', text1: 'Network Error', text2: 'Failed to fetch route' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Map Layer */}
            <MapboxGL.MapView style={styles.map} logoEnabled={false} attributionEnabled={false}>
                <MapboxGL.Camera
                    ref={cameraRef}
                    zoomLevel={14}
                    centerCoordinate={userLocation || [3.3792, 6.5244]}
                    animationMode={'flyTo'}
                    animationDuration={2000}
                />
                <MapboxGL.UserLocation visible={true} showsUserHeadingIndicator={true} />

                {/* Destination Marker */}
                {coordinates && (
                    <MapboxGL.PointAnnotation id="dest" coordinate={coordinates.end}>
                        <View style={styles.markerContainer}>
                            <View style={styles.markerDot} />
                        </View>
                    </MapboxGL.PointAnnotation>
                )}

                {/* Real Route Line (Polyline) */}
                {routeGeoJSON && (
                    <MapboxGL.ShapeSource id="routeSource" shape={routeGeoJSON}>
                        <MapboxGL.LineLayer
                            id="routeFill"
                            style={{
                                lineColor: theme.colors.primary,
                                lineWidth: 5,
                                lineCap: 'round',
                                lineJoin: 'round'
                            }}
                        />
                    </MapboxGL.ShapeSource>
                )}
            </MapboxGL.MapView>

            {/* Top Bar with Search */}
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <TextInput
                        style={styles.input}
                        placeholder="Search destination..."
                        placeholderTextColor="#666"
                        value={destination}
                        onChangeText={searchAddress}
                    />
                </View>
                {loading && <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginLeft: 10 }} />}
            </View>

            {/* Address Suggestions Dropdown */}
            {suggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                    <FlatList
                        data={suggestions}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity onPress={() => handleSelectDestination(item)} style={styles.suggestionItem}>
                                <Ionicons name="location-outline" size={20} color="#666" style={{ marginRight: 10 }} />
                                <Text style={styles.suggestionText} numberOfLines={1}>{item.place_name}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}

            {/* Route Info Card */}
            {routeInfo && !loading && (
                <View style={styles.infoCard}>
                    <View>
                        <Text style={styles.timeText}>{routeInfo.duration}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="resize" size={14} color="#666" style={{ marginRight: 4 }} />
                            <Text style={styles.distText}>{routeInfo.distance}</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.goBtn} onPress={() => Toast.show({ type: 'success', text1: 'Starting Navigation', text2: 'Drive safely!' })}>
                        <Text style={styles.goText}>GO</Text>
                        <Ionicons name="navigate" size={20} color="#fff" style={{ marginLeft: 5 }} />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    map: { flex: 1 },
    topBar: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 10
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        elevation: 5
    },
    input: {
        height: 45,
        backgroundColor: '#fff',
        borderRadius: 25,
        paddingHorizontal: 20,
        fontSize: 16,
        color: '#000',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4
    },
    suggestionsContainer: {
        position: 'absolute',
        top: 100,
        left: 20,
        right: 20,
        backgroundColor: '#fff',
        borderRadius: 10,
        maxHeight: 200,
        zIndex: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    suggestionText: {
        flex: 1,
        fontSize: 14,
        color: '#333'
    },
    infoCard: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8
    },
    timeText: { fontSize: 24, fontWeight: 'bold', color: theme.colors.primary },
    distText: { fontSize: 14, color: '#666' },
    goBtn: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center'
    },
    goText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
    markerContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    markerDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: theme.colors.primary,
        borderWidth: 2,
        borderColor: '#fff'
    }
});
