import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { theme } from '../constants/theme';
import api from '../services/api';
// import socketService from '../services/socket'; // Will use later for real-time requests

export default function DriverDashboardScreen({ navigation }) {
    const user = useSelector(state => state.auth.user);
    const [isOnline, setIsOnline] = useState(user?.isOnline || false);
    const [loading, setLoading] = useState(false);

    // --- RIDE REQUEST MODAL STATE ---
    const [request, setRequest] = useState(null); // { rideId, pickup, dropoff, fare, user }
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        if (!user?._id) return;

        // Listen for requests
        const handleRequest = (data) => {
            console.log('Driver received request:', data);
            setRequest(data);
            setModalVisible(true);
        };

        // Listen for new requests
        // Assuming socketService is globally available or imported
        // Ideally we should import socketService from ../services/socket
        const socket = require('../services/socket').default;
        socket.connect(user._id);
        socket.on('new_ride_request', handleRequest);

        return () => {
            socket.off('new_ride_request', handleRequest);
        };
    }, [user]);

    const handleAccept = async () => {
        if (!request) return;
        setLoading(true);
        try {
            await api.post(`/ride/${request.rideId}/accept`, { driverId: user._id });
            setModalVisible(false);
            navigation.navigate('DriverArrival', { rideId: request.rideId });
        } catch (error) {
            console.error(error);
            alert('Failed to accept ride. It may have been taken.');
            setModalVisible(false);
        } finally {
            setLoading(false);
        }
    };

    const handleDecline = () => {
        setModalVisible(false);
        setRequest(null);
    };

    return (
        <View style={styles.container}>
            {/* Map Background */}
            <View style={styles.mapContainer}>
                {/* Lazy load Map to avoid import cycles if any, or just direct use */}
                <Map style={StyleSheet.absoluteFillObject} />
            </View>

            {/* Offline Overlay / Online Header */}
            <View style={styles.overlay}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.profileBadge}>
                        <Text style={styles.profileName}>{user?.name?.split(' ')[0]}</Text>
                        <Text style={styles.rating}>★ 4.9</Text>
                    </View>
                    <View style={styles.earningsBadge}>
                        <Text style={styles.earningsText}>$125.50</Text>
                    </View>
                </View>

                {/* Bottom Control Panel */}
                <View style={styles.bottomPanel}>
                    {isOnline ? (
                        <View style={styles.onlineStatus}>
                            <ActivityIndicator color={theme.colors.primary} style={{ marginRight: 10 }} />
                            <Text style={styles.onlineText}>You're Online. Finding trips...</Text>
                        </View>
                    ) : (
                        <Text style={styles.offlineText}>You are currently offline</Text>
                    )}

                    {/* Go Online Button */}
                    <TouchableOpacity
                        style={[styles.goButton, { backgroundColor: isOnline ? theme.colors.error : theme.colors.primary }]}
                        onPress={() => toggleStatus(!isOnline)}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : (
                            <Text style={styles.goButtonText}>{isOnline ? 'GO OFFLINE' : 'GO ONLINE'}</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Request Modal */}
            {modalVisible && request && (
                <View style={styles.modalContainer}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>New Ride Request! 🚗</Text>

                        <View style={styles.routeRow}>
                            <Text style={styles.routeLabel}>📍 From:</Text>
                            <Text style={styles.routeVal}>{request.pickup.address}</Text>
                        </View>
                        <View style={styles.routeRow}>
                            <Text style={styles.routeLabel}>🏁 To:</Text>
                            <Text style={styles.routeVal}>{request.dropoff.address}</Text>
                        </View>

                        <View style={styles.fareContainer}>
                            <Text style={styles.fareText}>${request.fare}</Text>
                            <Text style={styles.timeText}>~5 min away</Text>
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.declineBtn} onPress={handleDecline}>
                                <Text style={styles.declineText}>Decline</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept}>
                                <Text style={styles.acceptText}>Accept Ride</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
}

// Need to import Map if not already
import Map from '../components/Map';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    mapContainer: { ...StyleSheet.absoluteFillObject },
    overlay: { flex: 1, justifyContent: 'space-between', paddingVertical: 50, paddingHorizontal: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between' },
    profileBadge: { backgroundColor: 'white', padding: 10, borderRadius: 30, flexDirection: 'row', alignItems: 'center', shadowOpacity: 0.2, elevation: 5 },
    profileName: { fontWeight: 'bold', marginRight: 10 },
    rating: { color: '#FFD700', fontWeight: 'bold' },
    earningsBadge: { backgroundColor: 'black', padding: 10, borderRadius: 30, paddingHorizontal: 20 },
    earningsText: { color: 'white', fontWeight: 'bold' },

    bottomPanel: { backgroundColor: 'white', padding: 20, borderRadius: 20, alignItems: 'center', shadowOpacity: 0.2, elevation: 10 },
    onlineStatus: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    onlineText: { fontSize: 16, color: theme.colors.primary, fontWeight: 'bold' },
    offlineText: { fontSize: 16, color: '#888', marginBottom: 20 },

    goButton: { width: '100%', height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
    goButtonText: { color: 'white', fontSize: 20, fontWeight: 'bold', letterSpacing: 1 },

    // Modal
    modalContainer: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end', padding: 20, paddingBottom: 40 },
    modalCard: { backgroundColor: 'white', padding: 25, borderRadius: 20 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
    routeRow: { marginBottom: 15 },
    routeLabel: { fontSize: 12, color: '#888', marginBottom: 2 },
    routeVal: { fontSize: 16, fontWeight: '500' },
    fareContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 15, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 15 },
    fareText: { fontSize: 32, fontWeight: 'bold', color: 'green' },
    timeText: { fontSize: 16, color: '#555' },
    modalActions: { flexDirection: 'row', gap: 15 },
    declineBtn: { flex: 1, padding: 15, borderRadius: 15, backgroundColor: '#eee', alignItems: 'center' },
    declineText: { fontWeight: 'bold', color: '#555' },
    acceptBtn: { flex: 1, padding: 15, borderRadius: 15, backgroundColor: theme.colors.primary, alignItems: 'center' },
    acceptText: { fontWeight: 'bold', color: 'white' }
});
