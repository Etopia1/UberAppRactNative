import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../services/api';
import Toast from 'react-native-toast-message';
import { theme } from '../constants/theme';
import GoogleLoginButton from '../components/GoogleLoginButton';

export default function SignupScreen({ navigation }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState('rider');
    const [loading, setLoading] = useState(false);

    const handleSignup = async () => {
        if (!name || !email || !password || !phone) {
            Toast.show({ type: 'error', text1: 'Missing Fields', text2: 'Please fill all fields' });
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/signup', { name, email, password, phone, role });
            Toast.show({
                type: 'success',
                text1: 'Account Created',
                text2: 'Please verify your OTP',
            });
            navigation.navigate('OTP', { email });
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Signup Failed',
                text2: error.response?.data?.message || 'Something went wrong',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Sign Up</Text>
                <Text style={styles.subtitle}>Create your account</Text>
            </View>

            <View style={styles.form}>
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="John Doe"
                        placeholderTextColor={theme.colors.darkGray}
                        value={name}
                        onChangeText={setName}
                    />
                </View>

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
                    <Text style={styles.label}>Phone</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="+1234567890"
                        placeholderTextColor={theme.colors.darkGray}
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
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

                <View style={[styles.roleContainer, { display: 'none' }]}>
                    <TouchableOpacity
                        style={[styles.roleBtn, role === 'rider' && styles.activeRole]}
                        onPress={() => setRole('rider')}
                    >
                        <Text style={[styles.roleText, role === 'rider' && styles.activeRoleText]}>Rider</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.roleBtn, role === 'driver' && styles.activeRole]}
                        onPress={() => setRole('driver')}
                    >
                        <Text style={[styles.roleText, role === 'driver' && styles.activeRoleText]}>Driver</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.signupBtn, loading && styles.disabledBtn]}
                    onPress={handleSignup}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={theme.colors.secondary} />
                    ) : (
                        <Text style={styles.signupBtnText}>Sign Up</Text>
                    )}
                </TouchableOpacity>

                <GoogleLoginButton />

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.link}>Sign In</Text>
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
        marginBottom: theme.spacing.l,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        fontSize: 16,
        color: theme.colors.darkGray,
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
    roleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.l,
        marginTop: theme.spacing.s,
    },
    roleBtn: {
        flex: 0.48,
        padding: theme.spacing.m,
        borderRadius: theme.borderRadius.s,
        borderWidth: 1,
        borderColor: theme.colors.inputBorder,
        alignItems: 'center',
        backgroundColor: theme.colors.inputBg,
    },
    activeRole: {
        backgroundColor: theme.colors.success,
        borderColor: theme.colors.success,
    },
    roleText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.darkGray,
    },
    activeRoleText: {
        color: theme.colors.secondary,
    },
    signupBtn: {
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.l,
        padding: theme.spacing.m,
        alignItems: 'center',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    signupBtnText: {
        color: theme.colors.secondary,
        fontSize: 18,
        fontWeight: 'bold',
    },
    disabledBtn: {
        backgroundColor: theme.colors.darkGray,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: theme.spacing.l,
    },
    footerText: {
        color: theme.colors.darkGray,
        fontSize: 14,
    },
    link: {
        color: theme.colors.primary,
        fontSize: 14,
        fontWeight: 'bold',
    },
});
