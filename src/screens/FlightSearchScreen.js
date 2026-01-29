import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, StatusBar, Platform, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';
import { theme } from '../constants/theme';
import Toast from 'react-native-toast-message';
import api from '../services/api';
import socketService from '../services/socket';
import { schedulePushNotification, registerForPushNotificationsAsync } from '../services/notifications';
import AirportAutocomplete from '../components/AirportAutocomplete';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Professional "Green Luxury" Palette
const PRO_GREEN = '#0F9D58'; // Professional Green
const PRO_DARK_GREEN = '#0B8043';
const DARK_BG = '#121212';
const DARK_CARD = '#1E1E1E';
const WHITE = '#FFFFFF';
const SOFT_GRAY = '#B0B3B8';

export default function FlightSearchScreen({ navigation }) {
    const user = useSelector(state => state.auth.user);
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [date, setDate] = useState('2026-08-12');
    const [loading, setLoading] = useState(false);
    const [flights, setFlights] = useState([]);
    const [autoBookRide, setAutoBookRide] = useState(true);
    const [lastBookingId, setLastBookingId] = useState(null);

    // Setup Notifications
    useEffect(() => {
        registerForPushNotificationsAsync();
        const handleNotification = (data) => {
            if (data.type === 'ride_suggestion') {
                schedulePushNotification(data.title, data.message, { pickup: data.data.pickup });
                Toast.show({
                    type: 'success',
                    text1: data.title,
                    text2: data.message,
                    onPress: () => navigation.navigate('RideRequest', { pickup: data.data.pickup })
                });
            }
        };
        socketService.connect();
        socketService.on('notification', handleNotification);
        return () => socketService.off('notification', handleNotification);
    }, []);

    const handleSearch = async () => {
        if (!origin || !destination || !date) {
            Toast.show({ type: 'error', text1: 'Missing Requirements', text2: 'Please specify your journey details.' });
            return;
        }
        setLoading(true);
        try {
            // Real Amadeus API
            const originCode = origin.includes('(') ? origin.split('(')[1].replace(')', '') : origin;
            const destCode = destination.includes('(') ? destination.split('(')[1].replace(')', '') : destination;

            const response = await api.post('/flight/search', {
                origin: originCode,
                destination: destCode,
                date: date
            });

            if (response.data.results) {
                setFlights(response.data.results);
            } else {
                setFlights([]);
                Toast.show({ type: 'info', text1: 'No Flights Found', text2: 'Try different dates or route.' });
            }
        } catch (error) {
            console.error('Search Error:', error);
            Toast.show({ type: 'error', text1: 'Search Failed', text2: 'Could not fetch flights.' });
        } finally {
            setLoading(false);
        }
    };

    const processBooking = async (flight) => {
        try {
            setLastBookingId('booking_vip_123'); // Simulate booking ID
            Toast.show({
                type: 'success',
                text1: 'Booking Confirmed',
                text2: `Your flight to ${flight.arrival.airport} is confirmed.`
            });
        } catch (err) {
            Toast.show({ type: 'error', text1: 'Reservation Error', text2: err.message });
        }
    };

    const simulateLanding = async () => {
        if (!lastBookingId) return;
        try {
            setLoading(true);
            await api.post(`/flight/land/${lastBookingId}`);
            Toast.show({ type: 'success', text1: 'Welcome', text2: 'Your chauffeur is arriving.' });
        } catch (err) {
            // Error handling
        } finally {
            setLoading(false);
        }
    };

    const handleBook = (flight) => {
        if (!user) {
            Toast.show({ type: 'error', text1: 'Authentication Required', text2: 'Please log in to book.' });
            return;
        }
        navigation.navigate('Payment', {
            flight,
            onPaymentSuccess: () => processBooking(flight)
        });
    };

    const renderFlightItem = ({ item }) => (
        <TouchableOpacity style={styles.flightCard} activeOpacity={0.9} onPress={() => handleBook(item)}>
            <LinearGradient
                colors={[DARK_CARD, '#252525']}
                style={styles.flightCardGradient}
            >
                <View style={styles.flightHeader}>
                    <View style={styles.airlineRow}>
                        <Image source={{ uri: item.logo || 'https://img.icons8.com/color/48/airplane-take-off.png' }} style={styles.airlineLogo} />
                        <View>
                            <Text style={styles.airlineName}>{item.airline}</Text>
                            <Text style={styles.flightClass}>{item.class || 'Business'}</Text>
                        </View>
                    </View>
                    <Text style={styles.price}>{item.price}</Text>
                </View>

                <View style={styles.routeContainer}>
                    <View>
                        <Text style={styles.airportCode}>{item.departure.airport}</Text>
                        <Text style={styles.cityText}>Depart</Text>
                    </View>
                    <View style={styles.flightPath}>
                        <Text style={styles.duration}>{item.duration}</Text>
                        <Ionicons name="airplane" size={20} color={PRO_GREEN} style={styles.planeIcon} />
                        <View style={styles.dottedLine} />
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.airportCode}>{item.arrival.airport}</Text>
                        <Text style={styles.cityText}>Arrive</Text>
                    </View>
                </View>

                <View style={styles.flightFooter}>
                    <Text style={styles.flightTime}>{item.departure.time} - {item.arrival.time}</Text>
                    <View style={styles.bookButtonSmall}>
                        <Text style={styles.bookButtonText}>Select</Text>
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header Background */}
            <View style={styles.headerBackground}>
                <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2000&auto=format&fit=crop' }}
                    style={StyleSheet.absoluteFillObject}
                    blurRadius={5}
                />
                <LinearGradient
                    colors={['rgba(0,0,0,0.6)', DARK_BG]}
                    style={StyleSheet.absoluteFillObject}
                />
            </View>

            <View style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={WHITE} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>PREMIUM TRAVEL</Text>
                    <TouchableOpacity style={styles.conciergeBtn}>
                        <Ionicons name="notifications-outline" size={24} color={PRO_GREEN} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Search Form */}
                    <View style={styles.formContainer}>
                        <View style={styles.inputGroup}>
                            <Ionicons name="airplane-outline" size={20} color={PRO_GREEN} style={styles.inputIcon} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>DEPARTURE</Text>
                                <AirportAutocomplete
                                    placeholder="Select Origin"
                                    initialValue={origin}
                                    onSelect={(item) => setOrigin(`${item.city} (${item.iata})`)}
                                    color={WHITE}
                                    zIndex={20}
                                />
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.inputGroup}>
                            <Ionicons name="location-outline" size={20} color={PRO_GREEN} style={styles.inputIcon} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>DESTINATION</Text>
                                <AirportAutocomplete
                                    placeholder="Select Destination"
                                    initialValue={destination}
                                    onSelect={(item) => setDestination(`${item.city} (${item.iata})`)}
                                    color={WHITE}
                                    zIndex={19}
                                />
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Ionicons name="calendar-outline" size={20} color={PRO_GREEN} style={styles.inputIcon} />
                                <View>
                                    <Text style={styles.label}>DATE</Text>
                                    <TextInput
                                        value={date}
                                        onChangeText={setDate}
                                        style={styles.dateInput}
                                        placeholderTextColor="#666"
                                    />
                                </View>
                            </View>
                            <View style={[styles.inputGroup, { flex: 1, borderLeftWidth: 1, borderLeftColor: '#333', paddingLeft: 15 }]}>
                                <Ionicons name="person-outline" size={20} color={PRO_GREEN} style={styles.inputIcon} />
                                <View>
                                    <Text style={styles.label}>PASSENGERS</Text>
                                    <Text style={styles.valueText}>1 Adult</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Options */}
                    <View style={styles.vipOptions}>
                        <Text style={styles.vipLabel}>TRAVEL OPTIONS</Text>
                        <TouchableOpacity
                            style={styles.optionRow}
                            onPress={() => setAutoBookRide(!autoBookRide)}
                            activeOpacity={0.8}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={[styles.checkBox, autoBookRide && styles.checkBoxActive]}>
                                    {autoBookRide && <Ionicons name="checkmark" size={14} color={WHITE} />}
                                </View>
                                <Text style={styles.optionText}>Pre-book Airport Transfer</Text>
                            </View>
                            <Ionicons name="car-sport-outline" size={20} color={PRO_GREEN} />
                        </TouchableOpacity>
                    </View>

                    {/* Search Button */}
                    <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color={WHITE} />
                        ) : (
                            <Text style={styles.searchBtnText}>SEARCH FLIGHTS</Text>
                        )}
                    </TouchableOpacity>

                    {/* Results */}
                    {flights.length > 0 && (
                        <View style={styles.resultsSection}>
                            <Text style={styles.sectionHeader}>AVAILABLE FLIGHTS</Text>
                            {flights.map(item => (
                                <View key={item.id}>
                                    {renderFlightItem({ item })}
                                </View>
                            ))}
                        </View>
                    )}

                    {lastBookingId && (
                        <TouchableOpacity style={styles.simulateCard} onPress={simulateLanding}>
                            <LinearGradient colors={[PRO_GREEN, PRO_DARK_GREEN]} style={styles.simulateGradient}>
                                <Text style={styles.simulateText}>SIMULATE LANDING</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: DARK_BG,
    },
    headerBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 300,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    headerTitle: {
        color: WHITE,
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
    },
    scrollContent: {
        padding: 20,
    },
    formContainer: {
        backgroundColor: DARK_CARD,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#333',
        marginBottom: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    inputIcon: {
        marginRight: 15,
    },
    label: {
        color: PRO_GREEN,
        fontSize: 10,
        letterSpacing: 1,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    valueText: {
        color: WHITE,
        fontSize: 16,
        fontWeight: '500',
    },
    dateInput: {
        color: WHITE,
        fontSize: 16,
        fontWeight: '500',
        padding: 0,
    },
    divider: {
        height: 1,
        backgroundColor: '#333',
        marginVertical: 5,
    },
    row: {
        flexDirection: 'row',
    },
    vipOptions: {
        marginBottom: 25,
    },
    vipLabel: {
        color: SOFT_GRAY,
        fontSize: 12,
        marginBottom: 10,
        letterSpacing: 1,
    },
    optionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(15, 157, 88, 0.1)',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(15, 157, 88, 0.3)',
    },
    checkBox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: PRO_GREEN,
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    checkBoxActive: {
        backgroundColor: PRO_GREEN,
    },
    optionText: {
        color: WHITE,
        fontSize: 14,
    },
    searchBtn: {
        backgroundColor: PRO_GREEN,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: PRO_GREEN,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
        marginBottom: 30,
    },
    searchBtnText: {
        color: WHITE,
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    sectionHeader: {
        color: WHITE,
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        letterSpacing: 1,
    },
    flightCard: {
        marginBottom: 20,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 5,
    },
    flightCardGradient: {
        padding: 20,
    },
    flightHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    airlineRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    airlineLogo: {
        width: 40,
        height: 40,
        marginRight: 12,
        resizeMode: 'contain',
    },
    airlineName: {
        color: WHITE,
        fontSize: 16,
        fontWeight: 'bold',
    },
    flightClass: {
        color: PRO_GREEN,
        fontSize: 12,
        fontWeight: '600',
    },
    price: {
        color: WHITE,
        fontSize: 18,
        fontWeight: 'bold',
    },
    routeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    airportCode: {
        color: WHITE,
        fontSize: 22,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    cityText: {
        color: 'gray',
        fontSize: 12,
        marginTop: 2,
    },
    flightPath: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    duration: {
        color: PRO_GREEN,
        fontSize: 12,
        marginBottom: 5,
        fontWeight: '600',
    },
    planeIcon: {
        marginBottom: -10,
        zIndex: 1,
        backgroundColor: 'transparent'
    },
    dottedLine: {
        width: '100%',
        height: 1,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        borderStyle: 'dashed',
    },
    flightFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        paddingTop: 15,
    },
    flightTime: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
    },
    bookButtonSmall: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    bookButtonText: {
        color: WHITE,
        fontSize: 12,
        fontWeight: 'bold',
    },
    simulateCard: {
        marginTop: 10,
        borderRadius: 15,
        overflow: 'hidden',
    },
    simulateGradient: {
        padding: 15,
        alignItems: 'center',
    },
    simulateText: {
        color: WHITE,
        fontWeight: 'bold',
        letterSpacing: 1,
    }
});
