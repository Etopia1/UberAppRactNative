import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import Toast from 'react-native-toast-message';

const VerifyResetOTPScreen = ({ route, navigation }) => {
    const { email } = route.params;
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [timer, setTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    setCanResend(true);
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [canResend]);

    const handleVerifyOTP = async () => {
        if (!otp) {
            Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please enter the OTP' });
            return;
        }

        if (otp.length !== 4) {
            Toast.show({ type: 'error', text1: 'Validation Error', text2: 'OTP must be 4 digits' });
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/auth/verify-reset-otp', {
                email,
                otp
            });

            if (response.data.verified) {
                Toast.show({ type: 'success', text1: 'OTP Verified!', text2: 'You can now reset your password' });
                navigation.navigate('ResetPassword', {
                    email,
                    resetToken: response.data.resetToken // Pass token forward
                });
            }
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Verification Failed',
                text2: error.response?.data?.message || 'Invalid OTP. Please try again.'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setResending(true);
        try {
            await api.post('/auth/resend-otp', {
                email,
                type: 'forgot-password'
            });

            Toast.show({ type: 'success', text1: 'OTP Resent!', text2: 'Check your email' });
            setTimer(60);
            setCanResend(false);
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Resend Failed',
                text2: error.response?.data?.message || 'Failed to resend OTP'
            });
        } finally {
            setResending(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <Ionicons name="mail-outline" size={80} color="#10b981" style={styles.icon} />

                <Text style={styles.title}>Enter OTP</Text>
                <Text style={styles.subtitle}>
                    We've sent a 4-digit code to{'\n'}
                    <Text style={{ fontWeight: '600', color: '#000' }}>{email}</Text>
                </Text>

                <View style={styles.otpContainer}>
                    <TextInput
                        style={styles.otpInput}
                        value={otp}
                        onChangeText={setOtp}
                        keyboardType="number-pad"
                        maxLength={4}
                        placeholder="Enter 4-digit OTP"
                        placeholderTextColor="#999"
                        editable={!loading}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleVerifyOTP}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Verify OTP</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.resendContainer}>
                    {canResend ? (
                        <TouchableOpacity onPress={handleResendOTP} disabled={resending}>
                            <Text style={styles.resendText}>
                                {resending ? 'Resending...' : 'Resend OTP'}
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <Text style={styles.timerText}>
                            Resend OTP in {timer}s
                        </Text>
                    )}
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        paddingTop: 50,
        paddingHorizontal: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: 30,
        paddingTop: 20,
        alignItems: 'center',
    },
    icon: {
        marginBottom: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 20,
    },
    otpContainer: {
        width: '100%',
        marginBottom: 30,
    },
    otpInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        paddingHorizontal: 20,
        paddingVertical: 15,
        fontSize: 24,
        textAlign: 'center',
        letterSpacing: 10,
        fontWeight: '600',
        backgroundColor: '#f9f9f9',
    },
    button: {
        backgroundColor: '#10b981',
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        width: '100%',
        marginBottom: 20,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    resendContainer: {
        marginTop: 10,
        alignItems: 'center',
    },
    resendText: {
        color: '#10b981',
        fontSize: 14,
        fontWeight: '600',
    },
    timerText: {
        color: '#666',
        fontSize: 14,
    },
});

export default VerifyResetOTPScreen;
