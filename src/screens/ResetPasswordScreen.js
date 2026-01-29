import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import api from '../services/api';
import Toast from 'react-native-toast-message';
import { theme } from '../constants/theme';

export default function ResetPasswordScreen({ navigation, route }) {
    const { email, resetToken } = route.params || {};
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleReset = async () => {
        if (!newPassword || !confirmPassword) {
            Toast.show({ type: 'error', text1: 'Missing Info', text2: 'Please fill all fields' });
            return;
        }

        if (newPassword !== confirmPassword) {
            Toast.show({ type: 'error', text1: 'Mismatch', text2: 'Passwords do not match' });
            return;
        }

        try {
            await api.post('/auth/reset-password', {
                email,
                resetToken, // Use token here
                newPassword,
                confirmPassword // Backend expects this too
            });
            Toast.show({ type: 'success', text1: 'Success', text2: 'Password reset! Please login.' });
            navigation.popToTop();
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Reset Failed',
                text2: error.response?.data?.message || 'Something went wrong',
            });
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Reset Password</Text>
                <Text style={styles.subtitle}>Enter the code sent to {email}</Text>
            </View>

            <View style={styles.form}>
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>New Password</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="••••••"
                        placeholderTextColor={theme.colors.darkGray}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Confirm New Password</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="••••••"
                        placeholderTextColor={theme.colors.darkGray}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                    />
                </View>

                <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
                    <Text style={styles.resetBtnText}>Reset Password</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: theme.spacing.l,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: theme.spacing.s,
    },
    subtitle: {
        fontSize: 14,
        color: theme.colors.darkGray,
        textAlign: 'center',
        paddingHorizontal: theme.spacing.m,
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        marginBottom: theme.spacing.l,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    input: {
        backgroundColor: theme.colors.inputBg,
        borderRadius: theme.borderRadius.s,
        padding: theme.spacing.m,
        borderWidth: 1,
        borderColor: theme.colors.inputBorder,
        fontSize: 16,
        color: theme.colors.text,
    },
    resetBtn: {
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.l,
        padding: theme.spacing.m,
        alignItems: 'center',
    },
    resetBtnText: {
        color: theme.colors.secondary,
        fontSize: 18,
        fontWeight: 'bold',
    },
});
