import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, RefreshControl, Alert, Platform, Dimensions } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useSelector } from 'react-redux';
import { theme } from '../constants/theme';
import api from '../services/api';
import Toast from 'react-native-toast-message';
import { getAvatarWithInitials } from '../utils/avatar';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function SocialFeedScreen({ navigation }) {
    const user = useSelector(state => state.auth.user);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);

    useEffect(() => {
        fetchFeed();
    }, []);

    const fetchFeed = async (pageNum = 1) => {
        try {
            setLoading(true);
            const response = await api.get(`/social/feed?page=${pageNum}&limit=10`);
            if (pageNum === 1) {
                setPosts(response.data.posts);
            } else {
                setPosts(prev => [...prev, ...response.data.posts]);
            }
        } catch (error) {
            console.error('Fetch feed error:', error);
            Toast.show({ type: 'error', text1: 'Failed to load feed' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        setPage(1);
        fetchFeed(1);
    };

    const handleLike = async (postId) => {
        try {
            const response = await api.post(`/social/posts/${postId}/like`);

            // Update local state
            setPosts(prev => prev.map(post => {
                if (post._id === postId) {
                    const userId = user.id || user._id;
                    const liked = response.data.liked;
                    return {
                        ...post,
                        likes: liked
                            ? [...post.likes, userId]
                            : post.likes.filter(id => id !== userId),
                        likeCount: response.data.likeCount
                    };
                }
                return post;
            }));
        } catch (error) {
            console.error('Like error:', error);
        }
    };

    const handleDeletePost = async (postId) => {
        try {
            await api.delete(`/social/posts/${postId}`);
            setPosts(prev => prev.filter(p => p._id !== postId));
            Toast.show({ type: 'success', text1: 'Post deleted' });
        } catch (error) {
            console.error('Delete post error:', error);
            Toast.show({ type: 'error', text1: 'Failed to delete post' });
        }
    };

    const handlePostOptions = (post) => {
        const currentUserId = user.id || user._id;
        const postAuthorId = post.author._id || post.author.id || post.author;
        const isMyPost = String(postAuthorId).toString() === String(currentUserId).toString();

        if (isMyPost) {
            // Direct Delete (User requested no alerts)
            handleDeletePost(post._id);
        } else {
            // Direct Report
            Toast.show({ type: 'success', text1: 'Reported', text2: 'Thanks for your feedback.' });
        }
    };

    const handleShare = async (post) => {
        // Direct Share
        try {
            const response = await api.post('/social/posts', {
                content: '',
                sharedPost: post._id
            });
            Toast.show({ type: 'success', text1: 'Post shared to your feed!' });
            // Optimistic update
            setPosts(prev => prev.map(p => {
                if (p._id === post._id) {
                    return { ...p, shares: (p.shares || 0) + 1 };
                }
                return p;
            }));
        } catch (error) {
            console.error('Share error:', error);
            Toast.show({ type: 'error', text1: 'Failed to share post' });
        }
    };

    const renderPost = ({ item }) => {
        const userId = user.id || user._id;
        const isLiked = item.likes.includes(userId);

        return (
            <View style={styles.postContainer}>
                {/* Post Header */}
                <View style={styles.postHeader}>
                    <TouchableOpacity
                        style={styles.userInfo}
                        onPress={() => navigation.navigate('Profile', { userId: item.author._id })}
                    >
                        <View style={styles.avatarContainer}>
                            <Image
                                source={{ uri: item.author.profilePicture || item.author.avatar || getAvatarWithInitials(item.author.name, 40) }}
                                style={styles.authorAvatar}
                            />
                        </View>
                        <Text style={styles.authorName}>{item.author.name}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.optionsButton} onPress={() => handlePostOptions(item)}>
                        <Text style={styles.optionsIcon}>•••</Text>
                    </TouchableOpacity>
                </View>

                {/* Post Content Media (Images/Videos) */}
                {item.videos && item.videos.length > 0 ? (
                    <View style={styles.mediaContainer}>
                        <Video
                            style={styles.mediaPlayer}
                            source={{ uri: item.videos[0] }}
                            useNativeControls
                            resizeMode={ResizeMode.COVER}
                            isLooping={false}
                        />
                    </View>
                ) : item.images && item.images.length > 0 ? (
                    item.images.length > 1 ? (
                        <View>
                            <FlatList
                                data={item.images}
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                keyExtractor={(img, index) => index.toString()}
                                renderItem={({ item: imgUri }) => (
                                    <Image
                                        source={{ uri: imgUri }}
                                        style={[styles.postMedia, { width: width }]}
                                        resizeMode="cover"
                                    />
                                )}
                            />
                            {/* Pagination Dots (Optional, simple implementation) */}
                            <View style={styles.paginationContainer}>
                                {item.images.map((_, i) => (
                                    <View key={i} style={[styles.paginationDot, { backgroundColor: '#fff', opacity: 0.8 }]} />
                                ))}
                            </View>
                            <View style={styles.galleryIconOverlay}>
                                <Ionicons name="images" size={20} color="#fff" />
                            </View>
                        </View>
                    ) : (
                        <Image
                            source={{ uri: item.images[0] }}
                            style={styles.postMedia}
                            resizeMode="cover"
                        />
                    )
                ) : null}

                {/* Post Actions & Text Content */}
                <View style={styles.postFooter}>
                    {/* Action Icons Row */}
                    <View style={styles.actionRow}>
                        <View style={styles.leftActions}>
                            <TouchableOpacity style={styles.iconButton} onPress={() => handleLike(item._id)}>
                                <Text style={[styles.actionIcon, isLiked && styles.likedIcon]}>
                                    {isLiked ? '❤️' : '🤍'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('PostDetail', { post: item })}>
                                <Text style={styles.actionIcon}>💬</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.iconButton} onPress={() => handleShare(item)}>
                                <Text style={styles.actionIcon}>✈️</Text>
                            </TouchableOpacity>
                        </View>
                        {/* Bookmark/Save Icon could go here */}
                    </View>

                    {/* Like Count */}
                    <Text style={styles.likesText}>
                        {item.likeCount || item.likes.length} likes
                    </Text>

                    {/* Caption / Content */}
                    <View style={styles.captionContainer}>
                        <Text style={styles.captionName}>{item.author.name}</Text>
                        <Text style={styles.captionText}>
                            {item.content || (item.background && item.content)}
                        </Text>
                    </View>

                    {/* Ride Details (if any) - Styled minimally */}
                    {item.rideDetails && (
                        <View style={styles.miniRidePreview}>
                            <Text style={styles.rideRouteText}>
                                🚗 Trip: {item.rideDetails.from} → {item.rideDetails.to}
                            </Text>
                        </View>
                    )}

                    {/* Time */}
                    <Text style={styles.timestamp}>{formatTime(item.createdAt)}</Text>
                </View>
            </View>
        );
    };

    const formatTime = (date) => {
        const now = new Date();
        const postDate = new Date(date);
        const diff = now - postDate;
        const hours = Math.floor(diff / (1000 * 60 * 60));

        if (hours < 1) {
            const minutes = Math.floor(diff / (1000 * 60));
            return `${minutes}m ago`;
        } else if (hours < 24) {
            return `${hours}h ago`;
        } else {
            const days = Math.floor(hours / 24);
            return `${days} days ago`;
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerLogo}>Social</Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('CreatePost')}
                >
                    <Image
                        source={{ uri: 'https://img.icons8.com/ios/50/000000/plus-math.png' }}
                        style={styles.headerPlusIcon}
                    />
                </TouchableOpacity>
            </View>

            <FlatList
                data={posts}
                renderItem={renderPost}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.feedList}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyTitle}>No posts yet</Text>
                        <Text style={styles.emptySubtitle}>Follow users to see their updates.</Text>
                    </View>
                }
                onEndReached={() => {
                    if (!loading) {
                        setPage(prev => prev + 1);
                        fetchFeed(page + 1);
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
        backgroundColor: '#fff' // Clean white background
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: 50,
        paddingBottom: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#efefef'
    },
    headerLogo: {
        fontSize: 24,
        fontWeight: 'bold', // Similar to generic app logo text
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto'
    },
    headerPlusIcon: {
        width: 24,
        height: 24,
        resizeMode: 'contain'
    },
    feedList: {
        paddingBottom: 20
    },
    postContainer: {
        marginBottom: 15
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 10
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    avatarContainer: {
        padding: 2, // Ring gap
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#C13584', // Gradient-like border color (Instagram purple/pink)
        marginRight: 10
    },
    authorAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16
    },
    authorName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#262626'
    },
    optionsIcon: {
        fontSize: 20,
        color: '#262626',
        fontWeight: 'bold'
    },
    postMedia: {
        width: '100%',
        height: 400, // Instagram square/portrait ratio
        backgroundColor: '#f0f0f0'
    },
    mediaContainer: {
        width: '100%',
        height: 400,
        backgroundColor: '#000'
    },
    mediaPlayer: {
        width: '100%',
        height: '100%'
    },
    postFooter: {
        paddingHorizontal: 12,
        paddingVertical: 10
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    leftActions: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    iconButton: {
        marginRight: 16
    },
    actionIcon: {
        fontSize: 24,
        color: '#262626'
    },
    likedIcon: {
        color: '#ED4956' // Instagram red
    },
    likesText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#262626',
        marginBottom: 6
    },
    captionContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 4
    },
    captionName: {
        fontSize: 14,
        fontWeight: '700',
        marginRight: 6,
        color: '#262626'
    },
    captionText: {
        fontSize: 14,
        color: '#262626',
        lineHeight: 18
    },
    timestamp: {
        fontSize: 10,
        color: '#8e8e8e',
        marginTop: 4,
        textTransform: 'uppercase'
    },
    miniRidePreview: {
        backgroundColor: '#fafafa',
        padding: 8,
        borderRadius: 6,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: '#efefef'
    },
    rideRouteText: {
        fontSize: 12,
        color: '#666'
    },
    emptyContainer: {
        flex: 1,
        borderRadius: 18,
        marginBottom: 15,
        overflow: 'hidden'
    },
    videoPlayer: { width: '100%', height: '100%' },
    // New Styles
    backgroundPost: {
        height: 220,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 18,
        marginBottom: 15,
        padding: 24,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6
    },
    backgroundText: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4
    },
    paginationContainer: {
        position: 'absolute',
        bottom: 10,
        alignSelf: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    },
    paginationDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginHorizontal: 3
    },
    galleryIconOverlay: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 6,
        borderRadius: 8
    }
});
