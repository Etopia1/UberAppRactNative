import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image, ScrollView, Dimensions } from 'react-native';
import { useDispatch } from 'react-redux';
import api from '../services/api';
import { theme } from '../constants/theme';
import { logout } from '../redux/slices/authSlice';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function AdminDashboardScreen({ navigation }) {
    const [activeTab, setActiveTab] = useState('stats'); // stats | drivers | users | posts
    const [stats, setStats] = useState({ users: 0, drivers: 0, posts: 0 });
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    useEffect(() => {
        fetchData();
        if (activeTab === 'stats') fetchStats();
    }, [activeTab]);

    const fetchStats = async () => {
        try {
            const [usersRes, driversRes, postsRes] = await Promise.all([
                api.get('/admin/users'),
                api.get('/driver/all'),
                api.get('/admin/posts')
            ]);
            setStats({
                users: usersRes.data.users?.length || 0,
                drivers: driversRes.data.drivers?.length || 0,
                posts: postsRes.data.posts?.length || 0
            });
        } catch (error) {
            console.error('Stats Error:', error);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            let response;
            if (activeTab === 'drivers') {
                response = await api.get('/driver/all');
                setData(response.data.drivers || []);
            } else if (activeTab === 'users') {
                response = await api.get('/admin/users');
                setData(response.data.users || []);
            } else if (activeTab === 'posts') {
                response = await api.get('/admin/posts');
                setData(response.data.posts || []);
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    // --- Actions ---

    const approveDriver = async (userId, name) => {
        try {
            await api.post('/driver/approve', { userId });
            Alert.alert('Success', `Driver ${name} approved!`);
            fetchData();
        } catch (error) {
            Alert.alert('Error', 'Failed to approve driver');
        }
    };

    const toggleBanUser = async (user) => {
        const action = user.isBanned ? 'unban-user' : 'ban-user';
        const actionText = user.isBanned ? 'Unban' : 'Ban';

        Alert.alert(
            `Confirm ${actionText}`,
            `Are you sure you want to ${actionText.toLowerCase()} ${user.name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: actionText,
                    style: user.isBanned ? 'default' : 'destructive',
                    onPress: async () => {
                        try {
                            await api.post(`/admin/${action}`, { userId: user._id });
                            fetchData();
                        } catch (error) {
                            Alert.alert('Error', `Failed to ${actionText.toLowerCase()} user`);
                        }
                    }
                }
            ]
        );
    };

    const deletePost = async (postId) => {
        Alert.alert(
            'Delete Post',
            'Delete this post permanently?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.post('/admin/delete-post', { postId });
                            fetchData();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete post');
                        }
                    }
                }
            ]
        );
    };

    const handleLogout = () => {
        dispatch(logout());
    };

    // --- Components ---

    const StatCard = ({ title, value, color, icon }) => (
        <View style={[styles.statCard, { borderLeftColor: color }]}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statTitle}>{title}</Text>
        </View>
    );

    const renderChart = () => (
        <View style={styles.chartContainer}>
            <Text style={styles.sectionTitle}>User Growth 📈</Text>
            <LineChart
                data={{
                    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                    datasets: [
                        {
                            data: [
                                Math.random() * 100,
                                Math.random() * 100,
                                Math.random() * 100,
                                Math.random() * 100,
                                Math.random() * 100,
                                Math.random() * 100
                            ]
                        }
                    ]
                }}
                width={screenWidth - 40} // from react-native
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                yAxisInterval={1} // optional, defaults to 1
                chartConfig={{
                    backgroundColor: theme.colors.surface,
                    backgroundGradientFrom: theme.colors.surface,
                    backgroundGradientTo: theme.colors.surface,
                    decimalPlaces: 0, // optional, defaults to 2dp
                    color: (opacity = 1) => `rgba(0, 200, 83, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    style: {
                        borderRadius: 16
                    },
                    propsForDots: {
                        r: "6",
                        strokeWidth: "2",
                        stroke: "#ffa726"
                    }
                }}
                bezier
                style={{
                    marginVertical: 8,
                    borderRadius: 16
                }}
            />
        </View>
    );

    const renderDriver = ({ item }) => (
        <View style={styles.card}>
            <Image source={{ uri: item.avatar || 'https://i.pravatar.cc/300' }} style={styles.avatar} />
            <View style={styles.infoCol}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.subtext}>{item.email}</Text>
                <Text style={styles.idBadge}>{item.driverId || 'No ID'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.statusBadge, { backgroundColor: item.isDriverVerified ? theme.colors.success + '20' : theme.colors.warning + '20', color: item.isDriverVerified ? theme.colors.success : theme.colors.warning }]}>
                    {item.isDriverVerified ? 'Verified' : 'Pending'}
                </Text>
                {!item.isDriverVerified && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => approveDriver(item._id, item.name)}>
                        <Text style={styles.btnText}>Approve</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    const renderUser = ({ item }) => (
        <View style={[styles.card, item.isBanned && styles.bannedCard]}>
            <Image source={{ uri: item.avatar || 'https://i.pravatar.cc/300' }} style={styles.avatar} />
            <View style={styles.infoCol}>
                <Text style={styles.name}>{item.name} {item.role === 'admin' && '🛡️'}</Text>
                <Text style={styles.subtext}>{item.email}</Text>
                <Text style={[styles.roleBadge, { backgroundColor: item.role === 'driver' ? '#E3F2FD' : '#F3E5F5', color: item.role === 'driver' ? '#1976D2' : '#7B1FA2' }]}>
                    {item.role.toUpperCase()}
                </Text>
            </View>
            {item.role !== 'admin' && (
                <TouchableOpacity
                    style={[styles.smallActionBtn, item.isBanned ? styles.unbanBtn : styles.banBtn]}
                    onPress={() => toggleBanUser(item)}
                >
                    <Text style={styles.btnText}>{item.isBanned ? 'Unban' : 'Ban'}</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const renderPost = ({ item }) => (
        <View style={styles.postCard}>
            <View style={styles.postHeader}>
                <Image source={{ uri: item.author?.avatar || 'https://i.pravatar.cc/300' }} style={styles.postAvatar} />
                <View>
                    <Text style={styles.postUser}>{item.author?.name || 'Unknown User'}</Text>
                    <Text style={styles.postDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
            </View>
            <Text style={styles.postContent}>{item.content}</Text>
            {item.imageUrl && (
                <Image source={{ uri: item.imageUrl }} style={styles.postImage} />
            )}
            <TouchableOpacity style={styles.deleteBtn} onPress={() => deletePost(item._id)}>
                <Text style={styles.deleteText}>Delete Post 🗑️</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Admin Panel</Text>
                    <Text style={styles.subtitle}>Welcome back, Boss 👋</Text>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {['stats', 'drivers', 'users', 'posts'].map(tab => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, activeTab === tab && styles.activeTab]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {activeTab === 'stats' && !loading ? (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.statsRow}>
                        <StatCard title="Total Users" value={stats.users} color="#2196F3" />
                        <StatCard title="Drivers" value={stats.drivers} color="#FF9800" />
                        <StatCard title="Posts" value={stats.posts} color="#9C27B0" />
                    </View>
                    {renderChart()}
                </ScrollView>
            ) : null}

            {activeTab !== 'stats' && (
                loading ? (
                    <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 50 }} />
                ) : (
                    <FlatList
                        data={data}
                        keyExtractor={item => item._id}
                        renderItem={
                            activeTab === 'drivers' ? renderDriver :
                                activeTab === 'users' ? renderUser : renderPost
                        }
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={<Text style={styles.empty}>No {activeTab} found.</Text>}
                    />
                )
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA', // Light grey-blue bg
    },
    header: {
        backgroundColor: '#fff',
        padding: 20,
        paddingTop: 50,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#333'
    },
    subtitle: {
        color: '#666',
        fontSize: 14
    },
    logoutBtn: {
        padding: 8,
        backgroundColor: '#FFEBEE',
        borderRadius: 8
    },
    logoutText: {
        color: '#D32F2F',
        fontWeight: 'bold',
        fontSize: 12
    },
    tabContainer: {
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        height: 60
    },
    tab: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
        marginRight: 10,
        backgroundColor: '#F5F5F5'
    },
    activeTab: {
        backgroundColor: '#333'
    },
    tabText: {
        fontWeight: '600',
        color: '#666'
    },
    activeTabText: {
        color: '#fff'
    },
    scrollContent: {
        padding: 20
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginHorizontal: 5,
        borderLeftWidth: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333'
    },
    statTitle: {
        fontSize: 12,
        color: '#888',
        marginTop: 5
    },
    chartContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 15,
        marginTop: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333'
    },
    list: {
        padding: 20
    },
    card: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2
    },
    bannedCard: {
        backgroundColor: '#FFEBEE',
        opacity: 0.7
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
        backgroundColor: '#eee'
    },
    infoCol: {
        flex: 1
    },
    name: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333'
    },
    subtext: {
        fontSize: 12,
        color: '#888',
        marginTop: 2
    },
    idBadge: {
        fontSize: 10,
        color: '#666',
        marginTop: 2,
        fontFamily: 'monospace'
    },
    statusBadge: {
        fontSize: 10,
        fontWeight: 'bold',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 5
    },
    roleBadge: {
        alignSelf: 'flex-start',
        fontSize: 10,
        fontWeight: 'bold',
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: 4,
        overflow: 'hidden',
        marginTop: 4
    },
    actionBtn: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8
    },
    smallActionBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8
    },
    banBtn: {
        backgroundColor: '#D32F2F'
    },
    unbanBtn: {
        backgroundColor: '#388E3C'
    },
    btnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12
    },
    // Post Styles
    postCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 15,
        padding: 15,
        borderWidth: 1,
        borderColor: '#eee'
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10
    },
    postAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10
    },
    postUser: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#333'
    },
    postDate: {
        fontSize: 12,
        color: '#999'
    },
    postContent: {
        fontSize: 14,
        color: '#444',
        marginBottom: 10,
        lineHeight: 20
    },
    postImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 10
    },
    deleteBtn: {
        alignSelf: 'flex-end',
        paddingVertical: 5
    },
    deleteText: {
        color: '#D32F2F',
        fontWeight: 'bold',
        fontSize: 12
    },
    empty: {
        textAlign: 'center',
        marginTop: 30,
        color: '#888'
    }
});
