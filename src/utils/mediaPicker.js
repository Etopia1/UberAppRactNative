import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Alert, Platform } from 'react-native';

// Request permissions
export const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera and media library permissions to send images and videos.');
        return false;
    }
    return true;
};

// Pick image from gallery
export const pickImage = async () => {
    try {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return null;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
            aspect: [4, 3]
        });

        if (!result.canceled) {
            return result.assets[0];
        }
        return null;
    } catch (error) {
        console.error('Pick image error:', error);
        return null;
    }
};

// Pick any media (image or video) from gallery
export const pickMedia = async () => {
    try {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return null;

        const options = {
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            quality: 0.8,
            allowsEditing: true,
        };

        if (Platform.OS !== 'web') {
            options.videoMaxDuration = 60;
        }

        const result = await ImagePicker.launchImageLibraryAsync(options);

        if (!result.canceled) {
            return result.assets[0];
        }
        return null;
    } catch (error) {
        console.error('Pick media error:', error);
        if (Platform.OS === 'web' && error.message?.includes('Unsupported file type')) {
            Alert.alert(
                'File Type Error',
                'The browser rejected this file type. Please try using the "Video" or "Document" option instead.',
                [{ text: 'OK' }]
            );
        }
        return null;
    }
};

// Take photo with camera
export const takePhoto = async () => {
    try {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return null;

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: false,
            quality: 0.8,
            mediaTypes: ImagePicker.MediaTypeOptions.Images
        });

        if (!result.canceled) {
            return result.assets[0];
        }
        return null;
    } catch (error) {
        console.error('Take photo error:', error);
        Alert.alert('Error', 'Failed to take photo');
        return null;
    }
};

// Record video with camera
export const recordVideo = async () => {
    try {
        if (Platform.OS === 'web') {
            Alert.alert('Not Supported', 'Video recording is not available in the browser. Please use the "Video" option to upload a file.');
            return null;
        }

        const hasPermission = await requestPermissions();
        if (!hasPermission) return null;

        const options = {
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            allowsEditing: false,
            quality: 0.8,
            videoMaxDuration: 60
        };

        const result = await ImagePicker.launchCameraAsync(options);

        if (!result.canceled) {
            return result.assets[0];
        }
        return null;
    } catch (error) {
        console.error('Record video error:', error);
        Alert.alert('Error', 'Failed to record video');
        return null;
    }
};

// Pick video from gallery
export const pickVideo = async () => {
    try {
        // On Web, use DocumentPicker for videos to avoid MIME type strictness issues with ImagePicker
        if (Platform.OS === 'web') {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'video/*',
                copyToCacheDirectory: true
            });

            if (result.assets && result.assets[0]) {
                const doc = result.assets[0];
                return {
                    uri: doc.uri,
                    type: 'video', // normalize type
                    fileName: doc.name,
                    mimeType: doc.mimeType
                };
            }
            return null;
        }

        const hasPermission = await requestPermissions();
        if (!hasPermission) return null;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            quality: 0.8,
            videoMaxDuration: 60
        });

        if (!result.canceled) {
            return result.assets[0];
        }
        return null;
    } catch (error) {
        console.error('Pick video error:', error);
        return null;
    }
};


// Pick document
export const pickDocument = async () => {
    try {
        const result = await DocumentPicker.getDocumentAsync({
            type: '*/*',
            copyToCacheDirectory: true
        });

        if (result.type === 'success') {
            return result;
        }
        return null;
    } catch (error) {
        console.error('Pick document error:', error);
        Alert.alert('Error', 'Failed to pick document');
        return null;
    }
};

// Show media options
export const showMediaOptions = (onImagePick, onVideoPick, onDocumentPick, onCamera) => {
    Alert.alert(
        'Send Media',
        'Choose an option',
        [
            {
                text: 'Take Photo',
                onPress: onCamera
            },
            {
                text: 'Choose Image',
                onPress: onImagePick
            },
            {
                text: 'Choose Video',
                onPress: onVideoPick
            },
            {
                text: 'Choose Document',
                onPress: onDocumentPick
            },
            {
                text: 'Cancel',
                style: 'cancel'
            }
        ]
    );
};
