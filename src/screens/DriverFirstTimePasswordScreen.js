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
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import Toast from 'react-native-toast-message';

const API_URL = 'https://uberappbackend.onrender.com/api';

const DriverFirstTimePasswordScreen = ({ route, navigation }) => {
    const { email } = route.params;
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1 = OTP, 2 = Password
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleVerifyOTP = async () => {
        if (!otp || otp.length !== 4) {
            Alert.alert('Error', 'Please enter the 4-digit OTP');
            return;
        }

        // Move to password step
        setStep(2);
    };

    const handleSetPassword = async () => {
        if (!newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${API_URL}/driver/set-initial-password`, {
                email,
                otp,
                newPassword,
                confirmPassword
            });

            Alert.alert(
                'Success!',
                'Your password has been set successfully. You can now login.',
                [{ text: 'Login Now', onPress: () => navigation.navigate('Login') }]
            );
        } catch (error) {
            Alert.alert(
                'Error',
                error.response?.data?.message || 'Failed to set password'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.content}>
                    <Ionicons
                        name={step === 1 ? "mail-outline" : "key-outline"}
                        size={80}
                        color="#10b981"
                        style={styles.icon}
                    />

                    {step === 1 ? (
                        <>
                            <Text style={styles.title}>Welcome Driver!</Text>
                            <Text style={styles.subtitle}>
                                Enter the OTP sent to your email{'\n'}
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
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.button}
                                onPress={handleVerifyOTP}
                            >
                                <Text style={styles.buttonText}>Continue</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <Text style={styles.title}>Set Your Password</Text>
                            <Text style={styles.subtitle}>
                                Create a secure password for your driver account.
                            </Text>

                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="New Password"
                                    placeholderTextColor="#999"
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    secureTextEntry={!showNewPassword}
                                    editable={!loading}
                                />
                                <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                                    <Ionicons
                                        name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                                        size={20}
                                        color="#666"
                                    />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Confirm Password"
                                    placeholderTextColor="#999"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showConfirmPassword}
                                    editable={!loading}
                                />
                                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                    <Ionicons
                                        name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                                        size={20}
                                        color="#666"
                                    />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.passwordRequirements}>
                                <Text style={styles.requirementText}>• At least 6 characters</Text>
                                <Text style={styles.requirementText}>• Passwords must match</Text>
                            </View>

                            <TouchableOpacity
                                style={[styles.button, loading && styles.buttonDisabled]}
                                onPress={handleSetPassword}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>Set Password</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => setStep(1)}>
                                <Text style={styles.backText}>← Back to OTP</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 30,
        paddingTop: 80,
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
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        paddingHorizontal: 15,
        marginBottom: 20,
        backgroundColor: '#f9f9f9',
        width: '100%',
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: '#000',
    },
    passwordRequirements: {
        width: '100%',
        marginBottom: 30,
    },
    requirementText: {
        fontSize: 12,
        color: '#666',
        marginBottom: 5,
    },
    button: {
        backgroundColor: '#10b981',
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        width: '100%',
        marginBottom: 15,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    backText: {
        color: '#10b981',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 10,
    },
});

export default DriverFirstTimePasswordScreen;
