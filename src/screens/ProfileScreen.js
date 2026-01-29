import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Image, FlatList, TextInput, Share, ActivityIndicator
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { theme } from '../constants/theme';
import api from '../services/api';
import Toast from 'react-native-toast-message';
import { getAvatarWithInitials, getAvatarSource } from '../utils/avatar';
import { pickImage } from '../utils/mediaPicker';
import { uploadImage } from '../services/mediaUpload';
import { setCredentials } from '../redux/slices/authSlice';

export default function ProfileScreen({ route, navigation }) {
    const currentUser = useSelector(state => state.auth.user);
    const userId = route.params?.userId || currentUser.id || currentUser._id;
    const isOwnProfile = userId === (currentUser.id || currentUser._id);

    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [editData, setEditData] = useState({
        name: '',
        bio: '',
        location: ''
    });
    const [activeTab, setActiveTab] = useState('posts'); // 'posts' or 'media'
    const [sharedMedia, setSharedMedia] = useState([]);
    const [mediaLoading, setMediaLoading] = useState(false);

    const dispatch = useDispatch();

    useEffect(() => {
        fetchProfile();
        fetchUserPosts();
        if (!isOwnProfile) {
            fetchSharedMedia();
        }
    }, [userId]);

    const fetchProfile = async () => {
        try {
            const response = await api.get(`/social/users/${userId}/profile`);
            setProfile(response.data.user);
            setIsFollowing(response.data.isFollowing);
            if (isOwnProfile) {
                setEditData({
                    name: response.data.user.name || '',
                    bio: response.data.user.bio || '',
                    location: response.data.user.location || ''
                });
            }
        } catch (error) {
            console.error('Fetch profile error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async () => {
        try {
            setUpdating(true);
            const response = await api.patch('/social/profile', editData);
            setProfile(response.data.user);

            // Update global auth state if it's our profile
            if (isOwnProfile) {
                dispatch(setCredentials({ user: response.data.user, token: currentUser.token }));
            }

            setIsEditing(false);
            Toast.show({ type: 'success', text1: 'Success', text2: 'Profile updated successfully' });
        } catch (error) {
            console.error('Update profile error:', error);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to update profile' });
        } finally {
            setUpdating(false);
        }
    };

    const handlePickAvatar = async () => {
        try {
            const imageUri = await pickImage();
            if (imageUri) {
                setUpdating(true);
                const uploadResponse = await uploadImage(imageUri);
                const response = await api.patch('/social/profile', { profilePicture: uploadResponse.url });
                setProfile(response.data.user);

                if (isOwnProfile) {
                    dispatch(setCredentials({ user: response.data.user, token: currentUser.token }));
                }

                Toast.show({ type: 'success', text1: 'Success', text2: 'Profile picture updated' });
            }
        } catch (error) {
            console.error('Update avatar error:', error);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to upload profile picture' });
        } finally {
            setUpdating(false);
        }
    };

    const handleShareProfile = async () => {
        try {
            const shareUrl = `https://uberapp.com/profile/${userId}`; // Mock URL
            await Share.share({
                message: `Check out ${profile.name}'s profile on UberApp! ${shareUrl}`,
                url: shareUrl,
                title: 'Share Profile'
            });
        } catch (error) {
            console.error('Share profile error:', error);
        }
    };

    const fetchUserPosts = async () => {
        try {
            const response = await api.get(`/social/users/${userId}/posts`);
            setPosts(response.data.posts);
        } catch (error) {
            console.error('Fetch user posts error:', error);
        }
    };

    const handleFollow = async () => {
        try {
            const response = await api.post(`/social/follow/${userId}`);
            setIsFollowing(response.data.following);

            // Update follower count
            setProfile(prev => ({
                ...prev,
                followersCount: prev.followersCount + (response.data.following ? 1 : -1)
            }));

            Toast.show({
                type: 'success',
                text1: response.data.following ? 'Following!' : 'Unfollowed'
            });
        } catch (error) {
            console.error('Follow error:', error);
            Toast.show({ type: 'error', text1: 'Failed to update follow status' });
        }
    };

    const handleMessage = async () => {
        try {
            setLoading(true);
            const response = await api.post('/chat/conversations', {
                participantId: userId
            });

            navigation.navigate('Chat', {
                conversation: response.data.conversation,
                otherUser: profile
            });
        } catch (error) {
            console.error('Message error:', error);
            Toast.show({
                type: 'error',
                text1: 'Could not start chat',
                text2: error.response?.data?.message || 'Try again later'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchSharedMedia = async () => {
        try {
            setMediaLoading(true);
            // First find conversation
            const convResponse = await api.post('/chat/conversations', { participantId: userId });
            const conversationId = convResponse.data.conversation?._id || convResponse.data.conversation?.id;

            if (conversationId) {
                // Then fetch media
                const response = await api.get(`/chat/conversations/${conversationId}/media`);
                setSharedMedia(response.data.media || []);
            }
        } catch (error) {
            console.error('Fetch shared media error:', error);
        } finally {
            setMediaLoading(false);
        }
    };

    const renderPost = ({ item }) => (
        <TouchableOpacity
            style={styles.postThumbnail}
            onPress={() => navigation.navigate('PostDetail', { post: item })}
        >
            {item.images && item.images.length > 0 ? (
                <Image source={{ uri: item.images[0] }} style={styles.postImage} />
            ) : (
                <View style={styles.postTextPreview}>
                    <Text style={styles.postTextContent} numberOfLines={3}>
                        {item.content}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );

    if (loading || !profile) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator color={theme.colors.primary} size="large" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header / Edit Toggle */}
            <View style={styles.navbar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBackBtn}>
                    <Text style={styles.navBackText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.navTitle}>{profile.name}</Text>
                <View style={{ width: 30 }} />
                {/* Placeholder for symmetry or settings icon */}
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <View style={styles.headerTopRow}>
                        <TouchableOpacity onPress={isOwnProfile ? handlePickAvatar : null} disabled={!isOwnProfile || updating}>
                            <Image source={getAvatarSource(profile)} style={styles.profilePicture} />
                            {isOwnProfile && (
                                <View style={styles.editBadge}>
                                    <Text style={styles.editBadgeText}>+</Text>
                                </View>
                            )}
                            {updating && <ActivityIndicator style={styles.avatarLoader} color={theme.colors.primary} />}
                        </TouchableOpacity>

                        <View style={styles.statsContainer}>
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>{profile.postsCount || 0}</Text>
                                <Text style={styles.statLabel}>Posts</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>{profile.followersCount || 0}</Text>
                                <Text style={styles.statLabel}>Followers</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>{profile.followingCount || 0}</Text>
                                <Text style={styles.statLabel}>Following</Text>
                            </View>
                        </View>
                    </View>

                    {/* Bio Section */}
                    <View style={styles.bioSection}>
                        {isEditing ? (
                            <View style={styles.editForm}>
                                <TextInput
                                    style={styles.editInput}
                                    value={editData.name}
                                    onChangeText={(t) => setEditData({ ...editData, name: t })}
                                    placeholder="Name"
                                />
                                <TextInput
                                    style={[styles.editInput, styles.bioInput]}
                                    value={editData.bio}
                                    onChangeText={(t) => setEditData({ ...editData, bio: t })}
                                    placeholder="Bio"
                                    multiline
                                />
                                <TextInput
                                    style={styles.editInput}
                                    value={editData.location}
                                    onChangeText={(t) => setEditData({ ...editData, location: t })}
                                    placeholder="Location"
                                />
                                <TouchableOpacity
                                    style={styles.saveBtn}
                                    onPress={handleUpdateProfile}
                                    disabled={updating}
                                >
                                    {updating ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                <Text style={styles.name}>{profile.name}</Text>
                                {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
                                {profile.location ? <Text style={styles.location}>📍 {profile.location}</Text> : null}
                            </>
                        )}
                    </View>

                    {/* Action Buttons */}
                    {!isEditing && (
                        <View style={styles.actions}>
                            {isOwnProfile ? (
                                <View style={styles.ownProfileActions}>
                                    <TouchableOpacity style={styles.editProfileBtn} onPress={() => setIsEditing(true)}>
                                        <Text style={styles.editProfileBtnText}>Edit profile</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.shareProfileBtn} onPress={handleShareProfile}>
                                        <Text style={styles.editProfileBtnText}>Share profile</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <>
                                    <TouchableOpacity
                                        style={[styles.actionButton, isFollowing ? styles.followingButton : styles.followButton]}
                                        onPress={handleFollow}
                                    >
                                        <Text style={[styles.actionButtonText, isFollowing ? styles.followingButtonText : styles.followButtonText]}>
                                            {isFollowing ? 'Following' : 'Follow'}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.messageButton}
                                        onPress={handleMessage}
                                    >
                                        <Text style={styles.messageButtonText}>Message</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    )}
                </View>

                {/* Tabs */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
                        onPress={() => setActiveTab('posts')}
                    >
                        {/* Grid Icon */}
                        <Text style={[styles.tabIcon, activeTab === 'posts' && { opacity: 1 }]}>▦</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'media' && styles.activeTab]}
                        onPress={() => setActiveTab('media')}
                    >
                        {/* Tag/Media Icon */}
                        <Text style={[styles.tabIcon, activeTab === 'media' && { opacity: 1 }]}>📷</Text>
                    </TouchableOpacity>
                </View>

                {/* Content Section */}
                <View style={styles.gridContainer}>
                    {activeTab === 'posts' ? (
                        <FlatList
                            data={posts}
                            renderItem={renderPost}
                            keyExtractor={(item) => item._id}
                            numColumns={3}
                            scrollEnabled={false}
                            ListEmptyComponent={
                                <View style={styles.emptyPosts}>
                                    <View style={styles.emptyCircle}>
                                        <Text style={{ fontSize: 30 }}>📷</Text>
                                    </View>
                                    <Text style={styles.emptyText}>No posts yet</Text>
                                </View>
                            }
                        />
                    ) : (
                        <FlatList
                            data={sharedMedia}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.mediaItem}>
                                    <Image source={{ uri: item.mediaUrl }} style={styles.mediaImage} />
                                </TouchableOpacity>
                            )}
                            keyExtractor={(item, index) => index.toString()}
                            numColumns={3}
                            scrollEnabled={false}
                            ListEmptyComponent={
                                <View style={styles.emptyPosts}>
                                    <View style={styles.emptyCircle}>
                                        <Text style={{ fontSize: 30 }}>🖼️</Text>
                                    </View>
                                    <Text style={styles.emptyText}>No media</Text>
                                </View>
                            }
                        />
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    // Navbar
    navbar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingTop: 50,
        paddingBottom: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 0.5,
        borderBottomColor: '#dbdbdb'
    },
    navBackBtn: {
        padding: 5
    },
    navBackText: {
        fontSize: 24,
        color: '#262626'
    },
    navTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#262626'
    },
    scrollContent: {
        paddingBottom: 20
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    // Header Profile
    header: {
        padding: 20,
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15
    },
    profilePicture: {
        width: 86,
        height: 86,
        borderRadius: 43,
        borderWidth: 1,
        borderColor: '#dbdbdb',
        marginRight: 20
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 20,
        backgroundColor: theme.colors.primary,
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    editBadgeText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: -2
    },
    avatarLoader: {
        position: 'absolute',
        top: 0, left: 0, right: 20, bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: 43
    },
    // Stats
    statsContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center'
    },
    statItem: {
        alignItems: 'center'
    },
    statNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#262626'
    },
    statLabel: {
        fontSize: 13,
        color: '#262626'
    },
    // Bio
    bioSection: {
        marginBottom: 15
    },
    name: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#262626',
        marginBottom: 2
    },
    bio: {
        fontSize: 14,
        color: '#262626',
        marginBottom: 2,
        lineHeight: 20
    },
    location: {
        fontSize: 13,
        color: '#00376b',
        marginTop: 2
    },
    // Actions
    actions: {
        flexDirection: 'row',
        gap: 10
    },
    ownProfileActions: {
        flexDirection: 'row',
        gap: 8,
        flex: 1
    },
    editProfileBtn: {
        flex: 1,
        backgroundColor: '#efefef',
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center'
    },
    shareProfileBtn: {
        flex: 1,
        backgroundColor: '#efefef',
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center'
    },
    editProfileBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#262626'
    },
    actionButton: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center'
    },
    followButton: {
        backgroundColor: theme.colors.primary,
    },
    followingButton: {
        backgroundColor: '#efefef',
    },
    actionButtonText: {
        fontSize: 13,
        fontWeight: '600'
    },
    followButtonText: {
        color: '#fff'
    },
    followingButtonText: {
        color: '#262626'
    },
    messageButton: {
        flex: 1,
        backgroundColor: '#efefef',
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center'
    },
    messageButtonText: {
        color: '#262626',
        fontSize: 13,
        fontWeight: '600'
    },
    // Edit Form
    editForm: {
        marginBottom: 10
    },
    editInput: {
        borderBottomWidth: 1,
        borderBottomColor: '#dbdbdb',
        paddingVertical: 8,
        fontSize: 14,
        marginBottom: 10,
        color: '#262626'
    },
    saveBtn: {
        backgroundColor: theme.colors.primary,
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 5
    },
    saveBtnText: {
        color: '#fff',
        fontWeight: '600'
    },
    // Tabs
    tabContainer: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#dbdbdb',
        marginTop: 10
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'transparent'
    },
    activeTab: {
        borderBottomColor: '#262626'
    },
    tabIcon: {
        fontSize: 24,
        color: '#262626',
        opacity: 0.4
    },
    // Grid
    gridContainer: {
        minHeight: 300
    },
    postThumbnail: {
        width: '33%',
        aspectRatio: 1,
        margin: '0.15%',
        padding: 0,
        backgroundColor: '#f0f0f0'
    },
    postImage: {
        width: '100%',
        height: '100%'
    },
    postTextPreview: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 5
    },
    postTextContent: {
        fontSize: 10,
        color: '#262626'
    },
    mediaItem: {
        width: '33%',
        aspectRatio: 1,
        margin: '0.15%',
    },
    mediaImage: {
        width: '100%',
        height: '100%'
    },
    emptyPosts: {
        paddingTop: 60,
        alignItems: 'center'
    },
    emptyCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: '#262626',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#262626'
    }
});
