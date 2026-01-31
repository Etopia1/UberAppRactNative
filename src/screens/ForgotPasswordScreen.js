import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform } from 'react-native';
import api from '../services/api';
import Toast from 'react-native-toast-message';
import { theme } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient'; // Ensure you have this installed or standard view

export default function ForgotPasswordScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendCode = async () => {
        if (!email) {
            Toast.show({ type: 'error', text1: 'Input Required', text2: 'Please enter your email or Driver ID' });
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            Toast.show({ type: 'success', text1: 'Code Sent', text2: 'Check your email for OTP' });
            navigation.navigate('VerifyResetOTP', { email });
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Failed',
                text2: error.response?.data?.message || 'Something went wrong',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Decorative Background Elements */}
            <View style={styles.circle1} />
            <View style={styles.circle2} />

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.content}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backArrow}>←</Text>
                    </TouchableOpacity>
                    <Image
                        source={{ uri: 'https://img.icons8.com/3d-fluency/94/lock-2.png' }}
                        style={styles.logo}
                    />
                    <Text style={styles.title}>Forgot Password?</Text>
                    <Text style={styles.subtitle}>Don't worry! It happens. Please enter the email or Driver ID associated with your account.</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputWrapper}>
                        <Text style={styles.label}>Email or Driver ID</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your email or Driver ID"
                            placeholderTextColor="#999"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="default"
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.sendBtn, loading && styles.btnDisabled]}
                        onPress={handleSendCode}
                        disabled={loading}
                    >
                        <Text style={styles.sendBtnText}>{loading ? 'Sending...' : 'Send Code'}</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    circle1: {
        position: 'absolute',
        top: -50,
        left: -50,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(0, 200, 83, 0.1)', // Primary transparent
    },
    circle2: {
        position: 'absolute',
        bottom: -50,
        right: -50,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(0, 200, 83, 0.05)',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 30,
    },
    header: {
        alignItems: 'flex-start',
        marginBottom: 40,
    },
    backButton: {
        marginBottom: 20,
        padding: 5,
    },
    backArrow: {
        fontSize: 28,
        color: '#333',
    },
    logo: {
        width: 80,
        height: 80,
        marginBottom: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        lineHeight: 24,
    },
    form: {
        width: '100%',
    },
    inputWrapper: {
        marginBottom: 30,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#333',
        marginBottom: 10,
        marginLeft: 5,
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        fontSize: 16,
        color: '#333',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    sendBtn: {
        backgroundColor: theme.colors.primary,
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
    },
    btnDisabled: {
        backgroundColor: '#ccc',
        shadowOpacity: 0,
    },
    sendBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
