import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { theme } from '../constants/theme';
import socketService from '../services/socket';
import api from '../services/api';

// Only import maps on native platforms (Android/iOS)
let MapView, Marker, PROVIDER_GOOGLE;
// if (Platform.OS !== 'web') {
//     try {
//         const Maps = require('react-native-maps');
//         MapView = Maps.default;
//         Marker = Maps.Marker;
//         PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
//     } catch (err) {
//         console.warn('Failed to load react-native-maps:', err);
//     }
// }

export default function DriverArrivalScreen({ route, navigation }) {
    const { rideId } = route.params || {};
    const [rideData, setRideData] = useState(null);
    const [driverLocation, setDriverLocation] = useState(null);
    const [eta, setEta] = useState(null);
    const [routeLine, setRouteLine] = useState(null);

    useEffect(() => {
        if (rideId) {
            // 1. Fetch initial ride details
            fetchRideStatus();

            // 2. Join ride room for tracking
            socketService.emit('join_ride', rideId);

            // 3. Listen for location updates
            const handleLocationUpdate = (location) => {
                console.log('📍 Driver location updated:', location);
                setDriverLocation(location);
                // In a real app, you'd recalculate ETA here using Google Maps Directions API
                calculateMockETA();
            };

            socketService.on('driver_location', handleLocationUpdate);

            return () => {
                socketService.off('driver_location', handleLocationUpdate);
            };
        }
    }, [rideId]);

    const fetchRideStatus = async () => {
        try {
            const response = await api.get(`/ride/status/${rideId}`);
            setRideData(response.data);
            setEta(response.data.eta || 5);

            if (response.data.pickup && response.data.dropoff) {
                // Initial location if provided
                if (response.data.driver?.location) {
                    setDriverLocation(response.data.driver.location);
                }
            }
        } catch (error) {
            console.error('Error fetching ride status:', error);
            Alert.alert('Error', 'Could not fetch ride status');
        }
    };

    const calculateMockETA = () => {
        // Simple logic: reduce ETA every few updates for simulation
        setEta(prev => (prev > 1 ? prev - 0.1 : 1));
    };

    if (!rideId) {
        return (
            <View style={styles.errorContainer}>
                <Text>No active ride found.</Text>
                <TouchableOpacity onPress={() => navigation.navigate('MainTab')}>
                    <Text style={{ color: theme.colors.primary, marginTop: 10 }}>Go Home</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={[styles.map, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }]}>
                <Text style={{ fontSize: 16, color: '#666' }}>
                    Map Disabled Temporarily
                </Text>
            </View>

            <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('MainTab')}>
                <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>

            <View style={styles.bottomSheet}>
                <View style={styles.topBar}>
                    <View style={styles.handle} />
                </View>

                <Text style={styles.status}>
                    {rideData?.status === 'searching' ? 'Finding your driver...' : 'Driver is on the way'}
                </Text>
                <Text style={styles.time}>{Math.ceil(eta || 0)} mins</Text>

                <View style={styles.driverCard}>
                    <View style={styles.driverInfo}>
                        <View style={styles.avatarPlaceholder}>
                            {rideData?.driver?.avatar ? (
                                <Text style={{ fontSize: 24 }}>🚗</Text>
                            ) : (
                                <Text style={{ fontSize: 24 }}>👤</Text>
                            )}
                        </View>
                        <View>
                            <Text style={styles.driverName}>{rideData?.driver?.name || 'Searching...'}</Text>
                            <Text style={styles.carInfo}>
                                {rideData?.driver?.car ? `${rideData.driver.car.make} ${rideData.driver.car.model}` : 'Waiting for assignment'}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Calling...', 'Dialing driver...')}>
                            <Text style={styles.actionIcon}>📞</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Chat', { otherUser: rideData?.driver })}>
                            <Text style={styles.actionIcon}>💬</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.navigate('MainTab')}>
                    <Text style={styles.cancelText}>Cancel Ride</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
        backgroundColor: '#fff',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5
    },
    backArrow: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000'
    },
    map: {
        height: '65%',
    },
    bottomSheet: {
        height: '38%',
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: theme.spacing.l,
        marginTop: -30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 10,
        alignItems: 'center'
    },
    topBar: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 10
    },
    handle: {
        width: 40,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: '#E0E0E0'
    },
    status: {
        fontSize: 14,
        color: theme.colors.darkGray,
        marginBottom: 5,
        textTransform: 'uppercase',
        letterSpacing: 1
    },
    time: {
        fontSize: 32,
        fontWeight: '900',
        color: theme.colors.text,
        marginBottom: theme.spacing.m
    },
    driverCard: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.m,
        padding: theme.spacing.m,
        backgroundColor: theme.colors.inputBg || '#F5F5F5',
        borderRadius: 20
    },
    driverInfo: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#E0E0E0',
        marginRight: theme.spacing.m,
        justifyContent: 'center',
        alignItems: 'center'
    },
    driverName: {
        fontWeight: 'bold',
        fontSize: 16,
        color: theme.colors.text
    },
    carInfo: {
        fontSize: 12,
        color: theme.colors.darkGray
    },
    actions: {
        flexDirection: 'row'
    },
    actionBtn: {
        marginLeft: theme.spacing.s,
        padding: 10,
        backgroundColor: '#fff',
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2
    },
    actionIcon: {
        fontSize: 18
    },
    cancelBtn: {
        width: '100%',
        padding: theme.spacing.m,
        borderRadius: 15,
        backgroundColor: '#FFF1F0',
        alignItems: 'center'
    },
    cancelText: {
        color: theme.colors.error,
        fontWeight: 'bold',
        fontSize: 15
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
});
