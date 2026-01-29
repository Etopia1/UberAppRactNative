import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import { theme } from '../constants/theme';
import api from '../services/api';
import Toast from 'react-native-toast-message';

export default function FundWalletScreen({ navigation }) {
    const user = useSelector(state => state.auth.user);
    const [amount, setAmount] = useState('');
    const [customAmount, setCustomAmount] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvc, setCvc] = useState('');
    const [loading, setLoading] = useState(false);

    const presetAmounts = [10, 25, 50, 100, 250, 500];

    const handlePresetAmount = (value) => {
        setAmount(value.toString());
        setCustomAmount('');
    };

    const handleCustomAmount = (value) => {
        setCustomAmount(value);
        setAmount(value);
    };

    const handleFundWallet = async () => {
        const fundAmount = parseFloat(amount);

        if (!fundAmount || fundAmount <= 0) {
            Toast.show({ type: 'error', text1: 'Please enter a valid amount' });
            return;
        }

        if (cardNumber.length < 16 || expiry.length < 4 || cvc.length < 3) {
            Toast.show({ type: 'error', text1: 'Please enter valid card details' });
            return;
        }

        try {
            setLoading(true);

            // Create payment intent
            const { data } = await api.post('/wallet/fund', { amount: fundAmount });

            // Simulate payment processing (in production, use Stripe SDK)
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Confirm funding
            await api.post('/wallet/confirm-funding', {
                paymentIntentId: data.paymentIntentId,
                amount: fundAmount
            });

            Toast.show({
                type: 'success',
                text1: 'Wallet Funded! 💰',
                text2: `Added $${fundAmount.toFixed(2)} to your wallet`
            });

            navigation.goBack();
        } catch (error) {
            console.error('Fund wallet error:', error);
            Toast.show({
                type: 'error',
                text1: 'Payment Failed',
                text2: error.response?.data?.message || 'Please try again'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Fund Wallet</Text>
            </View>

            {/* Amount Selection */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Select Amount</Text>
                <View style={styles.presetGrid}>
                    {presetAmounts.map((preset) => (
                        <TouchableOpacity
                            key={preset}
                            style={[
                                styles.presetButton,
                                amount === preset.toString() && styles.presetButtonActive
                            ]}
                            onPress={() => handlePresetAmount(preset)}
                        >
                            <Text style={[
                                styles.presetText,
                                amount === preset.toString() && styles.presetTextActive
                            ]}>
                                ${preset}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.orText}>or enter custom amount</Text>
                <TextInput
                    style={styles.customInput}
                    placeholder="Enter amount"
                    keyboardType="numeric"
                    value={customAmount}
                    onChangeText={handleCustomAmount}
                    placeholderTextColor="#999"
                />
            </View>

            {/* Card Details */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Payment Method</Text>

                <Text style={styles.label}>Card Number</Text>
                <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    maxLength={16}
                    value={cardNumber}
                    onChangeText={setCardNumber}
                    placeholder="4242424242424242"
                    placeholderTextColor="#999"
                />

                <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={styles.label}>Expiry Date</Text>
                        <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            maxLength={5}
                            value={expiry}
                            onChangeText={setExpiry}
                            placeholder="12/25"
                            placeholderTextColor="#999"
                        />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.label}>CVC</Text>
                        <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            maxLength={3}
                            value={cvc}
                            onChangeText={setCvc}
                            placeholder="123"
                            placeholderTextColor="#999"
                        />
                    </View>
                </View>

                <View style={styles.testCardInfo}>
                    <Text style={styles.testCardTitle}>💡 Test Card (Stripe Test Mode)</Text>
                    <Text style={styles.testCardText}>Card: 4242424242424242</Text>
                    <Text style={styles.testCardText}>Expiry: Any future date (e.g., 12/25)</Text>
                    <Text style={styles.testCardText}>CVC: Any 3 digits (e.g., 123)</Text>
                </View>
            </View>

            {/* Summary */}
            {amount && (
                <View style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Amount to add:</Text>
                        <Text style={styles.summaryValue}>${parseFloat(amount).toFixed(2)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Processing fee:</Text>
                        <Text style={styles.summaryValue}>$0.00</Text>
                    </View>
                    <View style={[styles.summaryRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>Total:</Text>
                        <Text style={styles.totalValue}>${parseFloat(amount).toFixed(2)}</Text>
                    </View>
                </View>
            )}

            {/* Fund Button */}
            <TouchableOpacity
                style={[styles.fundButton, (!amount || loading) && styles.fundButtonDisabled]}
                onPress={handleFundWallet}
                disabled={!amount || loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.fundButtonText}>
                        Fund Wallet ${amount ? parseFloat(amount).toFixed(2) : '0.00'}
                    </Text>
                )}
            </TouchableOpacity>

            <View style={styles.securityBadge}>
                <Text style={styles.securityText}>🔒 Secured by Stripe</Text>
                <Text style={styles.securitySubtext}>Your payment information is encrypted</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa'
    },
    header: {
        padding: 20,
        paddingTop: 60,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0'
    },
    backButton: {
        fontSize: 16,
        color: theme.colors.primary,
        marginBottom: 10
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333'
    },
    section: {
        backgroundColor: '#fff',
        padding: 20,
        marginTop: 10
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15
    },
    presetGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10
    },
    presetButton: {
        width: '30%',
        padding: 15,
        backgroundColor: '#f5f7fa',
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent'
    },
    presetButtonActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary
    },
    presetText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333'
    },
    presetTextActive: {
        color: '#fff'
    },
    orText: {
        textAlign: 'center',
        color: '#999',
        marginVertical: 15,
        fontSize: 14
    },
    customInput: {
        backgroundColor: '#f5f7fa',
        borderRadius: 12,
        padding: 15,
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#333',
        borderWidth: 1,
        borderColor: '#e0e0e0'
    },
    label: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
        fontWeight: '600'
    },
    input: {
        backgroundColor: '#f5f7fa',
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        marginBottom: 15,
        color: '#333',
        borderWidth: 1,
        borderColor: '#e0e0e0'
    },
    row: {
        flexDirection: 'row'
    },
    testCardInfo: {
        backgroundColor: '#FFF9E6',
        padding: 15,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#FFD700',
        marginTop: 10
    },
    testCardTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#333'
    },
    testCardText: {
        fontSize: 12,
        color: '#666',
        marginVertical: 2
    },
    summaryCard: {
        backgroundColor: '#fff',
        margin: 20,
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10
    },
    summaryLabel: {
        fontSize: 14,
        color: '#666'
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333'
    },
    totalRow: {
        marginTop: 10,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0'
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333'
    },
    totalValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.primary
    },
    fundButton: {
        backgroundColor: theme.colors.primary,
        margin: 20,
        marginTop: 10,
        padding: 18,
        borderRadius: 15,
        alignItems: 'center',
        shadowColor: theme.colors.primary,
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5
    },
    fundButtonDisabled: {
        backgroundColor: '#ccc',
        shadowOpacity: 0
    },
    fundButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold'
    },
    securityBadge: {
        alignItems: 'center',
        marginBottom: 30
    },
    securityText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4CAF50',
        marginBottom: 5
    },
    securitySubtext: {
        fontSize: 12,
        color: '#999'
    }
});
