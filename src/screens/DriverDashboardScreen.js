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

    const toggleStatus = async (value) => {
        setLoading(true);
        try {
            const response = await api.post('/driver/status', { isOnline: value });
            setIsOnline(response.data.isOnline);
        } catch (error) {
            console.error(error);
            alert('Failed to update status');
            setIsOnline(!value); // Revert
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.greeting}>Hello, {user?.name}</Text>
                <View style={styles.statusContainer}>
                    <Text style={[styles.statusText, { color: isOnline ? theme.colors.success : theme.colors.darkGray }]}>
                        {isOnline ? 'ONLINE' : 'OFFLINE'}
                    </Text>
                    <Switch
                        value={isOnline}
                        onValueChange={toggleStatus}
                        trackColor={{ false: '#767577', true: theme.colors.success }}
                        thumbColor={'#f4f3f4'}
                        disabled={loading}
                    />
                </View>
            </View>

            {isOnline ? (
                <View style={styles.content}>
                    <View style={styles.radarContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={styles.radarText}>Searching for rides...</Text>
                    </View>
                </View>
            ) : (
                <View style={styles.content}>
                    <Text style={styles.offlineText}>Go Online to start receiving trips.</Text>
                </View>
            )}

            <View style={styles.earningsCard}>
                <Text style={styles.earningsLabel}>Today's Earnings</Text>
                <Text style={styles.earningsValue}>$0.00</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: 20,
        paddingTop: 50
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30
    },
    greeting: {
        fontSize: 22,
        fontWeight: 'bold',
        color: theme.colors.text
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    statusText: {
        marginRight: 10,
        fontWeight: 'bold'
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    radarContainer: {
        alignItems: 'center'
    },
    radarText: {
        marginTop: 15,
        color: theme.colors.textSecondary,
        fontSize: 16
    },
    offlineText: {
        color: theme.colors.darkGray,
        fontSize: 16
    },
    earningsCard: {
        backgroundColor: '#222',
        padding: 20,
        borderRadius: 15,
        marginBottom: 20,
        alignItems: 'center'
    },
    earningsLabel: {
        color: '#888',
        fontSize: 14,
        marginBottom: 5
    },
    earningsValue: {
        color: theme.colors.success,
        fontSize: 32,
        fontWeight: 'bold'
    }
});
