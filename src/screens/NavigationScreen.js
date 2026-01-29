import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Dimensions, Platform, ActivityIndicator } from 'react-native';
import { theme } from '../constants/theme';
import MapboxGL from '@rnmapbox/maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import Toast from 'react-native-toast-message';

// Make sure token is set
if (Platform.OS !== 'web') {
    MapboxGL.setAccessToken('pk.eyJ1IjoiZXRvcGlhMTIzNCIsImEiOiJjbWtzMDZtenUxN3NlM2VzOTJobnp5dm1jIn0.nJ-d1lTNg9LBgfxp9BOR5A');
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
    const [routeInfo, setRouteInfo] = useState(null); // { distance, duration }
    const [coordinates, setCoordinates] = useState(null); // { start: [], end: [] }
    const [userLocation, setUserLocation] = useState(null);
    const cameraRef = useRef(null);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;
            let location = await Location.getCurrentPositionAsync({});
            setUserLocation([location.coords.longitude, location.coords.latitude]);
        })();
    }, []);

    // Placeholder for Geocoding (In real app, fetch from Mapbox Geocoding API)
    const handleSearch = async () => {
        if (!destination) return;
        Toast.show({ type: 'info', text1: 'Searching...', text2: `Routing to ${destination}` });

        // Simulating a geocode result for demo (e.g., somewhere nearby in Lagos)
        // In reality: Fetch 'https://api.mapbox.com/geocoding/v5/mapbox.places/...'
        const simulatedDest = [3.3792 + (Math.random() * 0.05), 6.5244 + (Math.random() * 0.05)];

        setCoordinates({
            start: userLocation || [3.3792, 6.5244],
            end: simulatedDest
        });

        setRouteInfo({
            duration: Math.floor(10 + Math.random() * 30) + ' min',
            distance: (2 + Math.random() * 10).toFixed(1) + ' km'
        });

        if (cameraRef.current) {
            cameraRef.current.fitBounds(
                userLocation || [3.3792, 6.5244],
                simulatedDest,
                [50, 50, 50, 50],
                1000
            );
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
                />
                <MapboxGL.UserLocation visible={true} showsUserHeadingIndicator={true} />

                {coordinates && (
                    <>
                        <MapboxGL.PointAnnotation id="dest" coordinate={coordinates.end}>
                            <View style={styles.markerContainer}>
                                <View style={styles.markerDot} />
                            </View>
                        </MapboxGL.PointAnnotation>

                        {/* Route Line (Simulated Straight Line for now without Directions API Key configured extensively) */}
                        {/* In real implementation, use Mapbox Directions API for ShapeSource sourceLayer */}
                        <MapboxGL.ShapeSource id="routeSource" shape={{
                            type: 'Feature',
                            properties: {},
                            geometry: {
                                type: 'LineString',
                                coordinates: [coordinates.start, coordinates.end]
                            }
                        }}>
                            <MapboxGL.LineLayer id="routeFill" style={{ lineColor: theme.colors.primary, lineWidth: 4 }} />
                        </MapboxGL.ShapeSource>
                    </>
                )}
            </MapboxGL.MapView>

            {/* UI Overlay */}
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <TextInput
                    style={styles.input}
                    placeholder="Search destination..."
                    placeholderTextColor="#666"
                    value={destination}
                    onChangeText={setDestination}
                    onSubmitEditing={handleSearch}
                />
                <TouchableOpacity onPress={handleSearch} style={styles.searchBtn}>
                    <Ionicons name="search" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Route Info Card */}
            {routeInfo && (
                <View style={styles.infoCard}>
                    <View>
                        <Text style={styles.timeText}>{routeInfo.duration}</Text>
                        <Text style={styles.distText}>{routeInfo.distance}</Text>
                    </View>
                    <TouchableOpacity style={styles.goBtn}>
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
        flex: 1,
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
    searchBtn: {
        width: 45,
        height: 45,
        borderRadius: 25,
        backgroundColor: theme.colors.primary,
        marginLeft: 10,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5
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
        elevation: 10
    },
    timeText: { fontSize: 24, fontWeight: 'bold', color: theme.colors.primary },
    distText: { fontSize: 14, color: '#666', marginTop: 2 },
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
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(0, 255, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    markerDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: theme.colors.primary
    }
});
