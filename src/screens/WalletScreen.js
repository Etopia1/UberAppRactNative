import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Modal, Share, ActivityIndicator } from 'react-native';
import { theme } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import api from '../services/api';

export default function WalletScreen({ navigation }) {
    const user = useSelector(state => state.auth.user);
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    const fetchData = async () => {
        try {
            const userId = user.id || user._id;
            // 1. Fetch Balance
            const balanceRes = await api.get('/wallet/balance');
            setBalance(balanceRes.data.balance || 0);

            // 2. Fetch Transactions (using bookings as source of truth for now)
            const bookingsRes = await api.get(`/bookings/${userId}`);

            // Transform bookings to transaction format
            const mappedTransactions = (bookingsRes.data.bookings || []).map(booking => ({
                id: booking._id,
                type: booking.type || 'flight', // 'flight' or 'ride'
                title: booking.type === 'ride' ? 'Ride Payment' : `Flight: ${booking.airline}`,
                date: new Date(booking.createdAt),
                amount: booking.price || booking.totalPrice,
                status: booking.status,
                details: booking
            }));

            // Sort by date desc
            mappedTransactions.sort((a, b) => b.date - a.date);
            setTransactions(mappedTransactions);

        } catch (error) {
            console.error('Wallet fetch error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleShareReceipt = async () => {
        if (!selectedTransaction) return;

        const t = selectedTransaction;
        const receiptMessage = `
🧾 DRIVEN RECEIPT
--------------------------------
Type: ${t.type.toUpperCase()}
Item: ${t.title}
Date: ${t.date.toLocaleDateString()} ${t.date.toLocaleTimeString()}
Amount: $${t.amount}
Status: ${t.status.toUpperCase()}
--------------------------------
Thank you for riding with Driven!
        `;

        try {
            await Share.share({
                message: receiptMessage,
                title: 'Driven Receipt'
            });
        } catch (error) {
            console.error('Sharing failed:', error);
        }
    };

    const ReceiptModal = () => (
        <Modal
            visible={!!selectedTransaction}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setSelectedTransaction(null)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.receiptHeader}>
                        <View style={styles.receiptIcon}>
                            <Ionicons name="checkmark-circle" size={40} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.receiptTitle}>Payment Successful</Text>
                        <Text style={styles.receiptAmount}>${selectedTransaction?.amount}</Text>
                    </View>

                    <View style={styles.receiptDetails}>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Service</Text>
                            <Text style={styles.detailValue}>{selectedTransaction?.title}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Date</Text>
                            <Text style={styles.detailValue}>{selectedTransaction?.date.toLocaleDateString()}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Time</Text>
                            <Text style={styles.detailValue}>{selectedTransaction?.date.toLocaleTimeString()}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Status</Text>
                            <Text style={[styles.detailValue, { color: theme.colors.primary, fontWeight: 'bold' }]}>
                                {selectedTransaction?.status.toUpperCase()}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.modalActions}>
                        <TouchableOpacity style={styles.shareBtn} onPress={handleShareReceipt}>
                            <Ionicons name="share-outline" size={20} color="#fff" />
                            <Text style={styles.shareBtnText}>Share Receipt</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedTransaction(null)}>
                            <Text style={styles.closeBtnText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Wallet</Text>
            </View>

            <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>Total Balance</Text>
                <Text style={styles.balanceAmount}>${balance.toFixed(2)}</Text>
                <TouchableOpacity style={styles.addFundsBtn} onPress={() => navigation.navigate('FundWallet')}>
                    <Text style={styles.addFundsText}>+ Add Funds</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Recent Transactions</Text>

            {loading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20 }} />
            ) : (
                <ScrollView
                    contentContainerStyle={styles.transactionsList}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                >
                    {transactions.length === 0 ? (
                        <Text style={styles.emptyText}>No recent transactions</Text>
                    ) : (
                        transactions.map((item) => (
                            <TouchableOpacity key={item.id} style={styles.transactionItem} onPress={() => setSelectedTransaction(item)}>
                                <View style={styles.transIcon}>
                                    <Ionicons
                                        name={item.type === 'ride' ? "car" : "airplane"}
                                        size={20}
                                        color={theme.colors.primary}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.transTitle}>{item.title}</Text>
                                    <Text style={styles.transDate}>{item.date.toLocaleDateString()}</Text>
                                </View>
                                <Text style={styles.transAmount}>-${item.amount}</Text>
                            </TouchableOpacity>
                        ))
                    )}
                </ScrollView>
            )}

            <ReceiptModal />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: 20
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 30
    },
    backButton: {
        padding: 8,
        marginRight: 10
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text
    },
    balanceCard: {
        backgroundColor: theme.colors.surface,
        padding: 25,
        borderRadius: 20,
        alignItems: 'center',
        marginBottom: 30,
        borderWidth: 1,
        borderColor: theme.colors.inputBorder
    },
    balanceLabel: {
        color: theme.colors.textSecondary,
        fontSize: 14,
        marginBottom: 10
    },
    balanceAmount: {
        color: theme.colors.primary,
        fontSize: 36,
        fontWeight: 'bold',
        marginBottom: 20
    },
    addFundsBtn: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20
    },
    addFundsText: {
        color: '#000',
        fontWeight: 'bold'
    },
    sectionTitle: {
        color: theme.colors.text,
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        padding: 15,
        borderRadius: 12,
        marginBottom: 10
    },
    transIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.inputBg,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15
    },
    transTitle: {
        color: theme.colors.text,
        fontWeight: 'bold',
        fontSize: 16
    },
    transDate: {
        color: theme.colors.textSecondary,
        fontSize: 12
    },
    transAmount: {
        color: theme.colors.error, // Spending is usually red or minus
        fontWeight: 'bold'
    },
    emptyText: {
        textAlign: 'center',
        color: theme.colors.textSecondary,
        marginTop: 20
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalContent: {
        backgroundColor: theme.colors.surface,
        width: '85%',
        borderRadius: 25,
        padding: 25,
        alignItems: 'center'
    },
    receiptHeader: {
        alignItems: 'center',
        marginBottom: 25,
        width: '100%'
    },
    receiptIcon: {
        marginBottom: 10
    },
    receiptTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 5
    },
    receiptAmount: {
        fontSize: 32,
        fontWeight: 'bold',
        color: theme.colors.text
    },
    receiptDetails: {
        width: '100%',
        marginBottom: 25,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: theme.colors.inputBorder
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12
    },
    detailLabel: {
        color: theme.colors.textSecondary,
        fontSize: 14
    },
    detailValue: {
        color: theme.colors.text,
        fontWeight: '600',
        fontSize: 14
    },
    modalActions: {
        width: '100%',
        gap: 10
    },
    shareBtn: {
        backgroundColor: theme.colors.primary,
        padding: 15,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10
    },
    shareBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 10
    },
    closeBtn: {
        padding: 15,
        alignItems: 'center'
    },
    closeBtnText: {
        color: theme.colors.textSecondary,
        fontWeight: '600'
    }
});
