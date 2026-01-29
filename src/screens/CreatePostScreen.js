import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, Video, Modal } from 'react-native';
import { useSelector } from 'react-redux';
import { theme } from '../constants/theme';
import api from '../services/api';
import Toast from 'react-native-toast-message';
import { pickImage, pickVideo } from '../utils/mediaPicker';
import { uploadImage, uploadVideo } from '../services/mediaUpload';

const BACKGROUNDS = [
    null, // Default (White)
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#96CEB4', // Green
    '#FFEEAD', // Yellow
    '#D4A5A5', // Pink
    '#9B59B6', // Purple
    '#34495E', // Dark Blue
];

export default function CreatePostScreen({ navigation }) {
    const user = useSelector(state => state.auth.user);
    const [content, setContent] = useState('');
    const [rideFrom, setRideFrom] = useState('');
    const [rideTo, setRideTo] = useState('');
    const [rating, setRating] = useState(0);
    const [loading, setLoading] = useState(false);
    const [selectedImages, setSelectedImages] = useState([]);
    const [selectedVideos, setSelectedVideos] = useState([]);
    const [selectedBackground, setSelectedBackground] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [selectedTags, setSelectedTags] = useState([]);
    const [selectedFeeling, setSelectedFeeling] = useState(null);
    const [tagModalVisible, setTagModalVisible] = useState(false);
    const [feelingModalVisible, setFeelingModalVisible] = useState(false);

    const handleCreatePost = async () => {
        if (!content.trim()) {
            Toast.show({ type: 'error', text1: 'Please write something!' });
            return;
        }

        try {
            setLoading(true);
            setUploading(true);

            // 1. Upload Images
            let uploadedImageUrls = [];
            if (selectedImages.length > 0) {
                for (const imgUri of selectedImages) {
                    try {
                        const result = await uploadImage(imgUri);
                        uploadedImageUrls.push(result.url);
                    } catch (err) {
                        console.error("Image upload failed", err);
                        Toast.show({ type: 'error', text1: 'Failed to upload some images' });
                    }
                }
            }

            // 2. Upload Videos
            let uploadedVideoUrls = [];
            if (selectedVideos.length > 0) {
                for (const vidUri of selectedVideos) {
                    try {
                        const result = await uploadVideo(vidUri);
                        uploadedVideoUrls.push(result.url);
                    } catch (err) {
                        console.error("Video upload failed", err);
                        Toast.show({ type: 'error', text1: 'Failed to upload some videos' });
                    }
                }
            }

            setUploading(false);

            // 3. Create Post
            const postData = {
                content: content.trim(),
                images: uploadedImageUrls,
                videos: uploadedVideoUrls,
                background: selectedBackground,
                rideDetails: rideFrom && rideTo ? {
                    from: rideFrom,
                    to: rideTo,
                    rating: rating || undefined,
                    date: new Date()
                } : undefined
            };

            await api.post('/social/posts', postData);

            Toast.show({
                type: 'success',
                text1: 'Post created! 🎉',
                text2: 'Your story has been shared'
            });

            navigation.goBack();
        } catch (error) {
            console.error('Create post error:', error);
            Toast.show({ type: 'error', text1: 'Failed to create post' });
            setUploading(false);
        } finally {
            setLoading(false);
        }
    };

    const renderStars = () => {
        return (
            <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map(star => (
                    <TouchableOpacity key={star} onPress={() => setRating(star)}>
                        <Text style={[styles.star, star <= rating && styles.starActive]}>
                            {star <= rating ? '⭐' : '☆'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    const handlePickVideo = async () => {
        const vid = await pickVideo();
        if (vid) {
            setSelectedVideos(prev => [...prev, vid.uri]);
        }
    };

    const isBackgroundActive = selectedBackground !== null;
    const inputTextColor = isBackgroundActive ? '#FFF' : '#333';

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.cancelButton}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create Post</Text>
                <TouchableOpacity
                    onPress={handleCreatePost}
                    disabled={loading || !content.trim()}
                >
                    {loading ? (
                        <ActivityIndicator color={theme.colors.primary} size="small" />
                    ) : (
                        <Text style={[styles.postButton, (!content.trim()) && styles.postButtonDisabled]}>
                            Post
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                {/* Author Info */}
                <View style={styles.authorSection}>
                    <Image
                        source={{ uri: user.profilePicture || user.avatar || 'https://via.placeholder.com/50' }}
                        style={styles.avatar}
                    />
                    <View style={styles.authorInfo}>
                        <Text style={styles.authorName}>{user.name}</Text>
                        <View style={styles.privacyBadge}>
                            <Text style={styles.privacyText}>Public 🌎</Text>
                        </View>
                    </View>
                </View>

                {/* Main Input Area */}
                <View style={[
                    styles.inputWrapper,
                    isBackgroundActive && { backgroundColor: selectedBackground, minHeight: 250, justifyContent: 'center' }
                ]}>
                    <TextInput
                        style={[
                            styles.contentInput,
                            isBackgroundActive && {
                                fontSize: 24,
                                fontWeight: 'bold',
                                textAlign: 'center',
                                color: '#FFF'
                            }
                        ]}
                        placeholder={isBackgroundActive ? "Type something..." : "What's on your mind?"}
                        placeholderTextColor={isBackgroundActive ? 'rgba(255,255,255,0.7)' : '#999'}
                        value={content}
                        onChangeText={setContent}
                        multiline
                        textAlignVertical={isBackgroundActive ? "center" : "top"}
                    />
                </View>

                {/* Background Selector */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bgSelector}>
                    <TouchableOpacity
                        style={[styles.bgOption, selectedBackground === null && styles.bgOptionSelected, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee' }]}
                        onPress={() => setSelectedBackground(null)}
                    >
                        <Text style={{ fontSize: 10, color: '#333' }}>Aa</Text>
                    </TouchableOpacity>
                    {BACKGROUNDS.slice(1).map((bg, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.bgOption, { backgroundColor: bg }, selectedBackground === bg && styles.bgOptionSelected]}
                            onPress={() => setSelectedBackground(bg)}
                        />
                    ))}
                </ScrollView>

                {/* Media Preview Section */}
                {(selectedImages.length > 0 || selectedVideos.length > 0) && (
                    <View style={styles.mediaPreviewContainer}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {selectedImages.map((uri, index) => (
                                <View key={`img-${index}`} style={styles.mediaItem}>
                                    <Image source={{ uri }} style={styles.mediaThumbnail} />
                                    <TouchableOpacity
                                        style={styles.removeMediaBtn}
                                        onPress={() => setSelectedImages(p => p.filter((_, i) => i !== index))}
                                    >
                                        <Text style={styles.removeText}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                            {selectedVideos.map((uri, index) => (
                                <View key={`vid-${index}`} style={styles.mediaItem}>
                                    <View style={[styles.mediaThumbnail, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
                                        <Text style={{ fontSize: 30 }}>🎥</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.removeMediaBtn}
                                        onPress={() => setSelectedVideos(p => p.filter((_, i) => i !== index))}
                                    >
                                        <Text style={styles.removeText}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Tools Section */}
                <View style={styles.toolsSection}>
                    <TouchableOpacity style={styles.toolItem} onPress={async () => {
                        const img = await pickImage();
                        if (img) setSelectedImages(prev => [...prev, img.uri]);
                    }}>
                        <Text style={styles.toolIcon}>📷</Text>
                        <Text style={styles.toolLabel}>Photo</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.toolItem} onPress={handlePickVideo}>
                        <Text style={styles.toolIcon}>🎥</Text>
                        <Text style={styles.toolLabel}>Video</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.toolItem} onPress={() => Toast.show({ text1: 'Tagging coming soon!' })}>
                        <Text style={styles.toolIcon}>🏷️</Text>
                        <Text style={styles.toolLabel}>Tag</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.toolItem} onPress={() => Toast.show({ text1: 'Feeling/Activity coming soon!' })}>
                        <Text style={styles.toolIcon}>😊</Text>
                        <Text style={styles.toolLabel}>Feeling</Text>
                    </TouchableOpacity>
                </View>

                {/* Ride Details (Optional) */}
                <View style={styles.rideSection}>
                    <Text style={styles.sectionHeader}>Share a Ride</Text>
                    <View style={styles.rideInputs}>
                        <TextInput
                            style={styles.rideInput}
                            placeholder="From..."
                            value={rideFrom}
                            onChangeText={setRideFrom}
                        />
                        <Text style={styles.arrow}>→</Text>
                        <TextInput
                            style={styles.rideInput}
                            placeholder="To..."
                            value={rideTo}
                            onChangeText={setRideTo}
                        />
                    </View>
                    {rideFrom && rideTo && (
                        <View style={styles.ratingWrapper}>
                            <Text style={styles.ratingLabel}>Rate Driver:</Text>
                            {renderStars()}
                        </View>
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: 50
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold'
    },
    cancelButton: {
        fontSize: 16,
        color: '#666'
    },
    postButton: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.primary,
        backgroundColor: '#E8F5E9',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 4
    },
    postButtonDisabled: {
        color: '#999',
        backgroundColor: '#f0f0f0'
    },
    content: {
        flex: 1
    },
    authorSection: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10
    },
    authorName: {
        fontWeight: 'bold',
        fontSize: 16
    },
    privacyBadge: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 2,
        alignSelf: 'flex-start'
    },
    privacyText: {
        fontSize: 10,
        color: '#666'
    },
    inputWrapper: {
        minHeight: 100,
        justifyContent: 'flex-start'
    },
    contentInput: {
        fontSize: 18,
        padding: 15,
        color: '#333',
        minHeight: 100
    },
    bgSelector: {
        paddingHorizontal: 15,
        flexDirection: 'row',
        marginBottom: 15,
        height: 40
    },
    bgOption: {
        width: 30,
        height: 30,
        borderRadius: 5,
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2
    },
    bgOptionSelected: {
        borderWidth: 2,
        borderColor: '#333',
        transform: [{ scale: 1.1 }]
    },
    mediaPreviewContainer: {
        paddingHorizontal: 15,
        marginBottom: 15
    },
    mediaItem: {
        marginRight: 10,
        position: 'relative'
    },
    mediaThumbnail: {
        width: 100,
        height: 100,
        borderRadius: 10
    },
    removeMediaBtn: {
        position: 'absolute',
        right: -5,
        top: -5,
        backgroundColor: '#ddd',
        borderRadius: 12,
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center'
    },
    removeText: { fontSize: 12, fontWeight: 'bold' },
    toolsSection: {
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingVertical: 10,
        marginTop: 10
    },
    toolItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15
    },
    toolIcon: {
        fontSize: 20,
        marginRight: 15,
        width: 30,
        textAlign: 'center'
    },
    toolLabel: {
        fontSize: 16,
        fontWeight: '500'
    },
    rideSection: {
        padding: 15
    },
    sectionHeader: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase'
    },
    rideInputs: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10
    },
    rideInput: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 10,
        borderRadius: 8
    },
    arrow: {
        marginHorizontal: 10,
        color: '#666'
    },
    ratingWrapper: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    ratingLabel: {
        marginRight: 10,
        fontWeight: '600'
    },
    starsContainer: {
        flexDirection: 'row'
    },
    star: {
        fontSize: 24,
        color: '#ddd',
        marginRight: 5
    },
    starActive: {
        color: '#FFD700'
    }
});
