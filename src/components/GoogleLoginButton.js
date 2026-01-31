import React, { useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, Image, ActivityIndicator, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useDispatch } from 'react-redux';
import { setCredentials, setLoading, setError } from '../redux/slices/authSlice';
import api from '../services/api';
import { theme } from '../constants/theme';
import Toast from 'react-native-toast-message';

WebBrowser.maybeCompleteAuthSession();

export default function GoogleLoginButton() {
    const dispatch = useDispatch();
    const [request, response, promptAsync] = Google.useAuthRequest({
        // Replace with your actual IDs from Google Cloud Console
        androidClientId: '265406180637-rrsltocqfo89i5mka9eei4mhrpb1sgmo.apps.googleusercontent.com',
        iosClientId: 'YOUR_IOS_CLIENT_ID',
        webClientId: '265406180637-er3lo5vshpi6ptsudg6kkne48jomsgjm.apps.googleusercontent.com',
        prompt: 'select_account', // Forces Google to show account picker
    });

    useEffect(() => {
        if (response?.type === 'success') {
            // Check both locations for ID Token, or fall back to Access Token
            const token =
                response.params?.id_token ||
                response.authentication?.idToken ||
                response.authentication?.accessToken ||
                response.params?.access_token;

            if (token) {
                console.log('Sending Google Token to Backend:', token.substring(0, 10) + '...');
                handleGoogleLogin(token);
            } else {
                console.error('Google Auth Success but no Token found:', response);
                Toast.show({ type: 'error', text1: 'Login Error', text2: 'No Token received from Google' });
            }
        } else if (response?.type === 'error') {
            Toast.show({ type: 'error', text1: 'Google Sign-In Failed' });
        }
    }, [response]);

    const handleGoogleLogin = async (token) => {
        dispatch(setLoading(true));
        try {
            const res = await api.post('/auth/google-login', { token });
            dispatch(setCredentials({ user: res.data.user, token: res.data.token }));
            Toast.show({ type: 'success', text1: 'Welcome!', text2: 'Signed in with Google' });
        } catch (error) {
            console.error('Backend Google Login Error:', error);
            dispatch(setError(error.message));
            Toast.show({
                type: 'error',
                text1: 'Login Failed',
                text2: error.response?.data?.error || 'Could not verify with backend'
            });
        } finally {
            dispatch(setLoading(false));
        }
    };

    return (
        <TouchableOpacity
            style={styles.button}
            onPress={() => promptAsync()}
            disabled={!request}
        >
            <Image
                source={{ uri: 'https://img.icons8.com/color/48/000000/google-logo.png' }}
                style={styles.icon}
            />
            <Text style={styles.text}>Sign in with Google</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: theme.borderRadius.l,
        padding: theme.spacing.m,
        marginTop: theme.spacing.m,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    icon: {
        width: 24,
        height: 24,
        marginRight: theme.spacing.s,
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
    },
});
