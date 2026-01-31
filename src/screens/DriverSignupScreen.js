import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import api from '../services/api';
import Toast from 'react-native-toast-message';
import { theme } from '../constants/theme';

export default function DriverSignupScreen({ navigation }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');

    // Vehicle Details
    const [vehicle, setVehicle] = useState({
        make: '',
        model: '',
        year: '',
        plate: '',
        color: ''
    });

    const [loading, setLoading] = useState(false);

    const handleSignup = async () => {
        if (!name || !email || !password || !phone || !vehicle.make || !vehicle.model || !vehicle.year || !vehicle.plate || !vehicle.color) {
            Toast.show({ type: 'error', text1: 'Missing Fields', text2: 'Please fill all fields including vehicle info' });
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/signup', {
                name,
                email,
                password,
                phone,
                role: 'driver',
                vehicle
            });
            Toast.show({
                type: 'success',
                text1: 'Application Submitted',
                text2: 'Please verify your OTP to continue',
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

    const updateVehicle = (key, value) => {
        setVehicle(prev => ({ ...prev, [key]: value }));
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Driver Sign Up</Text>
                <Text style={styles.subtitle}>Join us and start earning</Text>
            </View>

            <View style={styles.form}>

                {/* Personal Info */}
                <Text style={styles.sectionHeader}>Personal Info</Text>
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput style={styles.input} placeholder="John Driver" value={name} onChangeText={setName} />
                </View>
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput style={styles.input} placeholder="driver@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" />
                </View>
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Phone</Text>
                    <TextInput style={styles.input} placeholder="+123..." value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                </View>
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Password</Text>
                    <TextInput style={styles.input} placeholder="••••••" value={password} onChangeText={setPassword} secureTextEntry />
                </View>

                {/* Vehicle Info */}
                <Text style={styles.sectionHeader}>Vehicle Info</Text>
                <View style={styles.row}>
                    <View style={[styles.inputContainer, { flex: 0.48 }]}>
                        <Text style={styles.label}>Make</Text>
                        <TextInput style={styles.input} placeholder="Toyota" value={vehicle.make} onChangeText={(t) => updateVehicle('make', t)} />
                    </View>
                    <View style={[styles.inputContainer, { flex: 0.48 }]}>
                        <Text style={styles.label}>Model</Text>
                        <TextInput style={styles.input} placeholder="Camry" value={vehicle.model} onChangeText={(t) => updateVehicle('model', t)} />
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={[styles.inputContainer, { flex: 0.48 }]}>
                        <Text style={styles.label}>Year</Text>
                        <TextInput style={styles.input} placeholder="2020" value={vehicle.year} onChangeText={(t) => updateVehicle('year', t)} keyboardType="numeric" />
                    </View>
                    <View style={[styles.inputContainer, { flex: 0.48 }]}>
                        <Text style={styles.label}>Color</Text>
                        <TextInput style={styles.input} placeholder="Red" value={vehicle.color} onChangeText={(t) => updateVehicle('color', t)} />
                    </View>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>License Plate</Text>
                    <TextInput style={styles.input} placeholder="ABC-1234" value={vehicle.plate} onChangeText={(t) => updateVehicle('plate', t)} />
                </View>

                <TouchableOpacity
                    style={[styles.signupBtn, loading && styles.disabledBtn]}
                    onPress={handleSignup}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.signupBtnText}>Register as Driver</Text>}
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.link}>Sign In</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#000',
        padding: 20,
        paddingTop: 50
    },
    header: { alignItems: 'center', marginBottom: 30 },
    title: { fontSize: 28, fontWeight: 'bold', color: theme.colors.primary, marginBottom: 5 },
    subtitle: { fontSize: 16, color: '#888' },
    sectionHeader: { fontSize: 18, color: '#fff', marginBottom: 15, marginTop: 10, borderBottomWidth: 1, borderBottomColor: '#333', paddingBottom: 5 },
    form: { width: '100%' },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    inputContainer: { marginBottom: 15 },
    label: { fontSize: 14, fontWeight: '600', color: '#ccc', marginBottom: 5 },
    input: {
        backgroundColor: '#222',
        borderRadius: 8,
        padding: 12,
        color: '#fff',
        borderWidth: 1,
        borderColor: '#333'
    },
    signupBtn: {
        backgroundColor: theme.colors.primary,
        borderRadius: 25,
        padding: 15,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30
    },
    signupBtnText: { color: '#000', fontSize: 18, fontWeight: 'bold' },
    disabledBtn: { opacity: 0.7 },
    footer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
    footerText: { color: '#888' },
    link: { color: theme.colors.primary, fontWeight: 'bold' }
});
