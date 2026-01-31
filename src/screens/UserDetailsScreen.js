import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, Alert, Linking, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';
import api from '../services/api';

const { width } = Dimensions.get('window');

export default function UserDetailsScreen({ route, navigation }) {
    const { user: initialUser } = route.params;
    const [user, setUser] = useState(initialUser);

    const toggleBanUser = async () => {
        const action = user.isBanned ? 'unban-user' : 'ban-user';
        const actionText = user.isBanned ? 'Unban' : 'Ban';

        Alert.alert(
            `Confirm ${actionText}`,
            `Are you sure you want to ${actionText.toLowerCase()} ${user.name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: actionText,
                    style: user.isBanned ? 'default' : 'destructive',
                    onPress: async () => {
                        try {
                            await api.post(`/admin/${action}`, { userId: user._id });
                            setUser({ ...user, isBanned: !user.isBanned });
                            Alert.alert('Success', `User ${actionText}ned`);
                        } catch (error) {
                            Alert.alert('Error', `Failed to ${actionText.toLowerCase()} user`);
                        }
                    }
                }
            ]
        );
    };

    const callUser = () => {
        if (user.phone) Linking.openURL(`tel:${user.phone}`);
    };

    const emailUser = () => {
        if (user.email) Linking.openURL(`mailto:${user.email}`);
    };

    const StatBox = ({ label, value, icon }) => (
        <View style={styles.statBox}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );

    return (
        <ScrollView style={styles.container} bounces={false}>
            {/* Header / Cover */}
            <View style={styles.headerContainer}>
                <Image
                    source={{ uri: user.coverPhoto || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80' }}
                    style={styles.coverPhoto}
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.headerGradient}
                />

                <View style={styles.profileHeader}>
                    <Image source={{ uri: user.avatar || 'https://i.pravatar.cc/300' }} style={styles.avatar} />
                    <View style={styles.headerText}>
                        <Text style={styles.name}>{user.name}</Text>
                        <Text style={styles.role}>{user.role.toUpperCase()}</Text>
                    </View>
                </View>
            </View>

            {/* Status Bar */}
            <View style={styles.statusBar}>
                <View style={[styles.statusBadge, { device: user.isOnline }]}>
                    <Text style={{ color: user.isOnline ? theme.colors.success : '#999', fontWeight: 'bold' }}>
                        {user.isOnline ? '● Online' : '○ Offline'}
                    </Text>
                </View>

                {user.isBanned && (
                    <View style={styles.bannedBadge}>
                        <Text style={styles.bannedText}>🚫 BANNED</Text>
                    </View>
                )}

                {user.role === 'driver' && (
                    <View style={styles.verifiedBadge}>
                        <Text style={{ color: user.isDriverVerified ? theme.colors.primary : theme.colors.warning, fontWeight: 'bold' }}>
                            {user.isDriverVerified ? '✓ Verified Driver' : '⏳ Pending Verification'}
                        </Text>
                    </View>
                )}
            </View>

            {/* Contact Actions */}
            <View style={styles.actionRow}>
                <TouchableOpacity style={styles.contactBtn} onPress={callUser}>
                    <Text style={styles.contactBtnText}>📞 Call</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.contactBtn} onPress={emailUser}>
                    <Text style={styles.contactBtnText}>✉️ Email</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.contactBtn, { backgroundColor: user.isBanned ? '#4CAF50' : '#F44336' }]}
                    onPress={toggleBanUser}
                >
                    <Text style={[styles.contactBtnText, { color: '#fff' }]}>
                        {user.isBanned ? 'Unlock Account' : 'Ban Account'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Info Cards */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>About</Text>
                <Text style={styles.bio}>{user.bio || "No bio available."}</Text>

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Email:</Text>
                    <Text style={styles.infoValue}>{user.email}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Phone:</Text>
                    <Text style={styles.infoValue}>{user.phone}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Joined:</Text>
                    <Text style={styles.infoValue}>{new Date(user.createdAt).toLocaleDateString()}</Text>
                </View>
            </View>

            {/* Location Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    {user.isOnline ? "📍 Live Location" : "🛑 Last Known Location"}
                </Text>
                <View style={styles.locationBox}>
                    <Text style={styles.locationText}>{user.location || "Location not available"}</Text>
                    {!user.isOnline && (
                        <Text style={styles.lastSeenText}>Last seen: {user.lastSeen ? new Date(user.lastSeen).toLocaleString() : 'Unknown'}</Text>
                    )}
                    {user.location && (
                        <TouchableOpacity
                            style={styles.mapBtn}
                            onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(user.location)}`)}
                        >
                            <Text style={styles.mapBtnText}>🗺️ View on Map</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
            {user.role === 'driver' && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Driver Details</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Driver ID:</Text>
                        <Text style={styles.infoValue}>{user.driverId}</Text>
                    </View>
                </View>
            )}

            {/* Stats Grid */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Statistics</Text>
                <View style={styles.statsGrid}>
                    <StatBox label="Rides" value={user.ridesCount || 0} />
                    <StatBox label="Spending" value={`$${user.date || 0}`} />
                    {/* Placeholder for spending */}
                    <StatBox label="Posts" value={user.postsCount || 0} />
                    <StatBox label="Followers" value={user.followersCount || 0} />
                </View>
            </View>

            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Text style={styles.backButtonText}>← Back to Dashboard</Text>
            </TouchableOpacity>

            <View style={{ height: 50 }} />
        </ScrollView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    headerContainer: {
        height: 250,
        position: 'relative',
    },
    coverPhoto: {
        width: '100%',
        height: '100%',
    },
    headerGradient: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: 150,
    },
    profileHeader: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: '#fff',
    },
    headerText: {
        marginLeft: 15,
    },
    name: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    role: {
        color: theme.colors.primary,
        fontWeight: 'bold',
        fontSize: 14,
        marginTop: 2,
    },
    statusBar: {
        flexDirection: 'row',
        padding: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        alignItems: 'center',
        flexWrap: 'wrap'
    },
    statusBadge: {
        marginRight: 15
    },
    bannedBadge: {
        backgroundColor: '#FFEBEE',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: 15
    },
    bannedText: {
        color: '#D32F2F',
        fontWeight: 'bold',
        fontSize: 12
    },
    verifiedBadge: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4
    },
    actionRow: {
        flexDirection: 'row',
        padding: 15,
        justifyContent: 'space-around',
    },
    contactBtn: {
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ddd',
        minWidth: 100,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1
    },
    contactBtnText: {
        fontWeight: '600',
        color: '#333'
    },
    section: {
        backgroundColor: '#fff',
        marginTop: 10,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    bio: {
        color: '#666',
        lineHeight: 22,
        marginBottom: 20,
        fontStyle: 'italic'
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'center'
    },
    infoLabel: {
        width: 80,
        color: '#888',
        fontWeight: '600',
    },
    infoValue: {
        color: '#333',
        flex: 1,
        fontWeight: '500'
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    statBox: {
        width: '48%',
        backgroundColor: '#F5F7FA',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.primary,
        marginBottom: 5,
    },
    statLabel: {
        color: '#666',
        fontSize: 12,
    },
    backButton: {
        margin: 20,
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 10,
        alignItems: 'center'
    },
    backButtonText: {
        color: '#666',
        fontWeight: '600'
    },
    locationBox: {
        backgroundColor: '#F5F7FA',
        padding: 15,
        borderRadius: 10,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.primary
    },
    locationText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
        marginBottom: 5
    },
    lastSeenText: {
        fontSize: 12,
        color: '#888',
        marginBottom: 10,
        fontStyle: 'italic'
    },
    mapBtn: {
        marginTop: 10,
        backgroundColor: '#E3F2FD',
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8
    },
    mapBtnText: {
        color: theme.colors.primary,
        fontWeight: 'bold'
    }
});
