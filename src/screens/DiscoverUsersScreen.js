import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { theme } from '../constants/theme';
import api from '../services/api';
import Toast from 'react-native-toast-message';
import { getAvatarWithInitials } from '../utils/avatar';

export default function DiscoverUsersScreen({ navigation }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async (searchQuery = '') => {
        try {
            setLoading(true);
            const response = await api.get('/social/users', {
                params: { search: searchQuery, limit: 50 }
            });
            setUsers(response.data.users);
        } catch (error) {
            console.error('Fetch users error:', error);
            Toast.show({ type: 'error', text1: 'Failed to load users' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleSearch = (text) => {
        setSearch(text);
        if (text.length > 2 || text.length === 0) {
            fetchUsers(text);
        }
    };

    const handleFollow = async (userId, isFollowing) => {
        try {
            await api.post(`/social/follow/${userId}`);

            // Update local state
            setUsers(users.map(user =>
                user._id === userId
                    ? { ...user, isFollowing: !isFollowing }
                    : user
            ));

            Toast.show({
                type: 'success',
                text1: isFollowing ? 'Unfollowed' : 'Following!',
                text2: isFollowing ? 'You unfollowed this user' : 'You are now following this user'
            });
        } catch (error) {
            console.error('Follow error:', error);
            Toast.show({ type: 'error', text1: 'Failed to follow user' });
        }
    };

    const handleMessage = async (user) => {
        try {
            // Try to create conversation
            const response = await api.post('/chat/conversations', {
                participantId: user._id
            });

            // Navigate to chat
            navigation.navigate('Chat', {
                conversation: response.data.conversation,
                otherUser: user
            });
        } catch (error) {
            console.error('Create conversation error:', error);

            // Check if it's a friendship requirement error
            if (error.response?.data?.requiresFriendship) {
                Toast.show({
                    type: 'error',
                    text1: 'Not Friends Yet',
                    text2: 'You both need to follow each other to chat'
                });
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Could not start conversation',
                    text2: error.response?.data?.message || 'Please try again'
                });
            }
        }
    };

    const renderUser = ({ item }) => (
        <TouchableOpacity
            style={styles.userCard}
            onPress={() => navigation.navigate('Profile', { userId: item._id })}
        >
            <Image
                source={{ uri: item.profilePicture || item.avatar || getAvatarWithInitials(item.name, 60) }}
                style={styles.avatar}
            />
            <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userBio} numberOfLines={1}>
                    {item.bio || item.email}
                </Text>
                <View style={styles.stats}>
                    <Text style={styles.statText}>
                        <Text style={styles.statNumber}>{item.followersCount || 0}</Text> followers
                    </Text>
                    <Text style={styles.statText}>
                        <Text style={styles.statNumber}>{item.followingCount || 0}</Text> following
                    </Text>
                </View>
            </View>
            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={[styles.followBtn, item.isFollowing && styles.followingBtn]}
                    onPress={() => handleFollow(item._id, item.isFollowing)}
                >
                    <Text style={[styles.followBtnText, item.isFollowing && styles.followingBtnText]}>
                        {item.isFollowing ? 'Following' : 'Follow'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.messageBtn}
                    onPress={() => handleMessage(item)}
                >
                    <Text style={styles.messageBtnText}>💬</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Discover People</Text>
                <Text style={styles.headerSubtitle}>Find friends to connect with</Text>
            </View>

            <View style={styles.searchContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name or email..."
                    value={search}
                    onChangeText={handleSearch}
                    placeholderTextColor="#999"
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => handleSearch('')}>
                        <Text style={styles.clearIcon}>✕</Text>
                    </TouchableOpacity>
                )}
            </View>

            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={styles.loadingText}>Finding people...</Text>
                </View>
            ) : (
                <FlatList
                    data={users}
                    renderItem={renderUser}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.list}
                    refreshing={refreshing}
                    onRefresh={() => {
                        setRefreshing(true);
                        fetchUsers(search);
                    }}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>👥</Text>
                            <Text style={styles.emptyText}>No users found</Text>
                            <Text style={styles.emptySubtext}>
                                {search ? 'Try a different search' : 'Start following people!'}
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa'
    },
    header: {
        backgroundColor: '#fff',
        padding: 20,
        paddingTop: 60,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0'
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666'
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        margin: 15,
        paddingHorizontal: 15,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#e0e0e0'
    },
    searchIcon: {
        fontSize: 18,
        marginRight: 10
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 15,
        color: '#333'
    },
    clearIcon: {
        fontSize: 18,
        color: '#999',
        padding: 5
    },
    list: {
        padding: 15,
        paddingTop: 0
    },
    userCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 15,
        marginBottom: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 12
    },
    userInfo: {
        flex: 1
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4
    },
    userBio: {
        fontSize: 13,
        color: '#666',
        marginBottom: 6
    },
    stats: {
        flexDirection: 'row',
        gap: 15
    },
    statText: {
        fontSize: 12,
        color: '#999'
    },
    statNumber: {
        fontWeight: '600',
        color: '#333'
    },
    followBtn: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20
    },
    followingBtn: {
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#e0e0e0'
    },
    followBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600'
    },
    followingBtnText: {
        color: '#666'
    },
    actionButtons: {
        flexDirection: 'column',
        gap: 8
    },
    messageBtn: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        alignItems: 'center'
    },
    messageBtnText: {
        fontSize: 18
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    loadingText: {
        marginTop: 10,
        fontSize: 14,
        color: '#999'
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 60
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 15
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999'
    }
});
