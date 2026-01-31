import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image, ScrollView, Dimensions, Platform } from 'react-native';
import { useDispatch } from 'react-redux';
import api from '../services/api';
import { theme } from '../constants/theme';
import { logout } from '../redux/slices/authSlice';
import { LineChart, BarChart } from 'react-native-chart-kit';
import Toast from 'react-native-toast-message';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isWeb = Platform.OS === 'web' || screenWidth > 768;

export default function AdminDashboardScreen({ navigation }) {
    const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | drivers | users | posts
    const [stats, setStats] = useState({
        users: 0, drivers: 0, posts: 0,
        rides: 0, flights: 0, revenue: 0,
        topUser: null,
        revenueChart: { labels: [], data: [0] }
    });
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    useEffect(() => {
        if (activeTab === 'dashboard') fetchStats();
        else fetchData();
    }, [activeTab]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const [usersRes, driversRes, postsRes, advStatsRes] = await Promise.all([
                api.get('/admin/users'),
                api.get('/driver/all'),
                api.get('/admin/posts'),
                api.get('/admin/stats')
            ]);

            const adv = advStatsRes.data.stats;
            setStats({
                users: usersRes.data.users?.length || 0,
                drivers: driversRes.data.drivers?.length || 0,
                posts: postsRes.data.posts?.length || 0,
                rides: adv.totalRides || 0,
                flights: adv.totalFlights || 0,
                revenue: adv.totalRevenue || 0,
                topUser: adv.topUser,
                revenueChart: adv.revenueChart || { labels: ["No Data"], data: [0] }
            });
        } catch (error) {
            console.error('Stats Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            let response;
            if (activeTab === 'drivers') response = await api.get('/driver/all');
            else if (activeTab === 'users') response = await api.get('/admin/users');
            else if (activeTab === 'posts') response = await api.get('/admin/posts');

            setData(response?.data?.drivers || response?.data?.users || response?.data?.posts || []);
        } catch (error) {
            console.error(error);
            Toast.show({ type: 'error', text1: 'Data Error', text2: 'Failed to fetch dashboard data.' });
        } finally {
            setLoading(false);
        }
    };

    // --- Actions ---
    const approveDriver = async (userId, name) => {
        try {
            await api.post('/driver/approve', { userId });
            Toast.show({ type: 'success', text1: 'Driver Approved', text2: `${name} is now verified!` });
            fetchData();
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Approval Failed', text2: 'Could not approve driver.' });
        }
    };

    const toggleBanUser = async (user) => {
        const action = user.isBanned ? 'unban-user' : 'ban-user';
        // Direct action without blocking Alert (User preference)
        try {
            await api.post(`/admin/${action}`, { userId: user._id });
            Toast.show({
                type: 'success',
                text1: `User ${user.isBanned ? 'Unbanned' : 'Banned'}`,
                text2: `${user.name} has been updated.`
            });
            fetchData();
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Action Failed', text2: 'Could not update user status.' });
        }
    };

    const deletePost = async (postId) => {
        try {
            await api.post('/admin/delete-post', { postId });
            // User requested NO ALERT. Just refresh.
            // Toast.show({ type: 'success', text1: 'Deleted' }); // Optional but "no alert" usually means silent or toast.
            fetchData();
        } catch (error) { console.error('Delete failed:', error); }
    };

    const handleLogout = () => dispatch(logout());

    // --- Components ---
    const UserAvatar = ({ uri, name, size = 50, style }) => {
        const [imageError, setImageError] = useState(false);

        if (uri && !imageError) {
            return (
                <Image
                    source={{ uri }}
                    style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#eee' }, style]}
                    onError={() => setImageError(true)}
                />
            );
        }

        // Fallback Letter Avatar
        const initial = name ? name.charAt(0).toUpperCase() : '?';
        const colors = ['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#009688', '#FF9800', '#607D8B', '#795548'];
        let hash = 0;
        if (name) {
            for (let i = 0; i < name.length; i++) {
                hash = name.charCodeAt(i) + ((hash << 5) - hash);
            }
        }
        const color = colors[Math.abs(hash) % colors.length];

        return (
            <View style={[{
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: color,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#fff'
            }, style]}>
                <Text style={{ color: '#fff', fontSize: size * 0.45, fontWeight: 'bold' }}>{initial}</Text>
            </View>
        );
    };
    const SidebarItem = ({ icon, label, tab }) => (
        <TouchableOpacity
            style={[styles.sidebarItem, activeTab === tab && styles.activeSidebarItem]}
            onPress={() => setActiveTab(tab)}
        >
            <Text style={[styles.sidebarText, activeTab === tab && styles.activeSidebarText]}>{icon}  {label}</Text>
        </TouchableOpacity>
    );

    const StatCard = ({ title, value, icon, color }) => (
        <View style={[styles.statCard, { borderLeftColor: color }]}>
            <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
                <Text style={{ fontSize: 24 }}>{icon}</Text>
            </View>
            <View>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statTitle}>{title}</Text>
            </View>
        </View>
    );

    const renderDashboard = () => (
        <ScrollView contentContainerStyle={styles.dashboardContent}>
            <Text style={styles.pageTitle}>Dashboard Overview</Text>

            <View style={styles.statsGrid}>
                <StatCard title="Total Revenue" value={`$${stats.revenue.toLocaleString()}`} icon="💰" color="#4CAF50" />
                <StatCard title="Total Users" value={stats.users} icon="👥" color="#2196F3" />
                <StatCard title="Total Rides" value={stats.rides} icon="🚗" color="#FF9800" />
                <StatCard title="Total Flights" value={stats.flights} icon="✈️" color="#00BCD4" />
            </View>

            <View style={styles.chartSection}>
                <Text style={styles.sectionTitle}>Revenue Trends (6 Months) 📈</Text>
                <LineChart
                    data={{
                        labels: stats.revenueChart.labels,
                        datasets: [{ data: stats.revenueChart.data }]
                    }}
                    width={isWeb ? screenWidth - 300 : screenWidth - 40}
                    height={250}
                    yAxisLabel="$"
                    chartConfig={{
                        backgroundColor: "#fff",
                        backgroundGradientFrom: "#fff",
                        backgroundGradientTo: "#fff",
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                        style: { borderRadius: 16 },
                        propsForDots: { r: "5", strokeWidth: "2", stroke: "#2196F3" }
                    }}
                    bezier
                    style={styles.chart}
                />
            </View>

            {stats.topUser && (
                <View style={styles.topUserCard}>
                    <View style={styles.crownBadge}><Text style={{ fontSize: 20 }}>👑</Text></View>
                    <Text style={styles.sectionTitle}>User of the Month</Text>
                    <View style={styles.topUserRow}>
                        <UserAvatar uri={stats.topUser.avatar} name={stats.topUser.name} size={80} style={styles.topUserAvatar} />
                        <View>
                            <Text style={styles.topUserName}>{stats.topUser.name}</Text>
                            <Text style={styles.topUserDetail}>{stats.topUser.email}</Text>
                            <View style={styles.badgeRow}>
                                <View style={styles.statBadge}><Text style={styles.badgeText}>🚗 {stats.topUser.rideCount} Rides</Text></View>
                                <View style={[styles.statBadge, { backgroundColor: '#E8F5E9' }]}><Text style={[styles.badgeText, { color: '#2E7D32' }]}>💸 ${stats.topUser.totalSpent.toLocaleString()}</Text></View>
                            </View>
                        </View>
                    </View>
                </View>
            )}
        </ScrollView>
    );

    const renderList = () => (
        <FlatList
            data={data}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
                <TouchableOpacity style={styles.listItem} onPress={() => activeTab !== 'posts' && navigation.navigate('UserDetails', { user: item })}>
                    <UserAvatar
                        uri={item.avatar || item.author?.avatar}
                        name={item.name || item.author?.name}
                        size={50}
                        style={{ marginRight: 15 }}
                    />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.listName}>{item.name || item.author?.name}</Text>
                        <Text style={styles.listSub}>{item.email || new Date(item.createdAt).toLocaleDateString()}</Text>
                        {activeTab === 'posts' && <Text numberOfLines={2} style={styles.postPreview}>{item.content}</Text>}
                    </View>
                    {activeTab === 'drivers' && !item.isDriverVerified && (
                        <TouchableOpacity style={styles.approveBtn} onPress={() => approveDriver(item._id, item.name)}>
                            <Text style={styles.btnText}>Approve</Text>
                        </TouchableOpacity>
                    )}
                    {activeTab === 'posts' && (
                        <TouchableOpacity style={styles.iconBtn} onPress={() => deletePost(item._id)}>
                            <Text style={{ fontSize: 20, color: '#888' }}>⋮</Text>
                        </TouchableOpacity>
                    )}
                </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>No data found.</Text>}
        />
    );

    return (
        <View style={styles.container}>
            {/* Sidebar (Visible on Web/Tablet) */}
            {isWeb && (
                <View style={styles.sidebar}>
                    <View style={styles.logoArea}>
                        <Text style={styles.logoText}>Driven Admin</Text>
                    </View>
                    <SidebarItem icon="📊" label="Dashboard" tab="dashboard" />
                    <SidebarItem icon="👥" label="Users" tab="users" />
                    <SidebarItem icon="🚗" label="Drivers" tab="drivers" />
                    <SidebarItem icon="📝" label="Posts" tab="posts" />

                    <TouchableOpacity style={styles.sidebarLogout} onPress={handleLogout}>
                        <Text style={styles.sidebarLogoutText}>🚪 Logout</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Main Content */}
            <View style={styles.mainArea}>
                {/* Mobile Header (Only visible on small screens) */}
                {!isWeb && (
                    <View style={styles.mobileHeader}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                            <Text style={[styles.mobileTitle, { marginBottom: 0 }]}>Driven Admin</Text>
                            <TouchableOpacity onPress={handleLogout} style={{ padding: 5 }}>
                                <Text style={{ fontSize: 24 }}>🚪</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mobileNav}>
                            {['dashboard', 'users', 'drivers', 'posts'].map(t => (
                                <TouchableOpacity key={t} onPress={() => setActiveTab(t)} style={[styles.mobileTab, activeTab === t && styles.activeMobileTab]}>
                                    <Text style={[styles.mobileTabText, activeTab === t && styles.activeMobileTabText]}>{t.toUpperCase()}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {loading ? (
                    <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 50 }} />
                ) : (
                    activeTab === 'dashboard' ? renderDashboard() : renderList()
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, flexDirection: 'row', backgroundColor: '#F4F7FE' },
    sidebar: { width: 250, backgroundColor: '#fff', paddingVertical: 30, paddingHorizontal: 20, borderRightWidth: 1, borderRightColor: '#eee' },
    logoArea: { marginBottom: 40, paddingLeft: 10 },
    logoText: { fontSize: 24, fontWeight: 'bold', color: theme.colors.primary },
    sidebarItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 15, borderRadius: 12, marginBottom: 5 },
    activeSidebarItem: { backgroundColor: theme.colors.primary },
    sidebarText: { fontSize: 16, color: '#666', fontWeight: '600' },
    activeSidebarText: { color: '#fff' },
    sidebarLogout: { marginTop: 'auto', padding: 15 },
    sidebarLogoutText: { color: 'red', fontWeight: 'bold' },

    mainArea: { flex: 1, padding: isWeb ? 30 : 10 },
    dashboardContent: { paddingBottom: 50 },
    pageTitle: { fontSize: 28, fontWeight: 'bold', color: '#1B2559', marginBottom: 25 },

    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 30 },
    statCard: { width: isWeb ? '23%' : '48%', backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 15, borderLeftWidth: 5, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    iconBox: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    statValue: { fontSize: 24, fontWeight: 'bold', color: '#1B2559' },
    statTitle: { fontSize: 14, color: '#A3AED0' },

    chartSection: { backgroundColor: '#fff', padding: 20, borderRadius: 20, marginBottom: 30, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1B2559', marginBottom: 20 },
    chart: { borderRadius: 16, marginVertical: 8 },

    topUserCard: { backgroundColor: '#fff', padding: 25, borderRadius: 20, position: 'relative', overflow: 'hidden', borderWidth: 1, borderColor: '#FFD700', shadowColor: "#FFD700", shadowOpacity: 0.2, shadowRadius: 10 },
    crownBadge: { position: 'absolute', top: -10, right: -10, width: 60, height: 60, backgroundColor: '#FFF9C4', borderRadius: 30, justifyContent: 'center', alignItems: 'center', opacity: 0.5 },
    topUserRow: { flexDirection: 'row', alignItems: 'center' },
    topUserAvatar: { marginRight: 20, borderWidth: 3, borderColor: '#FFD700' },
    topUserName: { fontSize: 22, fontWeight: 'bold', color: '#1B2559' },
    topUserDetail: { fontSize: 14, color: '#A3AED0', marginBottom: 10 },
    badgeRow: { flexDirection: 'row' },
    statBadge: { backgroundColor: '#E3F2FD', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 10 },
    badgeText: { fontWeight: 'bold', color: '#1565C0', fontSize: 12 },

    // List Styles
    listContent: { paddingBottom: 50 },
    listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 16, marginBottom: 10, shadowOpacity: 0.05, shadowRadius: 5 },
    // listAvatar removed as it's passed inline
    listName: { fontSize: 16, fontWeight: 'bold', color: '#1B2559' },
    listSub: { fontSize: 12, color: '#A3AED0' },
    postPreview: { fontSize: 13, color: '#555', marginTop: 4 },
    approveBtn: { backgroundColor: theme.colors.primary, paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8 },
    deleteBtn: { backgroundColor: '#EF5350', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8 },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
    emptyText: { textAlign: 'center', marginTop: 50, color: '#999' },

    // Mobile Only
    mobileHeader: { marginBottom: 20 },
    mobileTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 15, color: '#1B2559' },
    mobileNav: { flexDirection: 'row', marginBottom: 10 },
    mobileTab: { marginRight: 10, paddingVertical: 8, paddingHorizontal: 20, backgroundColor: '#fff', borderRadius: 20 },
    activeMobileTab: { backgroundColor: '#1B2559' },
    mobileTabText: { fontWeight: '600', color: '#999' },
    activeMobileTabText: { color: '#fff' }
});
