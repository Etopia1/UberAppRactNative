import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
    TextInput, KeyboardAvoidingView, Platform, SafeAreaView
} from 'react-native';
import { useSelector } from 'react-redux';
import { theme } from '../constants/theme';
import api from '../services/api';
import Toast from 'react-native-toast-message';
import { getAvatarWithInitials } from '../utils/avatar';

export default function PostDetailScreen({ route, navigation }) {
    const { post: initialPost } = route.params;
    const user = useSelector(state => state.auth.user);
    const [post, setPost] = useState(initialPost);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchComments();
        fetchPostDetails(); // Refresh post details (like count, etc.)
    }, []);

    const fetchPostDetails = async () => {
        try {
            const response = await api.get(`/social/posts/${initialPost._id}`);
            setPost(response.data.post);
        } catch (error) {
            console.error('Fetch post error:', error);
        }
    };

    const fetchComments = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/social/posts/${initialPost._id}/comments`);
            setComments(response.data.comments);
        } catch (error) {
            console.error('Fetch comments error:', error);
            Toast.show({ type: 'error', text1: 'Failed to load comments' });
        } finally {
            setLoading(false);
        }
    };

    const handleSendComment = async () => {
        if (!newComment.trim()) return;

        try {
            const response = await api.post(`/social/posts/${post._id}/comments`, {
                content: newComment.trim()
            });

            setComments(prev => [response.data.comment, ...prev]);
            setNewComment('');
            // Update post comment count locally
            setPost(prev => ({
                ...prev,
                commentCount: (prev.commentCount || 0) + 1,
                comments: [...(prev.comments || []), response.data.comment._id]
            }));
        } catch (error) {
            console.error('Send comment error:', error);
            Toast.show({ type: 'error', text1: 'Failed to post comment' });
        }
    };

    const renderPost = () => {
        const postUser = post.author || {};

        return (
            <View style={styles.postCard}>
                <View style={styles.postHeader}>
                    <Image
                        source={{ uri: postUser.profilePicture || postUser.avatar || getAvatarWithInitials(postUser.name, 40) }}
                        style={styles.authorAvatar}
                    />
                    <View style={styles.authorInfo}>
                        <Text style={styles.authorName}>{postUser.name}</Text>
                        <Text style={styles.postTime}>{new Date(post.createdAt).toLocaleDateString()}</Text>
                    </View>
                </View>

                <Text style={styles.postContent}>{post.content}</Text>

                {/* Shared Post Content */}
                {post.sharedPost && (
                    <View style={styles.sharedContainer}>
                        <View style={styles.sharedHeader}>
                            <Image
                                source={{ uri: post.sharedPost.author?.profilePicture || post.sharedPost.author?.avatar || getAvatarWithInitials(post.sharedPost.author?.name, 30) }}
                                style={styles.sharedAvatar}
                            />
                            <Text style={styles.sharedAuthor}>{post.sharedPost.author?.name}</Text>
                        </View>
                        <Text style={styles.sharedContent}>{post.sharedPost.content}</Text>
                        {post.sharedPost.images && post.sharedPost.images.length > 0 && (
                            <Image source={{ uri: post.sharedPost.images[0] }} style={styles.sharedImage} />
                        )}
                    </View>
                )}

                {post.images && post.images.length > 0 && (
                    <Image source={{ uri: post.images[0] }} style={styles.postImage} resizeMode="cover" />
                )}

                <View style={styles.statsRow}>
                    <Text style={styles.statsText}>{post.likeCount || post.likes?.length || 0} Likes</Text>
                    <Text style={styles.statsText}>{post.commentCount || comments.length} Comments</Text>
                    <Text style={styles.statsText}>{post.shares || 0} Shares</Text>
                </View>
            </View>
        );
    };

    const renderComment = ({ item }) => (
        <View style={styles.commentItem}>
            <Image
                source={{ uri: item.author?.profilePicture || item.author?.avatar || getAvatarWithInitials(item.author?.name, 30) }}
                style={styles.commentAvatar}
            />
            <View style={styles.commentContent}>
                <Text style={styles.commentAuthor}>{item.author?.name}</Text>
                <Text style={styles.commentText}>{item.content}</Text>
                <Text style={styles.commentTime}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Post Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={comments}
                renderItem={renderComment}
                keyExtractor={item => item._id}
                ListHeaderComponent={renderPost}
                contentContainerStyle={styles.listContent}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                style={styles.inputContainer}
            >
                <TextInput
                    style={styles.input}
                    placeholder="Write a comment..."
                    value={newComment}
                    onChangeText={setNewComment}
                    multiline
                />
                <TouchableOpacity onPress={handleSendComment} style={styles.sendButton} disabled={!newComment.trim()}>
                    <Text style={[styles.sendButtonText, !newComment.trim() && styles.disabledText]}>Post</Text>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        marginTop: Platform.OS === 'android' ? 30 : 0
    },
    backButton: { padding: 5 },
    backButtonText: { fontSize: 24, color: '#333' },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    listContent: { paddingBottom: 80 },
    postCard: { padding: 15, borderBottomWidth: 10, borderBottomColor: '#f5f5f5' },
    postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    authorAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
    authorInfo: { justifyContent: 'center' },
    authorName: { fontWeight: 'bold', fontSize: 16 },
    postTime: { color: '#888', fontSize: 12 },
    postContent: { fontSize: 16, marginBottom: 10, lineHeight: 22 },
    postImage: { width: '100%', height: 250, borderRadius: 10, marginBottom: 10 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee' },
    statsText: { color: '#666', fontSize: 14 },
    commentItem: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    commentAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
    commentContent: { flex: 1, backgroundColor: '#f9f9f9', padding: 10, borderRadius: 12 },
    commentAuthor: { fontWeight: 'bold', fontSize: 14, marginBottom: 2 },
    commentText: { fontSize: 14, color: '#333', lineHeight: 20 },
    commentTime: { fontSize: 10, color: '#999', marginTop: 4, alignSelf: 'flex-end' },
    inputContainer: {
        flexDirection: 'row',
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: '#fff',
        alignItems: 'center'
    },
    input: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        maxHeight: 100,
        marginRight: 10
    },
    sendButton: { padding: 10 },
    sendButtonText: { color: theme.colors.primary, fontWeight: 'bold', fontSize: 16 },
    disabledText: { color: '#ccc' },
    sharedContainer: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        padding: 10,
        marginTop: 10,
        marginBottom: 10,
        backgroundColor: '#fafafa'
    },
    sharedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8
    },
    sharedAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 8
    },
    sharedAuthor: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333'
    },
    sharedContent: {
        fontSize: 14,
        color: '#444',
        marginBottom: 8,
        lineHeight: 20
    },
    sharedImage: {
        width: '100%',
        height: 150,
        borderRadius: 8,
        marginTop: 5
    }
});
