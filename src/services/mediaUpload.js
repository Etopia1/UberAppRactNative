import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';


// Generic upload function
const uploadMedia = async (endpoint, fileUri, fieldName, filePrefix) => {
    try {
        // Handle if fileUri is an object (from Expo ImagePicker assets)
        const actualUri = (typeof fileUri === 'object' && fileUri?.uri) ? fileUri.uri : fileUri;

        if (!actualUri) throw new Error('No file URI provided');

        // Robust way to get extension and name
        let fileType = 'jpeg';
        if (actualUri.toString().startsWith('data:')) {
            // Handle data URI (e.g. data:image/png;base64,...)
            const match = actualUri.match(/^data:([^;]+);/);
            const mime = match ? match[1] : 'image/jpeg';
            fileType = mime.split('/')[1] || 'jpeg';
        } else {
            // Handle standard file path or blob URL
            const uriParts = actualUri.split('.');
            const potentialExt = uriParts[uriParts.length - 1].toLowerCase();
            if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'm4a', 'pdf'].includes(potentialExt)) {
                fileType = potentialExt;
            }
        }

        const fileName = `${filePrefix}_${Date.now()}.${fileType}`;

        let mimeType;
        if (filePrefix === 'voice') mimeType = 'audio/m4a';
        else if (filePrefix === 'video') mimeType = fileType === 'mov' ? 'video/quicktime' : `video/${fileType}`;
        else if (filePrefix === 'document') mimeType = 'application/octet-stream';
        else mimeType = `image/${fileType}`;

        const formData = new FormData();

        if (Platform.OS === 'web') {
            const response = await fetch(actualUri);
            const blob = await response.blob();
            formData.append(fieldName, blob, fileName);
        } else {
            // Standard React Native way
            const formattedUri = Platform.OS === 'android' && !actualUri.startsWith('file://') && !actualUri.startsWith('content://')
                ? `file://${actualUri}`
                : actualUri;

            formData.append(fieldName, {
                uri: formattedUri,
                name: fileName,
                type: mimeType
            });
        }

        // Get authentication token and production API URL
        const token = await AsyncStorage.getItem('token');

        const BASE_URL = 'https://uberappbackend.onrender.com/api';
        // const BASE_URL = 'http://localhost:2000/api';

        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        console.log(`📤 Uploading ${fieldName} to: ${BASE_URL}${endpoint}`);
        console.log(`📄 File: ${fileName}, Type: ${mimeType}`);

        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            body: formData,
            headers: headers
        });
        const responseText = await response.text();

        console.log('📥 Raw Response:', responseText);

        let responseData;
        try {
            responseData = JSON.parse(responseText);
        } catch (e) {
            throw new Error(`Server returned non-JSON response: ${responseText.slice(0, 100)}`);
        }

        if (!response.ok) {
            console.error('❌ Upload Response Error:', responseData);
            throw new Error(responseData.message || 'Upload failed');
        }

        console.log('✅ Upload Successful:', responseData.url);
        return responseData;
    } catch (error) {
        console.error(`❌ Upload error (${endpoint}):`, error);
        throw new Error(error.message || 'Upload failed');
    }
};

export const uploadImage = (imageUri) => uploadMedia('/media/upload-image', imageUri, 'image', 'photo');
export const uploadVideo = (videoUri) => uploadMedia('/media/upload-video', videoUri, 'video', 'video');
export const uploadAudio = (audioUri) => uploadMedia('/media/upload-audio', audioUri, 'audio', 'voice');
export const uploadDocument = (docUri, docName) => uploadMedia('/media/upload-document', docUri, 'document', 'document');
export const uploadProfilePicture = (imageUri) => uploadMedia('/media/upload-profile-picture', imageUri, 'profile', 'profile');
