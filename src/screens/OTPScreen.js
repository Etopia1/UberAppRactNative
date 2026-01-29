import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { theme } from '../constants/theme';
import Toast from 'react-native-toast-message';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../redux/slices/authSlice';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OTPScreen({ navigation, route }) {
    const { email } = route.params || {};
    const [otp, setOtp] = useState(['', '', '', '']);
    const [timer, setTimer] = useState(55);
    const inputs = [];
    const dispatch = useDispatch();

    // Simulate timer
    useEffect(() => {
        const interval = setInterval(() => {
            setTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleChange = (text, index) => {
        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);

        if (text && index < 3) {
            inputs[index + 1].focus();
        }
    };

    const handleVerify = async () => {
        const code = otp.join('');
        if (code.length < 4) {
            Toast.show({
                type: 'error',
                text1: 'Invalid Code',
                text2: 'Please enter a 4-digit code',
            });
            return;
        }

        try {
            const response = await api.post('/auth/verify-otp', { email, otp: code });

            // Save token to AsyncStorage
            await AsyncStorage.setItem('token', response.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.data.user));

            console.log('✅ Token saved to AsyncStorage after OTP:', response.data.token);

            dispatch(setCredentials({ user: response.data.user, token: response.data.token }));

            Toast.show({
                type: 'success',
                text1: 'Verified!',
                text2: 'Welcome to Driven',
            });

            navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
            });

        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Verification Failed',
                text2: error.response?.data?.message || 'Invalid OTP',
            });
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Enter Your OTP</Text>
                <Text style={styles.subtitle}>
                    Check your console (or email in prod) for code sent to {email}
                </Text>
            </View>

            <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                    <TextInput
                        key={index}
                        style={styles.otpInput}
                        keyboardType="number-pad"
                        maxLength={1}
                        value={digit}
                        onChangeText={(text) => handleChange(text, index)}
                        ref={(input) => (inputs[index] = input)}
                    />
                ))}
            </View>

            <Text style={styles.timer}>
                Resend code in <Text style={styles.timerBold}>00:{timer < 10 ? `0${timer}` : timer}</Text> sec
            </Text>

            <TouchableOpacity style={styles.verifyBtn} onPress={handleVerify}>
                <Text style={styles.verifyBtnText}>Verify Now</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: theme.spacing.l,
        alignItems: 'center',
    },
    header: {
        marginTop: theme.spacing.xl * 2,
        marginBottom: theme.spacing.xl,
        alignItems: 'center',
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
        paddingHorizontal: theme.spacing.l,
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '80%',
        marginBottom: theme.spacing.l,
    },
    otpInput: {
        width: 60,
        height: 60,
        borderWidth: 1,
        borderColor: theme.colors.inputBorder,
        borderRadius: theme.borderRadius.m,
        fontSize: 24,
        textAlign: 'center',
        backgroundColor: theme.colors.inputBg,
        color: theme.colors.text,
    },
    timer: {
        fontSize: 14,
        color: theme.colors.darkGray,
        marginBottom: theme.spacing.xl,
    },
    timerBold: {
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    verifyBtn: {
        width: '100%',
        backgroundColor: theme.colors.primary,
        padding: theme.spacing.m,
        borderRadius: theme.borderRadius.l,
        alignItems: 'center',
    },
    verifyBtnText: {
        color: theme.colors.secondary,
        fontSize: 18,
        fontWeight: 'bold',
    },
});
