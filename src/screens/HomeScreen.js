import React, { useRef, useState, useEffect } from 'react';
import { getAvatarSource } from '../utils/avatar';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, StatusBar, SafeAreaView, Platform, Animated, PanResponder, Modal } from 'react-native';
import Map from '../components/Map';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { theme } from '../constants/theme';
import SocketService from '../services/socket';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const SHEET_MAX_HEIGHT = height * 0.85;
const SHEET_MIN_HEIGHT = 160;

export default function HomeScreen({ navigation }) {
    const dispatch = useDispatch();
    const user = useSelector(state => state.auth.user);

    // Draggable Sheet State
    const panY = useRef(new Animated.Value(0)).current;

    // Menu Modal State
    const [isMenuVisible, setIsMenuVisible] = useState(false);

    useEffect(() => {
        if (user?._id || user?.id) {
            SocketService.connect(user._id || user.id);
        }
    }, []);

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dy) > 10;
            },
            onPanResponderMove: (_, gestureState) => {
                // Allow dragging up (negative) and down (positive)
                // We clamp it slightly so it doesn't fly off screen
                if (gestureState.dy > 180) return; // Limit drag so icons stay visible
                panY.setValue(gestureState.dy);
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy < -50) {
                    // Dragged UP -> Expand
                    Animated.spring(panY, {
                        toValue: -200, // Move up
                        useNativeDriver: false,
                        bounciness: 8
                    }).start();
                } else if (gestureState.dy > 80) {
                    // Dragged DOWN -> Minimize (But keep content visible)
                    Animated.spring(panY, {
                        toValue: 150, // Peeking mode
                        useNativeDriver: false,
                        bounciness: 8
                    }).start();
                } else {
                    // Small drag -> Snap to Default (Middle)
                    Animated.spring(panY, {
                        toValue: 0,
                        useNativeDriver: false,
                        bounciness: 8
                    }).start();
                }
            }
        })
    ).current;

    const handleLogout = () => {
        SocketService.disconnect();
        dispatch(logout());
    };

    const MenuModal = () => (
        <Modal
            visible={isMenuVisible}
            animationType="fade"
            transparent={true}
            onRequestClose={() => setIsMenuVisible(false)}
        >
            <TouchableOpacity style={styles.modalOverlay} onPress={() => setIsMenuVisible(false)} activeOpacity={1}>
                <View style={styles.menuContainer}>
                    <View style={styles.menuHeader}>
                        <Image
                            source={getAvatarSource(user)}
                            style={styles.menuAvatar}
                        />
                        <View>
                            <Text style={styles.menuName}>{user?.name}</Text>
                            <Text style={styles.menuEmail}>{user?.email}</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuVisible(false); navigation.navigate('Wallet'); }}>
                        <Ionicons name="wallet-outline" size={24} color={theme.colors.text} />
                        <Text style={styles.menuText}>Wallet</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuVisible(false); navigation.navigate('Bookings'); }}>
                        <Ionicons name="receipt-outline" size={24} color={theme.colors.text} />
                        <Text style={styles.menuText}>Trips</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuVisible(false); navigation.navigate('Settings'); }}>
                        <Ionicons name="settings-outline" size={24} color={theme.colors.text} />
                        <Text style={styles.menuText}>Settings</Text>
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuVisible(false); dispatch(logout()); }}>
                        <Ionicons name="log-out-outline" size={24} color={theme.colors.error} />
                        <Text style={[styles.menuText, { color: theme.colors.error }]}>Log Out</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Map Background */}
            <Map style={styles.map} />

            {/* Top Components */}
            <SafeAreaView style={[styles.topContainer, { pointerEvents: 'box-none' }]}>
                {/* Menu Button */}
                <TouchableOpacity style={styles.menuButton} onPress={() => setIsMenuVisible(true)}>
                    <Ionicons name="menu" size={30} color={theme.colors.text} />
                </TouchableOpacity>

                {/* Profile Button */}
                <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('ProfileTab')}>
                    <Image
                        source={getAvatarSource(user)}
                        style={styles.profileImage}
                    />
                </TouchableOpacity>
            </SafeAreaView>

            {/* Draggable Bottom Sheet */}
            <Animated.View
                style={[
                    styles.bottomSheet,
                    { transform: [{ translateY: panY }] }
                ]}
                {...panResponder.panHandlers}
            >
                {/* Drag Handle */}
                <View style={styles.dragHandleContainer}>
                    <View style={styles.dragHandle} />
                </View>

                <Text style={styles.sheetTitle}>Good Morning, {user?.name?.split(' ')[0]}</Text>

                {/* Gemini AI Input Button */}
                <TouchableOpacity
                    style={styles.geminiButton}
                    onPress={() => navigation.navigate('Gemini')}
                    activeOpacity={0.8}
                >
                    <Ionicons name="sparkles" size={20} color={theme.colors.primary} style={{ marginRight: 10 }} />
                    <Text style={styles.geminiText}>Ask Gemini...</Text>
                </TouchableOpacity>

                <View style={styles.cardRow}>
                    {/* Ride Card */}
                    <TouchableOpacity
                        style={[styles.card, styles.rideCard]}
                        onPress={() => navigation.navigate('RideRequest')}
                        activeOpacity={0.9}
                    >
                        <View>
                            <Image source={{ uri: 'https://img.icons8.com/3d-fluency/94/car.png' }} style={styles.cardIcon} />
                            <Text style={styles.cardTitle}>Get Ride</Text>
                        </View>
                        <View style={styles.arrowContainer}>
                            <Ionicons name="arrow-forward" size={20} color={theme.colors.text} />
                        </View>
                    </TouchableOpacity>

                    {/* Flight Card */}
                    <TouchableOpacity
                        style={[styles.card, styles.flightCard]}
                        onPress={() => navigation.navigate('FlightSearch')}
                        activeOpacity={0.9}
                    >
                        <View>
                            <Image source={{ uri: 'https://img.icons8.com/3d-fluency/94/airplane-take-off.png' }} style={styles.cardIcon} />
                            <Text style={styles.cardTitle}>Book Flight</Text>
                        </View>
                        <View style={styles.arrowContainer}>
                            <Ionicons name="arrow-forward" size={20} color={theme.colors.text} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Navigation Card (Full Width) */}
                <TouchableOpacity
                    style={[styles.card, styles.navCard, { width: '100%', marginBottom: 25 }]}
                    onPress={() => navigation.navigate('Navigation')}
                    activeOpacity={0.9}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Image source={{ uri: 'https://img.icons8.com/3d-fluency/94/map-marker.png' }} style={[styles.cardIcon, { marginBottom: 0, marginRight: 15 }]} />
                        <Text style={styles.cardTitle}>View Routes & Traffic</Text>
                    </View>
                    <View style={styles.arrowContainer}>
                        <Ionicons name="compass" size={20} color={theme.colors.text} />
                    </View>
                </TouchableOpacity>

                {/* Recent Locations Removed */}
            </Animated.View>

            <MenuModal />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    map: {
        flex: 1,
    },
    topContainer: {
        position: 'absolute',
        top: Platform.OS === 'android' ? 40 : 50,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10
    },
    menuButton: {
        backgroundColor: theme.colors.surface,
        padding: 10,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5
    },
    profileButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: theme.colors.primary,
        overflow: 'hidden'
    },
    profileImage: {
        width: '100%',
        height: '100%'
    },
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: theme.colors.surface,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 25,
        paddingBottom: 100, // Safe space for tabs
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 20,
        height: 650, // Taller to hold content
    },
    dragHandleContainer: {
        alignItems: 'center',
        paddingBottom: 20
    },
    dragHandle: {
        width: 40,
        height: 5,
        backgroundColor: '#ddd',
        borderRadius: 3
    },
    sheetTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 15
    },
    geminiButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3E5F5',
        padding: 15,
        borderRadius: 15,
        marginBottom: 20
    },
    geminiText: {
        fontSize: 16,
        color: theme.colors.primary,
        fontWeight: '600'
    },
    cardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 25
    },
    card: {
        width: (width - 65) / 2,
        height: 120, // Reduced from 140
        borderRadius: 20,
        padding: 15,
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5
    },
    rideCard: {
        backgroundColor: '#E8F5E9',
    },
    flightCard: {
        backgroundColor: '#E3F2FD',
    },
    navCard: {
        backgroundColor: '#FFF3E0',
    },
    aiCard: {
        backgroundColor: '#F3E5F5',
    },
    cardIcon: {
        width: 32, // Reduced from 40
        height: 32, // Reduced from 40
        marginBottom: 10
    },
    cardTitle: {
        fontSize: 14, // Reduced from 16
        fontWeight: 'bold',
        color: theme.colors.text
    },
    arrowContainer: {
        alignSelf: 'flex-end',
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: 15,
        padding: 5
    },
    recentSection: {
        marginTop: 10
    },
    sectionHeader: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        marginBottom: 15
    },
    recentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.inputBg
    },
    recentIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.inputBg,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15
    },
    recentTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.colors.text
    },
    recentSub: {
        fontSize: 12,
        color: theme.colors.textSecondary
    },
    // Menu Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-start'
    },
    menuContainer: {
        backgroundColor: theme.colors.surface,
        width: '75%',
        height: '100%',
        padding: 25,
        paddingTop: 60
    },
    menuHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 40
    },
    menuAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15
    },
    menuName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text
    },
    menuEmail: {
        fontSize: 12,
        color: theme.colors.textSecondary
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15
    },
    menuText: {
        fontSize: 16,
        marginLeft: 15,
        color: theme.colors.text,
        fontWeight: '500'
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.inputBg,
        marginVertical: 20
    }
});
