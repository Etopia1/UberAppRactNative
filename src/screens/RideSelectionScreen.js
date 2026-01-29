import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Modal, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Map from '../components/Map';
import { theme } from '../constants/theme';
import api from '../services/api';
import Toast from 'react-native-toast-message';

const cars = [
    { id: '1', name: 'Economy', price: 14.00, time: '4 min', image: 'https://img.icons8.com/ios/50/000000/car.png' },
    { id: '2', name: 'Luxury', price: 24.00, time: '6 min', image: 'https://img.icons8.com/ios/50/000000/suv.png' },
    { id: '3', name: 'Family', price: 34.00, time: '9 min', image: 'https://img.icons8.com/ios/50/000000/minivan.png' },
];

export default function RideSelectionScreen({ navigation, route }) {
    const [selectedCar, setSelectedCar] = useState(cars[0].id);
    const [walletBalance, setWalletBalance] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' or 'wallet'
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [loading, setLoading] = useState(false);

    // Refresh balance every time screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            fetchBalance();
        }, [])
    );

    const fetchBalance = async () => {
        try {
            const res = await api.get('/wallet/balance');
            setWalletBalance(res.data.balance);
        } catch (error) {
            console.error('Error fetching balance', error);
        }
    };

    const handleConfirm = async () => {
        const car = cars.find(c => c.id === selectedCar);

        if (paymentMethod === 'wallet' && walletBalance < car.price) {
            Alert.alert(
                'Insufficient Funds',
                `Your wallet balance is $${walletBalance.toFixed(2)}. This ride costs $${car.price.toFixed(2)}.`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Add Funds', onPress: () => navigation.navigate('FundWallet') }
                ]
            );
            return;
        }

        setLoading(true);

        try {
            // If paying by wallet, we might deduct now or later. 
            // For now, let's assume valid request, server handles deduction or lock.
            // But usually for rides, you authorize first.
            // We'll just pass paymentMethod to 'DriverArrival' or the API.

            // Simulating API call for ride request
            await api.post('/ride/request', {
                carType: car.name,
                price: car.price,
                paymentMethod: paymentMethod,
                pickup: route.params?.pickup,
                dropoff: route.params?.dropoff
            });

            setLoading(false);
            navigation.navigate('DriverArrival', {
                rideDetails: { ...car, paymentMethod, price: car.price }
            });

        } catch (error) {
            setLoading(false);
            Toast.show({
                type: 'error',
                text1: 'Request Failed',
                text2: 'Could not book ride. Please try again.'
            });
        }
    };

    const getSelectedCarDetails = () => cars.find(c => c.id === selectedCar);

    return (
        <View style={styles.container}>
            <Map style={styles.map} />

            <View style={styles.bottomSheet}>
                <View style={styles.handle} />
                <Text style={styles.title}>Select Car</Text>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carList}>
                    {cars.map((car) => (
                        <TouchableOpacity
                            key={car.id}
                            style={[styles.carItem, selectedCar === car.id && styles.selectedCar]}
                            onPress={() => setSelectedCar(car.id)}
                        >
                            <Image source={{ uri: car.image }} style={styles.carImage} />
                            <Text style={styles.carName}>{car.name}</Text>
                            <Text style={styles.carPrice}>${car.price.toFixed(2)}</Text>
                            <Text style={styles.carTime}>{car.time}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Payment Toggle */}
                <TouchableOpacity
                    style={styles.paymentMethod}
                    onPress={() => setShowPaymentModal(true)}
                >
                    <View style={styles.paymentMethodLeft}>
                        <Text style={styles.paymentIcon}>{paymentMethod === 'wallet' ? '💰' : '💵'}</Text>
                        <View>
                            <Text style={styles.paymentText}>
                                {paymentMethod === 'wallet' ? 'Wallet Balance' : 'Cash Payment'}
                            </Text>
                            {paymentMethod === 'wallet' && (
                                <Text style={styles.balanceText}>
                                    ${walletBalance.toFixed(2)} available
                                </Text>
                            )}
                        </View>
                    </View>
                    <Text style={styles.changeText}>Change</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.confirmBtn, loading && styles.disabledBtn]}
                    onPress={handleConfirm}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.btnText}>
                            Confirm {getSelectedCarDetails()?.name}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Payment Selection Modal */}
            <Modal
                visible={showPaymentModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowPaymentModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Choose Payment Method</Text>

                        <TouchableOpacity
                            style={[styles.modalOption, paymentMethod === 'cash' && styles.selectedOption]}
                            onPress={() => {
                                setPaymentMethod('cash');
                                setShowPaymentModal(false);
                            }}
                        >
                            <Text style={styles.optionIcon}>💵</Text>
                            <Text style={styles.optionText}>Cash</Text>
                            {paymentMethod === 'cash' && <Text style={styles.check}>✓</Text>}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.modalOption, paymentMethod === 'wallet' && styles.selectedOption]}
                            onPress={() => {
                                setPaymentMethod('wallet');
                                setShowPaymentModal(false);
                            }}
                        >
                            <Text style={styles.optionIcon}>💰</Text>
                            <View>
                                <Text style={styles.optionText}>Wallet</Text>
                                <Text style={styles.optionSubText}>Balance: ${walletBalance.toFixed(2)}</Text>
                            </View>
                            {paymentMethod === 'wallet' && <Text style={styles.check}>✓</Text>}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.addFundsLink}
                            onPress={() => {
                                setShowPaymentModal(false);
                                navigation.navigate('FundWallet');
                            }}
                        >
                            <Text style={styles.addFundsText}>+ Add Funds to Wallet</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.closeModal}
                            onPress={() => setShowPaymentModal(false)}
                        >
                            <Text style={styles.closeText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        height: '55%',
    },
    bottomSheet: {
        height: '45%',
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: theme.borderRadius.xl,
        borderTopRightRadius: theme.borderRadius.xl,
        padding: theme.spacing.l,
        marginTop: -30,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: theme.colors.inputBorder,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: theme.spacing.m
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: theme.spacing.m,
        color: theme.colors.text
    },
    carList: {
        flexGrow: 0,
        marginBottom: theme.spacing.l
    },
    carItem: {
        width: 100,
        height: 120,
        borderWidth: 1,
        borderColor: theme.colors.inputBorder,
        borderRadius: theme.borderRadius.m,
        marginRight: theme.spacing.m,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.s,
        backgroundColor: theme.colors.inputBg
    },
    selectedCar: {
        borderColor: theme.colors.primary,
        backgroundColor: '#E8F5E9',
        borderWidth: 2
    },
    carImage: {
        width: 50,
        height: 30,
        marginBottom: 10,
        resizeMode: 'contain'
    },
    carName: {
        fontWeight: 'bold',
        fontSize: 14,
        color: theme.colors.text,
        marginBottom: 2
    },
    carPrice: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333'
    },
    carTime: {
        fontSize: 11,
        color: theme.colors.darkGray,
        marginTop: 2
    },
    paymentMethod: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 15,
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        marginBottom: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#eee'
    },
    paymentMethodLeft: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    paymentIcon: {
        fontSize: 24,
        marginRight: 10
    },
    paymentText: {
        fontWeight: 'bold',
        color: theme.colors.text,
        fontSize: 15
    },
    balanceText: {
        fontSize: 12,
        color: '#666',
        marginTop: 2
    },
    changeText: {
        color: theme.colors.primary,
        fontWeight: 'bold',
        fontSize: 14
    },
    confirmBtn: {
        backgroundColor: theme.colors.primary,
        padding: 18,
        borderRadius: 15,
        alignItems: 'center',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5
    },
    disabledBtn: {
        backgroundColor: '#ccc',
        shadowOpacity: 0
    },
    btnText: {
        color: theme.colors.secondary,
        fontSize: 18,
        fontWeight: 'bold'
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end'
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 40
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center'
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    selectedOption: {
        backgroundColor: '#f0f8ff'
    },
    optionIcon: {
        fontSize: 24,
        marginRight: 15
    },
    optionText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333'
    },
    optionSubText: {
        fontSize: 12,
        color: '#666'
    },
    check: {
        marginLeft: 'auto',
        color: theme.colors.primary,
        fontSize: 18,
        fontWeight: 'bold'
    },
    addFundsLink: {
        marginTop: 20,
        padding: 15,
        alignItems: 'center'
    },
    addFundsText: {
        color: theme.colors.primary,
        fontWeight: 'bold',
        fontSize: 16
    },
    closeModal: {
        marginTop: 10,
        padding: 15,
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 10
    },
    closeText: {
        fontWeight: 'bold',
        color: '#333'
    }
});
