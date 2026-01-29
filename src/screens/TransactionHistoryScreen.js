import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { theme } from '../constants/theme';
import api from '../services/api';
import Toast from 'react-native-toast-message';

export default function TransactionHistoryScreen({ navigation }) {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('all'); // all, credit, debit
    const [page, setPage] = useState(1);

    useEffect(() => {
        fetchTransactions();
    }, [filter]);

    const fetchTransactions = async (pageNum = 1) => {
        try {
            setLoading(true);
            const queryParams = `?page=${pageNum}&limit=20${filter !== 'all' ? `&type=${filter}` : ''}`;
            const response = await api.get(`/wallet/transactions${queryParams}`);

            if (pageNum === 1) {
                setTransactions(response.data.transactions);
            } else {
                setTransactions(prev => [...prev, ...response.data.transactions]);
            }
        } catch (error) {
            console.error('Fetch transactions error:', error);
            Toast.show({ type: 'error', text1: 'Failed to load transactions' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        setPage(1);
        fetchTransactions(1);
    };

    const formatAmount = (amount) => {
        return `$${amount.toFixed(2)}`;
    };

    const formatDate = (date) => {
        const d = new Date(date);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (d.toDateString() === today.toDateString()) {
            return `Today, ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
        } else if (d.toDateString() === yesterday.toDateString()) {
            return `Yesterday, ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
        } else {
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        }
    };

    const getTransactionIcon = (transaction) => {
        if (transaction.type === 'credit') {
            return '✅';
        } else {
            if (transaction.description.includes('Flight')) return '✈️';
            if (transaction.description.includes('Ride')) return '🚗';
            return '❌';
        }
    };

    const renderTransaction = ({ item }) => (
        <View style={styles.transactionCard}>
            <View style={styles.transactionHeader}>
                <View style={styles.transactionLeft}>
                    <Text style={styles.transactionIcon}>{getTransactionIcon(item)}</Text>
                    <View style={styles.transactionInfo}>
                        <Text style={styles.transactionDescription}>{item.description}</Text>
                        <Text style={styles.transactionDate}>{formatDate(item.createdAt)}</Text>
                        {item.metadata?.from && item.metadata?.to && (
                            <Text style={styles.transactionRoute}>
                                {item.metadata.from} → {item.metadata.to}
                            </Text>
                        )}
                    </View>
                </View>
                <View style={styles.transactionRight}>
                    <Text style={[
                        styles.transactionAmount,
                        item.type === 'credit' ? styles.creditAmount : styles.debitAmount
                    ]}>
                        {item.type === 'credit' ? '+' : '-'}{formatAmount(item.amount)}
                    </Text>
                    <Text style={styles.balanceAfter}>
                        Balance: {formatAmount(item.balanceAfter)}
                    </Text>
                </View>
            </View>
            <View style={styles.statusBadge}>
                <Text style={[
                    styles.statusText,
                    item.status === 'completed' && styles.statusCompleted,
                    item.status === 'pending' && styles.statusPending,
                    item.status === 'failed' && styles.statusFailed
                ]}>
                    {item.status.toUpperCase()}
                </Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Transaction History</Text>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
                    onPress={() => setFilter('all')}
                >
                    <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
                        All
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'credit' && styles.filterTabActive]}
                    onPress={() => setFilter('credit')}
                >
                    <Text style={[styles.filterText, filter === 'credit' && styles.filterTextActive]}>
                        Credits
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'debit' && styles.filterTabActive]}
                    onPress={() => setFilter('debit')}
                >
                    <Text style={[styles.filterText, filter === 'debit' && styles.filterTextActive]}>
                        Debits
                    </Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={transactions}
                renderItem={renderTransaction}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>📭</Text>
                        <Text style={styles.emptyText}>No transactions found</Text>
                        <Text style={styles.emptySubtext}>Your transaction history will appear here</Text>
                    </View>
                }
                onEndReached={() => {
                    if (!loading) {
                        setPage(prev => prev + 1);
                        fetchTransactions(page + 1);
                    }
                }}
                onEndReachedThreshold={0.5}
            />
        </View>
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
    filterContainer: {
        flexDirection: 'row',
        padding: 15,
        backgroundColor: '#fff',
        gap: 10
    },
    filterTab: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 10,
        backgroundColor: '#f5f7fa',
        alignItems: 'center'
    },
    filterTabActive: {
        backgroundColor: theme.colors.primary
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666'
    },
    filterTextActive: {
        color: '#fff'
    },
    listContainer: {
        padding: 15,
        flexGrow: 1
    },
    transactionCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 15,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2
    },
    transactionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10
    },
    transactionLeft: {
        flexDirection: 'row',
        flex: 1
    },
    transactionIcon: {
        fontSize: 24,
        marginRight: 12
    },
    transactionInfo: {
        flex: 1
    },
    transactionDescription: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4
    },
    transactionDate: {
        fontSize: 12,
        color: '#999',
        marginBottom: 2
    },
    transactionRoute: {
        fontSize: 12,
        color: '#666',
        marginTop: 2
    },
    transactionRight: {
        alignItems: 'flex-end'
    },
    transactionAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4
    },
    creditAmount: {
        color: '#4CAF50'
    },
    debitAmount: {
        color: '#F44336'
    },
    balanceAfter: {
        fontSize: 11,
        color: '#999'
    },
    statusBadge: {
        alignSelf: 'flex-start'
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6
    },
    statusCompleted: {
        backgroundColor: '#E8F5E9',
        color: '#4CAF50'
    },
    statusPending: {
        backgroundColor: '#FFF9E6',
        color: '#FF9800'
    },
    statusFailed: {
        backgroundColor: '#FFEBEE',
        color: '#F44336'
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: 100
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999'
    }
});
