import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials, setLoading, setError } from '../redux/slices/authSlice';
import api from '../services/api';
import Toast from 'react-native-toast-message';
import { theme } from '../constants/theme';
import GoogleLoginButton from '../components/GoogleLoginButton';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const dispatch = useDispatch();
    const { loading } = useSelector(state => state.auth);

    const handleLogin = async () => {
        if (!email || !password) {
            Toast.show({ type: 'error', text1: 'Missing Fields', text2: 'Please enter email and password' });
            return;
        }

        dispatch(setLoading(true));
        try {
            const response = await api.post('/auth/login', { email, password });

            // Save token to AsyncStorage
            await AsyncStorage.setItem('token', response.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.data.user));

            console.log('✅ Token saved to AsyncStorage:', response.data.token);

            dispatch(setCredentials({ user: response.data.user, token: response.data.token }));
            Toast.show({
                type: 'success',
                text1: 'Welcome back!',
                text2: 'Login successful',
            });
        } catch (error) {
            console.error('Login Error:', error);
            dispatch(setError(error.message));

            // Safety wrapper for Toast
            try {
                Toast.show({
                    type: 'error',
                    text1: 'Login Failed',
                    text2: error.response?.data?.message || error.message || 'Invalid credentials',
                });
            } catch (toastError) {
                console.error('Toast Error:', toastError);
            }
        } finally {
            dispatch(setLoading(false));
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Driven</Text>
                <Text style={styles.subtitle}>Sign in to continue</Text>
            </View>

            <View style={styles.form}>
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="example@gmail.com"
                        placeholderTextColor={theme.colors.darkGray}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="••••••"
                        placeholderTextColor={theme.colors.darkGray}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </View>

                <TouchableOpacity
                    style={[styles.loginBtn, loading && styles.disabledBtn]}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={theme.colors.secondary} />
                    ) : (
                        <Text style={styles.loginBtnText}>Sign In</Text>
                    )}
                </TouchableOpacity>

                <GoogleLoginButton />

                <TouchableOpacity style={{ alignSelf: 'center', marginTop: 15 }} onPress={() => navigation.navigate('ForgotPassword')}>
                    <Text style={{ color: theme.colors.darkGray }}>Forgot Password?</Text>
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Don't have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                        <Text style={styles.link}>Sign Up</Text>
                    </TouchableOpacity>
                </View>
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
        ...theme.typography.header,
        fontSize: 42,
        color: theme.colors.primary,
        marginBottom: theme.spacing.s,
    },
    subtitle: {
        ...theme.typography.subheader,
        color: theme.colors.textSecondary,
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        marginBottom: theme.spacing.m,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xs,
        marginLeft: 4,
    },
    input: {
        backgroundColor: theme.colors.inputBg,
        borderRadius: theme.borderRadius.m,
        padding: theme.spacing.m,
        borderWidth: 1,
        borderColor: theme.colors.inputBorder,
        fontSize: 16,
        color: theme.colors.text,
    },
    loginBtn: {
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.l,
        padding: theme.spacing.m,
        alignItems: 'center',
        marginTop: theme.spacing.m,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    disabledBtn: {
        backgroundColor: theme.colors.inputBg,
        borderColor: theme.colors.inputBorder,
        borderWidth: 1,
    },
    loginBtnText: {
        color: '#000', // Black text on Green button is readable
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: theme.spacing.l,
    },
    footerText: {
        color: theme.colors.textSecondary,
        fontSize: 14,
    },
    link: {
        color: theme.colors.primary,
        fontSize: 14,
        fontWeight: 'bold',
    },
});
