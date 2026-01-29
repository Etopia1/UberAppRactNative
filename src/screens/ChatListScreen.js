import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, TextInput } from 'react-native';
import { useSelector } from 'react-redux';
import { theme } from '../constants/theme';
import api from '../services/api';
import socketService from '../services/socket';
import Toast from 'react-native-toast-message';
import { getAvatarWithInitials } from '../utils/avatar';

export default function ChatListScreen({ navigation }) {
    const user = useSelector(state => state.auth.user);
    const [conversations, setConversations] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchConversations();

        // Join user's room is handled by AppNavigator/SocketService


        // Listen for new messages
        socketService.on('message_received', handleNewMessage);

        return () => {
            socketService.off('message_received', handleNewMessage);
        };
    }, []);

    const fetchConversations = async () => {
        try {
            const response = await api.get('/chat/conversations');
            setConversations(response.data.conversations);
        } catch (error) {
            console.error('Fetch conversations error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNewMessage = (message) => {
        // Update conversation list with new message
        setConversations(prev => {
            const updated = prev.map(conv => {
                if (conv._id === message.conversation) {
                    return {
                        ...conv,
                        lastMessage: message.content,
                        lastMessageTime: message.createdAt
                    };
                }
                return conv;
            });
            // Sort by most recent
            return updated.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
        });
    };

    const getOtherParticipant = (participants) => {
        const userId = user.id || user._id;
        return participants.find(p => p._id !== userId);
    };

    const formatTime = (date) => {
        const now = new Date();
        const messageDate = new Date(date);
        const diff = now - messageDate;
        const hours = Math.floor(diff / (1000 * 60 * 60));

        if (hours < 1) {
            const minutes = Math.floor(diff / (1000 * 60));
            return `${minutes}m ago`;
        } else if (hours < 24) {
            return `${hours}h ago`;
        } else {
            const days = Math.floor(hours / 24);
            return `${days}d ago`;
        }
    };

    const renderConversation = ({ item }) => {
        const otherUser = getOtherParticipant(item.participants);
        const userId = user.id || user._id;
        const unreadCount = item.unreadCount?.[userId] || 0;

        return (
            <TouchableOpacity
                style={styles.conversationItem}
                onPress={() => navigation.navigate('Chat', {
                    conversation: item,
                    otherUser: {
                        _id: otherUser._id,
                        name: otherUser.name,
                        profilePicture: otherUser.profilePicture || otherUser.avatar,
                        avatar: otherUser.avatar
                    }
                })}
            >
                <Image
                    source={{ uri: otherUser?.profilePicture || otherUser?.avatar || getAvatarWithInitials(otherUser?.name, 50) }}
                    style={styles.avatar}
                />
                <View style={styles.conversationContent}>
                    <View style={styles.conversationHeader}>
                        <Text style={styles.userName}>{otherUser?.name}</Text>
                        <Text style={styles.time}>{formatTime(item.lastMessageTime)}</Text>
                    </View>
                    <View style={styles.messageRow}>
                        <Text style={[styles.lastMessage, unreadCount > 0 && styles.unreadMessage]} numberOfLines={1}>
                            {item.lastMessage || 'Start a conversation'}
                        </Text>
                        {unreadCount > 0 && (
                            <View style={styles.unreadBadge}>
                                <Text style={styles.unreadText}>{unreadCount}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const filteredConversations = conversations.filter(conv => {
        const otherUser = getOtherParticipant(conv.participants);
        return otherUser?.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Messages</Text>
            </View>

            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#999"
                />
            </View>

            <FlatList
                data={filteredConversations}
                renderItem={renderConversation}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>💬</Text>
                        <Text style={styles.emptyTitle}>No messages yet</Text>
                        <Text style={styles.emptySubtitle}>Start chatting with other riders!</Text>
                    </View>
                }
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
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333'
    },
    searchContainer: {
        padding: 15,
        backgroundColor: '#fff'
    },
    searchInput: {
        backgroundColor: '#f5f7fa',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: '#333'
    },
    listContainer: {
        flexGrow: 1
    },
    conversationItem: {
        flexDirection: 'row',
        padding: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12
    },
    conversationContent: {
        flex: 1,
        justifyContent: 'center'
    },
    conversationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333'
    },
    time: {
        fontSize: 12,
        color: '#999'
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    lastMessage: {
        fontSize: 14,
        color: '#666',
        flex: 1
    },
    unreadMessage: {
        fontWeight: '600',
        color: '#333'
    },
    unreadBadge: {
        backgroundColor: theme.colors.primary,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
        marginLeft: 8
    },
    unreadText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold'
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100
    },
    emptyText: {
        fontSize: 64,
        marginBottom: 16
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#666'
    }
});
