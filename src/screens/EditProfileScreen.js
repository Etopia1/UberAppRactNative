import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { theme } from '../constants/theme';
import { pickImage, takePhoto } from '../utils/mediaPicker';
import { uploadProfilePicture } from '../services/mediaUpload';
import api from '../services/api';
import Toast from 'react-native-toast-message';
import { setCredentials } from '../redux/slices/authSlice';

export default function EditProfileScreen({ navigation }) {
    const user = useSelector(state => state.auth.user);
    const token = useSelector(state => state.auth.token);
    const dispatch = useDispatch();

    const [name, setName] = useState(user?.name || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [email, setEmail] = useState(user?.email || '');
    const [profilePicture, setProfilePicture] = useState(user?.profilePicture || '');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handlePickImage = async () => {
        const image = await pickImage();
        if (image) {
            handleUploadProfilePicture(image.uri);
        }
    };

    const handleTakePhoto = async () => {
        const photo = await takePhoto();
        if (photo) {
            handleUploadProfilePicture(photo.uri);
        }
    };

    const handleUploadProfilePicture = async (uri) => {
        try {
            setUploading(true);
            const uploaded = await uploadProfilePicture(uri);
            setProfilePicture(uploaded.url);
            Toast.show({ type: 'success', text1: 'Profile picture updated!' });
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Failed to upload image' });
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const response = await api.patch('/auth/profile', {
                name,
                bio,
                profilePicture
            });

            // Update Redux store
            dispatch(setCredentials({
                user: response.data.user,
                token: token
            }));

            Toast.show({ type: 'success', text1: 'Profile updated!' });
            navigation.goBack();
        } catch (error) {
            console.error('Update profile error:', error);
            Toast.show({ type: 'error', text1: 'Failed to update profile' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.profilePictureContainer}>
                <Image
                    source={{ uri: profilePicture || user?.avatar || 'https://via.placeholder.com/150' }}
                    style={styles.profilePicture}
                />
                {uploading && (
                    <View style={styles.uploadingOverlay}>
                        <ActivityIndicator color="#fff" />
                    </View>
                )}
                <View style={styles.pictureButtons}>
                    <TouchableOpacity
                        style={styles.pictureButton}
                        onPress={handlePickImage}
                        disabled={uploading}
                    >
                        <Text style={styles.pictureButtonText}>📷 Gallery</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.pictureButton}
                        onPress={handleTakePhoto}
                        disabled={uploading}
                    >
                        <Text style={styles.pictureButtonText}>📸 Camera</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.form}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Name</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Your name"
                        placeholderTextColor="#999"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Bio</Text>
                    <TextInput
                        style={[styles.input, styles.bioInput]}
                        value={bio}
                        onChangeText={setBio}
                        placeholder="About yourself..."
                        placeholderTextColor="#999"
                        multiline
                        numberOfLines={3}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email</Text>
                    <Text style={styles.emailText}>{email}</Text>
                </View>

                <TouchableOpacity
                    style={[styles.saveButton, (loading || uploading) && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={loading || uploading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa'
    },
    profilePictureContainer: {
        alignItems: 'center',
        padding: 30,
        backgroundColor: '#fff',
        marginBottom: 20
    },
    profilePicture: {
        width: 150,
        height: 150,
        borderRadius: 75,
        marginBottom: 20
    },
    uploadingOverlay: {
        position: 'absolute',
        top: 30,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    pictureButtons: {
        flexDirection: 'row',
        gap: 15
    },
    pictureButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20
    },
    pictureButtonText: {
        color: '#fff',
        fontWeight: '600'
    },
    form: {
        padding: 20
    },
    inputGroup: {
        marginBottom: 20
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        color: '#333',
        borderWidth: 1,
        borderColor: '#e0e0e0'
    },
    bioInput: {
        height: 100,
        textAlignVertical: 'top'
    },
    emailText: {
        fontSize: 16,
        color: '#666',
        padding: 15,
        backgroundColor: '#f5f7fa',
        borderRadius: 12
    },
    saveButton: {
        backgroundColor: theme.colors.primary,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20
    },
    saveButtonDisabled: {
        backgroundColor: '#ccc'
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600'
    }
});
