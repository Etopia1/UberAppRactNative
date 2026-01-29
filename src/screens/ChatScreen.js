import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
    Image, KeyboardAvoidingView, Platform, Modal, Dimensions, Animated, ActivityIndicator
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { setActiveConversation } from '../redux/slices/chatSlice';
import { theme } from '../constants/theme';
import api from '../services/api';
import socketService from '../services/socket';
import { pickImage, takePhoto, pickVideo, pickDocument, recordVideo, pickMedia } from '../utils/mediaPicker';
import { uploadImage, uploadVideo, uploadAudio, uploadDocument } from '../services/mediaUpload';
import { getAvatarWithInitials, getAvatarSource } from '../utils/avatar';
import Toast from 'react-native-toast-message';
import { Audio, Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import MessageBubble from '../components/MessageBubble';

import { useCall } from '../context/CallContext'; // Import useCall

const { width } = Dimensions.get('window');

export default function ChatScreen({ route, navigation }) {
    const { startCall } = useCall(); // Get startCall from context
    const { conversation, otherUser } = route.params;
    const dispatch = useDispatch();
    const user = useSelector(state => state.auth.user);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isRemoteUserTyping, setIsRemoteUserTyping] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [recording, setRecording] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [isActionModalVisible, setIsActionModalVisible] = useState(false);
    const [replyTo, setReplyTo] = useState(null);
    const [editingMessage, setEditingMessage] = useState(null);
    const [isBlocked, setIsBlocked] = useState(false);

    const [isAttachmentModalVisible, setIsAttachmentModalVisible] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [contacts, setContacts] = useState([]);
    const [forwardMessage, setForwardMessage] = useState(null);
    const [isForwardModalVisible, setIsForwardModalVisible] = useState(false);

    // Status
    const [otherUserStatus, setOtherUserStatus] = useState({
        isOnline: otherUser.isOnline || false,
        lastSeen: otherUser.lastSeen || null
    });

    const flatListRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const durationInterval = useRef(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Audio Playback State
    const [playingAudioId, setPlayingAudioId] = useState(null);
    const soundObjectRef = useRef(null);

    // Cleanup Audio on Unmount
    useEffect(() => {
        return () => {
            if (soundObjectRef.current) {
                soundObjectRef.current.unloadAsync();
            }
        };
    }, []);

    useEffect(() => {
        // Initial Fetch for fresh status
        api.get(`/social/users/${otherUser._id}`).then(res => {
            if (res.data) {
                setOtherUserStatus({
                    isOnline: res.data.isOnline,
                    lastSeen: res.data.lastSeen
                });
            }
        }).catch(err => console.log('Status fetch err:', err));

        // Mark as Read
        api.patch(`/chat/conversations/${conversation._id}/read`).catch(err => console.log('Mark read err:', err));

        const handleUserStatusUpdate = (data) => {
            if (data.userId === otherUser._id) {
                setOtherUserStatus({
                    isOnline: data.isOnline,
                    lastSeen: data.lastSeen
                });
            }
        };

        socketService.on('user_status_update', handleUserStatusUpdate);
        return () => {
            socketService.off('user_status_update', handleUserStatusUpdate);
        };
    }, []);

    const formatLastSeen = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const now = new Date();
        const diff = now - d;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (d.toDateString() === now.toDateString()) return `Today at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        return d.toLocaleDateString();
    };

    const [showOptions, setShowOptions] = useState(false);

    useEffect(() => {
        navigation.setOptions({
            headerTitle: () => (
                <TouchableOpacity
                    style={styles.headerTitleContainer}
                    onPress={() => navigation.navigate('Profile', { userId: otherUser._id })}
                >
                    <Image
                        source={getAvatarSource(otherUser)}
                        style={styles.headerAvatar}
                    />
                    <View>
                        <Text style={styles.headerName}>{otherUser?.name}</Text>
                        {isRemoteUserTyping ? (
                            <Text style={styles.typingText}>typing...</Text>
                        ) : (
                            <Text style={otherUserStatus.isOnline ? styles.onlineText : styles.offlineText}>
                                {otherUserStatus.isOnline ? 'Online' : (otherUserStatus.lastSeen ? `Last seen ${formatLastSeen(otherUserStatus.lastSeen)}` : 'Offline')}
                            </Text>
                        )}
                    </View>
                </TouchableOpacity>
            ),
            headerRight: () => (
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.headerButton} onPress={handleVoiceCall}>
                        <Ionicons name="call" size={24} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerButton} onPress={handleVideoCall}>
                        <Ionicons name="videocam" size={24} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerButton} onPress={() => setShowOptions(true)}>
                        <Ionicons name="ellipsis-vertical" size={24} color={theme.colors.primary} />
                    </TouchableOpacity>
                </View>
            )
        });
    }, [otherUser, isRemoteUserTyping, isBlocked, otherUserStatus]);

    const handleVoiceCall = () => {
        if (isBlocked) {
            Toast.show({ type: 'error', text1: 'User is blocked', text2: 'Unblock to call' });
            return;
        }
        startCall({ _id: otherUser._id || otherUser.id, name: otherUser.name, avatar: otherUser.profilePicture }, 'voice');
        navigation.navigate('Call', {
            callType: 'voice',
            otherUser: { _id: otherUser._id || otherUser.id, name: otherUser.name, avatar: otherUser.profilePicture },
            isIncoming: false
        });
    };

    const handleVideoCall = () => {
        if (isBlocked) {
            Toast.show({ type: 'error', text1: 'User is blocked', text2: 'Unblock to call' });
            return;
        }
        startCall({ _id: otherUser._id || otherUser.id, name: otherUser.name, avatar: otherUser.profilePicture }, 'video');
        navigation.navigate('Call', {
            callType: 'video',
            otherUser: { _id: otherUser._id || otherUser.id, name: otherUser.name, avatar: otherUser.profilePicture },
            isIncoming: false
        });
    };

    const handleBlockUser = async () => {
        try {
            const endpoint = isBlocked ? `/social/users/${otherUser._id}/unblock` : `/social/users/${otherUser._id}/block`;
            await api.post(endpoint);
            setIsBlocked(!isBlocked);
            setShowOptions(false);
            Toast.show({ type: 'success', text1: isBlocked ? 'User unblocked' : 'User blocked' });
        } catch (error) {
            console.error('Block error:', error);
            Toast.show({ type: 'error', text1: 'Action failed' });
        }
    };

    const handleClearChat = async () => {
        try {
            await api.delete(`/chat/conversations/${conversation._id}/messages`);
            setMessages([]);
            setShowOptions(false);
            Toast.show({ type: 'success', text1: 'Chat cleared' });
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Failed to clear chat' });
        }
    };

    const handleDeleteConversation = async () => {
        try {
            await api.delete(`/chat/conversations/${conversation._id}`);
            Toast.show({ type: 'success', text1: 'Conversation deleted' });
            navigation.goBack();
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Failed to delete conversation' });
        }
    };

    // Main Socket Logic
    useEffect(() => {
        dispatch(setActiveConversation(conversation._id));
        fetchMessages();

        socketService.on('message_received', handleMessageReceived);
        socketService.on('message_status_update', handleMessageStatusUpdate); // WhatsApp Ticks
        socketService.on('user_typing', handleUserTyping);
        socketService.on('user_stop_typing', handleUserStopTyping);
        socketService.on('message_edited', handleMessageEdited);
        socketService.on('message_deleted', handleMessageDeleted);
        socketService.on('reaction_added', handleReactionAdded);

        return () => {
            dispatch(setActiveConversation(null));
            socketService.off('message_received', handleMessageReceived);
            socketService.off('message_status_update', handleMessageStatusUpdate);
            socketService.off('user_typing', handleUserTyping);
            socketService.off('user_stop_typing', handleUserStopTyping);
            socketService.off('message_edited', handleMessageEdited);
            socketService.off('message_deleted', handleMessageDeleted);
            socketService.off('reaction_added', handleReactionAdded);
        };
    }, [conversation._id]);

    const handleMessageStatusUpdate = (data) => {
        setMessages(prev => prev.map(m =>
            m._id === data.messageId ? { ...m, status: data.status } : m
        ));
    };

    const handleMessageEdited = (data) => {
        setMessages(prev => prev.map(m => m._id === data.messageId ? { ...m, content: data.content, isEdited: true } : m));
    };

    const handleMessageDeleted = (data) => {
        setMessages(prev => prev.map(m => m._id === data.messageId ? { ...m, isDeleted: true, content: '🚫 This message was deleted' } : m));
    };

    const handleReactionAdded = (data) => {
        setMessages(prev => prev.map(m => {
            if (m._id === data.messageId) {
                const reactions = m.reactions || [];
                const existingIndex = reactions.findIndex(r => r.user?._id === data.userId || r.user === data.userId);
                if (existingIndex > -1) {
                    reactions[existingIndex].emoji = data.emoji;
                } else {
                    reactions.push({ user: data.userId, emoji: data.emoji });
                }
                return { ...m, reactions: [...reactions] };
            }
            return m;
        }));
    };

    const fetchMessages = async () => {
        try {
            const response = await api.get(`/chat/conversations/${conversation._id}/messages`);
            setMessages(response.data.messages || []);
        } catch (error) {
            console.error('Fetch messages error:', error);
        }
    };

    const handleMessageReceived = (message) => {
        if (message.conversation === conversation._id) {
            setMessages(prev => [...prev, message]);
        }
    };

    const handleUserTyping = (data) => {
        if (data.conversationId === conversation._id && data.userId === otherUser._id) {
            setIsRemoteUserTyping(true);
        }
    };

    const handleUserStopTyping = (data) => {
        if (data.conversationId === conversation._id && data.userId === otherUser._id) {
            setIsRemoteUserTyping(false);
        }
    };

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;

        const content = inputText.trim();
        const tempId = Date.now().toString();

        const tempMessage = {
            _id: tempId,
            conversation: conversation._id,
            sender: { _id: user.id || user._id, name: user.name, avatar: user.avatar },
            receiver: otherUser,
            content: content,
            type: 'text',
            createdAt: new Date(),
            pending: true,
            status: 'sent', // Initial status
            replyTo: replyTo
        };

        setMessages(prev => [...prev, tempMessage]);
        setInputText('');
        setReplyTo(null);
        handleStopTyping();

        try {
            if (editingMessage) {
                await api.put(`/chat/messages/${editingMessage._id}`, { content });
                setEditingMessage(null);
            } else {
                const res = await api.post('/chat/messages', {
                    conversationId: conversation._id,
                    receiverId: otherUser._id || otherUser.id,
                    content: content,
                    type: 'text',
                    replyTo: replyTo?._id,
                });
                const realMessage = res.data.message;
                // Replace temp message with real one
                setMessages(prev => prev.map(m => m._id === tempId ? realMessage : m));
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Failed to send message' });
            setMessages(prev => prev.filter(m => m._id !== tempId));
            setInputText(content);
        }
    };

    const handleActionModal = (message) => {
        setSelectedMessage(message);
        setIsActionModalVisible(true);
    };

    const handleAction = async (action) => {
        setIsActionModalVisible(false);
        if (!selectedMessage) return;

        switch (action) {
            case 'reply':
                setReplyTo(selectedMessage);
                setEditingMessage(null);
                break;
            case 'edit':
                const senderId = selectedMessage.sender._id || selectedMessage.sender.id || selectedMessage.sender;
                const currentUserId = user.id || user._id;

                if (String(senderId) === String(currentUserId)) {
                    setEditingMessage(selectedMessage);
                    setReplyTo(null);
                    setInputText(selectedMessage.content);
                } else {
                    Toast.show({ type: 'info', text1: 'Info', text2: 'You can only edit your own messages' });
                }
                break;
            case 'delete':
                const delSenderId = selectedMessage.sender._id || selectedMessage.sender.id || selectedMessage.sender;
                const delCurrentUserId = user.id || user._id;

                if (String(delSenderId) === String(delCurrentUserId)) {
                    try {
                        await api.delete(`/chat/messages/${selectedMessage._id}`);
                        setMessages(prev => prev.map(m => m._id === selectedMessage._id ? { ...m, isDeleted: true, content: '🚫 This message was deleted' } : m));
                    } catch (error) {
                        Toast.show({ type: 'error', text1: 'Failed to delete' });
                    }
                } else {
                    Toast.show({ type: 'info', text1: 'Info', text2: 'You can only delete your own messages' });
                }
                break;
            case 'forward':
                handleForward(selectedMessage);
                break;
            default:
                break;
        }
    };

    const handleReact = async (emoji) => {
        if (!selectedMessage) return;
        try {
            await api.post(`/chat/messages/${selectedMessage._id}/react`, { emoji });
        } catch (error) {
            console.error('React error:', error);
        }
        setIsActionModalVisible(false);
    };

    const fetchContacts = async () => {
        try {
            const response = await api.get('/social/users');
            setContacts(response.data.users || []);
        } catch (error) {
            console.error('Fetch contacts error:', error);
        }
    };

    const handleForward = (message) => {
        setForwardMessage(message);
        fetchContacts();
        setIsForwardModalVisible(true);
    };

    const confirmForward = async (targetUser) => {
        try {
            const convResponse = await api.post('/chat/conversations', { participantId: targetUser._id });
            const conversationId = convResponse.data.conversation._id;

            socketService.emit('send_message', {
                conversationId: conversationId,
                senderId: user._id,
                receiverId: targetUser._id,
                content: forwardMessage.content,
                type: forwardMessage.type,
                mediaUrl: forwardMessage.mediaUrl,
                isForwarded: true
            });

            Toast.show({ type: 'success', text1: 'Success', text2: `Message forwarded to ${targetUser.name}` });
            setIsForwardModalVisible(false);
            setForwardMessage(null);
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to forward message' });
        }
    };

    const handleSendImage = async (imageUri) => {
        try {
            setUploading(true);
            const uploadedImage = await uploadImage(imageUri);
            const newMessage = { conversation: conversation._id, sender: user, receiver: otherUser, content: '📷 Image', type: 'image', mediaUrl: uploadedImage.url, createdAt: new Date() };
            // Optimistic
            setMessages(prev => [...prev, { ...newMessage, _id: Date.now().toString() }]);
            socketService.emit('send_message', { ...newMessage, senderId: user._id || user.id, receiverId: otherUser._id });
            Toast.show({ type: 'success', text1: 'Image sent!' });
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Failed to send image' });
        } finally {
            setUploading(false);
        }
    };

    const handleSendVideo = async (videoUri) => {
        try {
            setUploading(true);
            const result = await uploadVideo(videoUri);
            const messageData = { conversationId: conversation._id, senderId: user._id, receiverId: otherUser._id, content: '🎥 Video', type: 'video', mediaUrl: result.url };
            setMessages(prev => [...prev, { ...messageData, _id: Date.now().toString(), createdAt: new Date(), sender: user }]);
            socketService.emit('send_message', messageData);
        } catch (error) { Toast.show({ type: 'error', text1: 'Failed to send video' }); } finally { setUploading(false); }
    };

    const handleSendDocument = async (doc) => {
        try {
            setUploading(true);
            const result = await uploadDocument(doc.uri, doc.name);
            const messageData = { conversationId: conversation._id, senderId: user._id, receiverId: otherUser._id, content: `📄 ${doc.name}`, type: 'document', mediaUrl: result.url, mediaSize: doc.size, documentName: doc.name };
            setMessages(prev => [...prev, { ...messageData, _id: Date.now().toString(), createdAt: new Date(), sender: user }]);
            socketService.emit('send_message', messageData);
        } catch (error) { Toast.show({ type: 'error', text1: 'Failed to send document' }); } finally { setUploading(false); }
    };

    const startRecording = async () => {
        try {
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') return;
            await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
            const { recording: newRecording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
            setRecording(newRecording);
            setIsRecording(true);
            setRecordingDuration(0);
            Animated.loop(Animated.sequence([Animated.timing(pulseAnim, { toValue: 1.3, duration: 500, useNativeDriver: true }), Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true })])).start();
            durationInterval.current = setInterval(() => setRecordingDuration(prev => prev + 1), 1000);
        } catch (error) { console.error(error); }
    };

    const stopRecording = async () => {
        if (!recording) return null;
        try {
            pulseAnim.stopAnimation(); pulseAnim.setValue(1); clearInterval(durationInterval.current); setIsRecording(false);
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setRecording(null);
            return uri;
        } catch (error) { return null; }
    };

    const handleSendVoiceNote = async () => {
        const uri = await stopRecording();
        if (!uri) return;
        try {
            setUploading(true);
            const uploadedAudio = await uploadAudio(uri);
            const messageData = { conversationId: conversation._id, senderId: user._id, receiverId: otherUser._id, content: `🎤 Voice message (${recordingDuration}s)`, type: 'audio', mediaUrl: uploadedAudio.url, mediaDuration: recordingDuration };
            setMessages(prev => [...prev, { ...messageData, _id: Date.now().toString(), createdAt: new Date(), sender: user }]);
            socketService.emit('send_message', messageData);
            setRecordingDuration(0);
        } catch (error) { Toast.show({ type: 'error', text1: 'Failed' }); } finally { setUploading(false); }
    };

    const handleCancelRecording = async () => { await stopRecording(); setRecordingDuration(0); };
    const handleAttachmentPress = () => setIsAttachmentModalVisible(true);
    const handleTyping = (text) => {
        setInputText(text);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        socketService.emit('typing', { conversationId: conversation._id, userId: user._id, receiverId: otherUser._id });
        typingTimeoutRef.current = setTimeout(() => socketService.emit('stop_typing', { conversationId: conversation._id, userId: user._id, receiverId: otherUser._id }), 2000);
    };
    const handleStopTyping = () => socketService.emit('stop_typing', { conversationId: conversation._id, userId: user._id, receiverId: otherUser._id });

    const formatTime = (date) => new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const formatDuration = (seconds) => { const mins = Math.floor(seconds / 60); const secs = seconds % 60; return `${mins}:${secs.toString().padStart(2, '0')}`; };

    // New Render Message using MessageBubble
    const renderMessage = ({ item }) => {
        const getMediaUrl = (url) => {
            if (!url) return null;
            if (url.includes(':1000')) return url.replace(':1000', ':2000');
            if (url.startsWith('http') || url.startsWith('file')) return url;
            return `https://uberappbackend.onrender.com/${url.replace(/^\/+/, '')}`;
        };

        const playVoiceNote = async (url, messageId) => {
            try {
                const mediaUrl = getMediaUrl(url);
                if (playingAudioId === messageId) {
                    if (soundObjectRef.current) {
                        const status = await soundObjectRef.current.getStatusAsync();
                        if (status.isPlaying) {
                            await soundObjectRef.current.pauseAsync();
                            setPlayingAudioId(null);
                        } else {
                            await soundObjectRef.current.playAsync();
                            setPlayingAudioId(messageId);
                        }
                    }
                    return;
                }
                if (soundObjectRef.current) {
                    await soundObjectRef.current.unloadAsync();
                    soundObjectRef.current = null;
                }
                await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
                const { sound } = await Audio.Sound.createAsync(
                    { uri: mediaUrl },
                    { shouldPlay: true },
                    (status) => { if (status.didJustFinish) setPlayingAudioId(null); }
                );
                soundObjectRef.current = sound;
                setPlayingAudioId(messageId);
            } catch (error) { console.error('Play error', error); }
        };

        return (
            <MessageBubble
                item={item}
                userId={user.id || user._id}
                onLongPress={handleActionModal}
                onImagePress={(uri) => setSelectedImage(uri)}
                onPlayAudio={playVoiceNote}
                playingAudioId={playingAudioId}
                getMediaUrl={getMediaUrl}
                formatDuration={formatDuration}
                formatTime={formatTime}
            />
        );
    };

    return (
        <View style={styles.container}>
            {replyTo && (
                <View style={styles.replyPreviewOuter}>
                    <Text style={styles.replySender}>Replying to {replyTo.sender?.name}</Text>
                    <Text numberOfLines={1}>{replyTo.content}</Text>
                    <TouchableOpacity onPress={() => setReplyTo(null)} style={styles.closeReply}><Text>✕</Text></TouchableOpacity>
                </View>
            )}
            {editingMessage && (
                <View style={styles.editIndicator}>
                    <Text>Editing...</Text>
                    <TouchableOpacity onPress={() => { setEditingMessage(null); setInputText(''); }} style={styles.closeReply}><Text>✕</Text></TouchableOpacity>
                </View>
            )}

            <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item, index) => item._id || index.toString()}
                    contentContainerStyle={styles.messagesList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                />

                {isRecording ? (
                    <View style={styles.recordingContainer}>
                        <TouchableOpacity onPress={handleCancelRecording}><Text style={styles.cancelText}>✕</Text></TouchableOpacity>
                        <Text style={styles.recordingTime}>{formatDuration(recordingDuration)}</Text>
                        <TouchableOpacity onPress={handleSendVoiceNote} style={styles.sendVoiceButton}><Text style={styles.sendVoiceText}>Send</Text></TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.inputContainer}>
                        <TouchableOpacity style={styles.attachButton} onPress={handleAttachmentPress}><Ionicons name="attach" size={24} color="#666" /></TouchableOpacity>
                        <TextInput style={styles.input} placeholder="Type a message..." value={inputText} onChangeText={handleTyping} multiline />
                        {inputText.trim() ? (
                            <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}><Ionicons name="send" size={20} color="#fff" /></TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={styles.micButton} onPress={startRecording}><Ionicons name="mic" size={20} color="#333" /></TouchableOpacity>
                        )}
                    </View>
                )}
            </KeyboardAvoidingView>

            <Modal transparent visible={isActionModalVisible} animationType="fade" onRequestClose={() => setIsActionModalVisible(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsActionModalVisible(false)}>
                    <View style={styles.actionMenu}>
                        <View style={styles.actionItems}>
                            <TouchableOpacity style={styles.actionOption} onPress={() => handleAction('reply')}><Text style={styles.actionOptionText}>Reply</Text></TouchableOpacity>
                            <TouchableOpacity style={styles.actionOption} onPress={() => handleAction('edit')}><Text style={styles.actionOptionText}>Edit</Text></TouchableOpacity>
                            <TouchableOpacity style={styles.actionOption} onPress={() => handleAction('forward')}><Text style={styles.actionOptionText}>Forward</Text></TouchableOpacity>
                            <TouchableOpacity style={styles.actionOption} onPress={() => handleAction('delete')}><Text style={[styles.actionOptionText, { color: 'red' }]}>Delete</Text></TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal transparent visible={showOptions} animationType="fade" onRequestClose={() => setShowOptions(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowOptions(false)}>
                    <View style={styles.actionMenu}>
                        <TouchableOpacity style={styles.actionOption} onPress={handleBlockUser}>
                            <Text style={[styles.actionOptionText, { color: 'red' }]}>{isBlocked ? 'Unblock User' : 'Block User'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionOption} onPress={handleClearChat}>
                            <Text style={styles.actionOptionText}>Clear Chat</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionOption} onPress={handleDeleteConversation}>
                            <Text style={[styles.actionOptionText, { color: 'red' }]}>Delete Conversation</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionOption} onPress={() => setShowOptions(false)}>
                            <Text style={styles.actionOptionText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Blocked UI Overlay or Text check */}
            {isBlocked && (
                <View style={styles.blockedContainer}>
                    <Text style={styles.blockedText}>You have blocked this user.</Text>
                    <TouchableOpacity onPress={handleBlockUser}><Text style={styles.unblockText}>Unblock</Text></TouchableOpacity>
                </View>
            )}

            <Modal visible={isForwardModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setIsForwardModalVisible(false)}>
                <View style={styles.forwardContainer}>
                    <View style={styles.forwardHeader}>
                        <Text style={styles.forwardTitle}>Forward to...</Text>
                        <TouchableOpacity onPress={() => setIsForwardModalVisible(false)}><Text style={styles.forwardClose}>Cancel</Text></TouchableOpacity>
                    </View>
                    <FlatList
                        data={contacts}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.contactItem} onPress={() => confirmForward(item)}>
                                <Image source={getAvatarSource(item)} style={styles.contactAvatar} />
                                <Text style={styles.contactName}>{item.name}</Text>
                                <TouchableOpacity style={styles.forwardBtn} onPress={() => confirmForward(item)}><Text style={styles.forwardBtnText}>Send</Text></TouchableOpacity>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </Modal>

            {/* Attachment Modal */}
            <Modal visible={isAttachmentModalVisible} transparent animationType="slide" onRequestClose={() => setIsAttachmentModalVisible(false)}>
                <TouchableOpacity style={styles.modalOverlay} onPress={() => setIsAttachmentModalVisible(false)}>
                    <View style={styles.attachmentSheet}>
                        <Text style={styles.sheetTitle}>Share</Text>
                        <View style={styles.sheetGrid}>
                            <TouchableOpacity style={styles.sheetItem} onPress={async () => { setIsAttachmentModalVisible(false); const photo = await takePhoto(); if (photo) handleSendImage(photo.uri); }}><Text>📷 Camera</Text></TouchableOpacity>
                            <TouchableOpacity style={styles.sheetItem} onPress={async () => { setIsAttachmentModalVisible(false); const vid = await pickVideo(); if (vid) handleSendVideo(vid.uri); }}><Text>🎥 Video</Text></TouchableOpacity>
                            <TouchableOpacity style={styles.sheetItem} onPress={async () => { setIsAttachmentModalVisible(false); const res = await pickMedia(); if (res) handleSendImage(res.uri); }}><Text>🖼 Gallery</Text></TouchableOpacity>
                        </View>
                        <TouchableOpacity style={styles.cancelSheetBtn} onPress={() => setIsAttachmentModalVisible(false)}><Text style={styles.cancelSheetText}>Cancel</Text></TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f2f2f2' },
    headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
    headerAvatar: { width: 35, height: 35, borderRadius: 17.5, marginRight: 10 },
    headerName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    onlineText: { fontSize: 12, color: '#4caf50' },
    offlineText: { fontSize: 12, color: '#666' },
    typingText: { fontSize: 12, color: '#007bff', fontStyle: 'italic' },
    headerRight: { flexDirection: 'row', gap: 15 },
    headerButton: { padding: 5 },
    messagesList: { padding: 15, paddingBottom: 20 },
    replyPreviewOuter: {
        backgroundColor: '#f9f9f9', padding: 10, borderLeftWidth: 4, borderLeftColor: theme.colors.primary,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 10, marginTop: 10
    },
    replySender: { fontWeight: 'bold', color: theme.colors.primary, marginBottom: 2 },
    closeReply: { padding: 5 },
    editIndicator: {
        backgroundColor: '#fff3cd', padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 10, marginTop: 10
    },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee'
    },
    attachButton: { padding: 10 },
    input: {
        flex: 1, backgroundColor: '#f9f9f9', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8,
        marginHorizontal: 10, maxHeight: 100, fontSize: 16
    },
    sendButton: { backgroundColor: theme.colors.primary, padding: 10, borderRadius: 20 },
    micButton: { backgroundColor: '#eee', padding: 10, borderRadius: 20 },
    recordingContainer: {
        flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', justifyContent: 'space-between'
    },
    cancelText: { fontSize: 16, color: 'red', padding: 10 },
    recordingTime: { fontSize: 18, fontWeight: 'bold', color: theme.colors.primary },
    sendVoiceButton: { backgroundColor: theme.colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
    sendVoiceText: { color: '#fff', fontWeight: 'bold' },

    // Modal & Sheet Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    actionMenu: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
    actionItems: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
    actionOption: { paddingVertical: 15, alignItems: 'center' },
    actionOptionText: { fontSize: 16, fontWeight: '500' },
    blockedContainer: {
        position: 'absolute', bottom: 70, left: 20, right: 20, backgroundColor: '#333',
        padding: 15, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
    },
    blockedText: { color: '#fff' },
    unblockText: { color: '#4caf50', fontWeight: 'bold' },

    // Forward Modal
    forwardContainer: { flex: 1, backgroundColor: '#fff', paddingTop: 50 },
    forwardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
    forwardTitle: { fontSize: 18, fontWeight: 'bold' },
    forwardClose: { fontSize: 16, color: 'blue' },
    contactItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f9f9f9' },
    contactAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 15 },
    contactName: { fontSize: 16, flex: 1 },
    forwardBtn: { backgroundColor: '#eee', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 15 },
    forwardBtnText: { color: '#333', fontSize: 12 },

    // Attachment Sheet
    attachmentSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
    sheetTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    sheetGrid: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
    sheetItem: { alignItems: 'center', padding: 10 },
    cancelSheetBtn: { padding: 15, alignItems: 'center', backgroundColor: '#f2f2f2', borderRadius: 10 },
    cancelSheetText: { fontSize: 16, fontWeight: '600' }
});
