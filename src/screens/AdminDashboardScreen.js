import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { useDispatch } from 'react-redux';
import api from '../services/api';
import { theme } from '../constants/theme';
import { logout } from '../redux/slices/authSlice';

export default function AdminDashboardScreen({ navigation }) {
    const [activeTab, setActiveTab] = useState('drivers'); // drivers | users | posts
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    useEffect(() => {
        fetchData();
    }, [activeTab]);

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

    // Driver Approval
    const approveDriver = async (userId, name) => {
        try {
            await api.post('/driver/approve', { userId });
            Alert.alert('Success', `Driver ${name} approved!`);
            fetchData();
        } catch (error) {
            Alert.alert('Error', 'Failed to approve driver');
        }
    };

    // User Ban/Unban
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
                            Alert.alert('Success', `User ${actionText}ned`);
                            fetchData();
                        } catch (error) {
                            Alert.alert('Error', `Failed to ${actionText.toLowerCase()} user`);
                        }
                    }
                }
            ]
        );
    };

    // Delete Post
    const deletePost = async (postId) => {
        Alert.alert(
            'Delete Post',
            'Are you sure you want to delete this post? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.post('/admin/delete-post', { postId });
                            fetchData(); // Refresh
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

    // --- Render Items ---

    const renderDriver = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.infoCol}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.subtext}>{item.driverId || 'No ID'}</Text>
                <Text style={[styles.status, { color: item.isDriverVerified ? theme.colors.success : theme.colors.warning }]}>
                    {item.isDriverVerified ? 'Verified' : 'Pending'}
                </Text>
            </View>
            {!item.isDriverVerified && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => approveDriver(item._id, item.name)}>
                    <Text style={styles.btnText}>Verify</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const renderUser = ({ item }) => (
        <View style={[styles.card, item.isBanned && styles.bannedCard]}>
            <View style={styles.infoCol}>
                <Text style={styles.name}>{item.name} {item.role === 'admin' ? '🛡️' : ''}</Text>
                <Text style={styles.subtext}>{item.email}</Text>
                <Text style={styles.role}>{item.role.toUpperCase()}</Text>
            </View>
            {item.role !== 'admin' && (
                <TouchableOpacity
                    style={[styles.actionBtn, item.isBanned ? styles.unbanBtn : styles.banBtn]}
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
                <Text style={styles.postUser}>{item.user?.name || 'Unknown User'}</Text>
                <Text style={styles.postDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
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
                <Text style={styles.title}>Admin Control 🛡️</Text>
                <TouchableOpacity onPress={handleLogout}>
                    <Text style={styles.logout}>Logout</Text>
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                {['drivers', 'users', 'posts'].map(tab => (
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
            </View>

            {loading ? (
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
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: 20,
        paddingTop: 50
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text
    },
    logout: {
        color: theme.colors.error,
        fontWeight: 'bold'
    },
    tabs: {
        flexDirection: 'row',
        marginBottom: 20,
        backgroundColor: theme.colors.inputBg,
        borderRadius: 10,
        padding: 5
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8
    },
    activeTab: {
        backgroundColor: theme.colors.primary
    },
    tabText: {
        color: theme.colors.textSecondary,
        fontWeight: 'bold'
    },
    activeTabText: {
        color: '#fff'
    },
    list: {
        paddingBottom: 20
    },
    card: {
        backgroundColor: theme.colors.surface,
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border
    },
    bannedCard: {
        opacity: 0.6,
        borderColor: theme.colors.error
    },
    infoCol: {
        flex: 1
    },
    name: {
        color: theme.colors.text,
        fontWeight: 'bold',
        fontSize: 16
    },
    subtext: {
        color: theme.colors.textSecondary,
        fontSize: 12
    },
    role: {
        fontSize: 10,
        color: theme.colors.primary,
        fontWeight: 'bold',
        marginTop: 2
    },
    status: {
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 2
    },
    actionBtn: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        marginLeft: 10
    },
    banBtn: {
        backgroundColor: theme.colors.error
    },
    unbanBtn: {
        backgroundColor: theme.colors.secondary
    },
    btnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12
    },
    // Post Styles
    postCard: {
        backgroundColor: '#222',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15
    },
    postHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10
    },
    postUser: {
        color: theme.colors.primary,
        fontWeight: 'bold'
    },
    postDate: {
        color: '#888',
        fontSize: 12
    },
    postContent: {
        color: '#fff',
        fontSize: 14,
        marginBottom: 10
    },
    postImage: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        marginBottom: 10
    },
    deleteBtn: {
        alignSelf: 'flex-end',
        padding: 5
    },
    deleteText: {
        color: theme.colors.error,
        fontWeight: 'bold',
        fontSize: 12
    },
    empty: {
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginTop: 20
    }
});
