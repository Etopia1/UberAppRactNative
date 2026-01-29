import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { theme } from '../constants/theme';
import { useSelector } from 'react-redux';
import api from '../services/api';

export default function BookingsScreen() {
    const user = useSelector(state => state.auth.user);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchBookings = async () => {
        try {
            const userId = user.id || user._id; // Handle both id formats
            const response = await api.get(`/bookings/${userId}`);
            setBookings(response.data.bookings || []);
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchBookings();
    };

    const renderBookingItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Image source={{ uri: 'https://img.icons8.com/color/48/airplane-take-off.png' }} style={styles.logo} />
                    <View>
                        <Text style={styles.airline}>{item.airline}</Text>
                        <Text style={styles.flightNum}>{item.flightNumber}</Text>
                    </View>
                </View>
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                </View>
            </View>

            <View style={styles.routeRow}>
                <View>
                    <Text style={styles.code}>{item.origin}</Text>
                    {/* <Text style={styles.time}>{item.departureTime}</Text> */}
                </View>
                <Text style={styles.arrow}>→</Text>
                <View>
                    <Text style={styles.code}>{item.destination}</Text>
                    {/* <Text style={styles.time}>Arrives</Text> */}
                </View>
            </View>

            <View style={styles.footer}>
                <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                <Text style={styles.price}>${item.price || item.totalPrice}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>My Trips</Text>
            {loading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={bookings}
                    keyExtractor={item => item._id}
                    renderItem={renderBookingItem}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={<Text style={styles.empty}>No bookings yet.</Text>}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F2F4F8', padding: 20 },
    title: {
        fontSize: 32,
        fontWeight: '800',
        marginBottom: 25,
        marginTop: 40,
        color: '#1a1a1a',
        letterSpacing: -1
    },
    list: { paddingBottom: 40 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 15,
        shadowOffset: { width: 0, height: 6 },
        elevation: 5,
        overflow: 'hidden'
    },
    // Ticket Header (Color bar or distinct section)
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    logo: { width: 45, height: 45, marginRight: 15, resizeMode: 'contain' },
    airline: { fontWeight: '700', fontSize: 18, color: '#1a1a1a', marginBottom: 2 },
    flightNum: { color: '#8e8e93', fontSize: 13, fontWeight: '500' },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#E8F5E9'
    },
    statusText: {
        color: '#2E7D32',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.5
    },
    // Route Section
    routeRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 25,
        paddingHorizontal: 10
    },
    code: { fontSize: 32, fontWeight: '900', color: '#1a1a1a', letterSpacing: 1 },
    arrow: { fontSize: 28, color: '#e0e0e0', marginTop: -4 },
    // Ticket Footer
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F9FAFC', // Slightly different shade
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0'
    },
    date: { color: '#666', fontWeight: '500', fontSize: 14 },
    price: {
        fontWeight: '900',
        color: theme.colors.primary,
        fontSize: 20
    },
    empty: { textAlign: 'center', marginTop: 80, color: '#999', fontSize: 16 }
});
