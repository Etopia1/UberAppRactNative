import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Production API URL - Render backend (Recommended for APK)
const BASE_URL = 'https://uberappbackend.onrender.com/api';
// const BASE_URL = 'http://localhost:2000/api';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - Add auth token to all requests
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
                console.log('✅ API Request: Token added to headers');
            } else {
                console.log('⚠️ API Request: No token found');
            }
        } catch (error) {
            console.error('❌ Error getting token:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle auth errors
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        if (error.response) {
            const { status, data } = error.response;

            if (status === 401) {
                console.error('❌ Auth Error:', data.message || 'Unauthorized');
                // Could trigger logout here if needed
            }

            console.error(`❌ API Error ${status}:`, data.message || error.message);
        } else {
            console.error('❌ Network Error:', error.message);
        }

        return Promise.reject(error);
    }
);

export default api;
