import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { theme } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import * as Notifications from 'expo-notifications';

export default function SettingsScreen({ navigation }) {
    const dispatch = useDispatch();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionHeader}>Preferences</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Dark Mode</Text>
                    <Switch value={true} trackColor={{ false: "#767577", true: theme.colors.primary }} />
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Notifications</Text>
                    <Switch value={true} trackColor={{ false: "#767577", true: theme.colors.primary }} />
                </View>
                <TouchableOpacity style={styles.row} onPress={async () => {
                    await Notifications.scheduleNotificationAsync({
                        content: {
                            title: "Test Notification 🔔",
                            body: "If you see this, notifications are working locally!",
                        },
                        trigger: null,
                    });
                }}>
                    <Text style={[styles.label, { color: theme.colors.primary }]}>Test Notification</Text>
                    <Ionicons name="notifications-outline" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionHeader}>Account</Text>
                <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ProfileTab')}>
                    <Text style={styles.menuText}>Edit Profile</Text>
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem}>
                    <Text style={styles.menuText}>Privacy Policy</Text>
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={() => dispatch(logout())}>
                    <Text style={[styles.menuText, { color: theme.colors.error }]}>Log Out</Text>
                </TouchableOpacity>
            </View>
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: 20
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 30
    },
    backButton: {
        padding: 8,
        marginRight: 10
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text
    },
    section: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 20,
        marginBottom: 20
    },
    sectionHeader: {
        color: theme.colors.primary,
        fontWeight: 'bold',
        marginBottom: 15,
        textTransform: 'uppercase',
        fontSize: 12
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    label: {
        color: theme.colors.text,
        fontSize: 16
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.inputBg
    },
    menuText: {
        color: theme.colors.text,
        fontSize: 16
    }
});
