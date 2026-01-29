import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Platform,
    Alert, StatusBar, Modal, FlatList, Vibration, SafeAreaView
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import socketService from '../services/socket';
import api from '../services/api';
import Toast from 'react-native-toast-message';
import { getAvatarWithInitials } from '../utils/avatar';
import { useCall } from '../context/CallContext';

const { width, height } = Dimensions.get('window');

export default function CallScreen({ route }) {
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const {
        callStatus, otherUser: contextOtherUser, duration, callType: contextCallType, remoteFrame,
        endCall, answerCall, startCall,
    } = useCall();

    const { callType, otherUser: routeOtherUser, isIncoming, callerName } = route.params || {};
    const otherUser = contextOtherUser || routeOtherUser;

    const [hasPermission, setHasPermission] = useState(null);
    const [isAddParticipantVisible, setIsAddParticipantVisible] = useState(false);
    const [contacts, setContacts] = useState([]);
    const [localIsMuted, setLocalIsMuted] = useState(false);
    const [localIsVideoOff, setLocalIsVideoOff] = useState(callType === 'voice');
    const [isSpeaker, setIsSpeaker] = useState(false);
    const [isSwapped, setIsSwapped] = useState(true); // Default: Local Full, Remote Small

    const cameraRef = useRef(null);
    const streamingInterval = useRef(null);
    const wasActiveRef = useRef(false);

    useEffect(() => {
        const prepare = async () => {
            const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
            const { status: audioStatus } = await Audio.requestPermissionsAsync();
            setHasPermission(cameraStatus === 'granted' && audioStatus === 'granted');

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                staysActiveInBackground: true,
                playThroughEarpieceAndroid: true,
            });

            if (!isIncoming && callStatus === 'Idle') {
                startCall(routeOtherUser, callType);
            }
        };
        prepare();
    }, []);

    useEffect(() => {
        if (callStatus === 'Connected' || callStatus === 'Incoming...' || callStatus === 'Calling...') {
            wasActiveRef.current = true;
        }

        if (callStatus === 'Idle' && wasActiveRef.current) {
            // Call ended remotely or locally, close screen
            wasActiveRef.current = false;
            // Short delay to show "Call Ended"?
            setTimeout(() => {
                if (navigation.canGoBack()) {
                    navigation.goBack();
                } else {
                    // Fallback: If we can't go back, navigate to Main -> Chat (if we have info) or just Main
                    navigation.navigate('MainTabs', { screen: 'Chat' });
                }
            }, 500);
        }
    }, [callStatus]);

    // 40s Timeout for Outgoing Calls
    useEffect(() => {
        let timeout;
        if (callStatus === 'Calling...' && !isIncoming) {
            timeout = setTimeout(() => {
                Toast.show({ type: 'info', text1: 'No Answer', text2: 'User did not pick up.' });
                endCall();
            }, 40000);
        }
        return () => clearTimeout(timeout);
    }, [callStatus, isIncoming]);

    useEffect(() => {
        if (callStatus === 'Connected' && !localIsVideoOff && callType === 'video' && isFocused) {
            startStreaming();
        } else {
            stopStreaming();
        }
        return () => stopStreaming();
    }, [callStatus, localIsVideoOff, callType, isFocused]);

    const startStreaming = () => {
        if (streamingInterval.current) return;
        streamingInterval.current = setInterval(async () => {
            if (cameraRef.current) {
                try {
                    const photo = await cameraRef.current.takePictureAsync({
                        base64: true,
                        quality: 0.3,
                        skipProcessing: true,
                        scale: 0.3
                    });
                    if (photo.base64) {
                        socketService.emit('video_frame', {
                            to: otherUser?._id || otherUser?.id,
                            frame: photo.base64
                        });
                    }
                } catch (err) { }
            }
        }, 500);
    };

    const stopStreaming = () => {
        if (streamingInterval.current) {
            clearInterval(streamingInterval.current);
            streamingInterval.current = null;
        }
    };

    const toggleMute = () => setLocalIsMuted(!localIsMuted);

    const toggleVideo = () => {
        const newValue = !localIsVideoOff;
        setLocalIsVideoOff(newValue);
        socketService.emit('toggle_media', {
            to: otherUser?._id || otherUser?.id,
            type: 'video',
            status: !newValue
        });
    };

    const toggleSpeaker = async () => {
        const newSpeaker = !isSpeaker;
        setIsSpeaker(newSpeaker);
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            playThroughEarpieceAndroid: !newSpeaker,
        });
    };

    const handleEndCall = () => {
        endCall();
        navigation.goBack();
    };

    const handleAnswer = () => answerCall();

    const handleMinimize = () => navigation.goBack();

    const swapVideo = () => setIsSwapped(!isSwapped);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const fetchContacts = async () => {
        try {
            const response = await api.get('/social/users');
            setContacts(response.data.users || []);
        } catch (error) {
            console.error('Fetch contacts error:', error);
        }
    };

    const handleAddParticipant = () => {
        fetchContacts();
        setIsAddParticipantVisible(true);
    };

    const confirmAddParticipant = (contact) => {
        socketService.emit('call_user', {
            userToCall: contact._id,
            from: otherUser._id,
            name: otherUser.name,
            callType: callType,
            isGroupCall: true,
            existingCallId: otherUser._id
        });
        Toast.show({ type: 'success', text1: 'Calling', text2: `Adding ${contact.name} to call...` });
        setIsAddParticipantVisible(false);
    };

    // Render Helpers
    const dynamicRemoteSource = remoteFrame
        ? `data:image/jpeg;base64,${remoteFrame}`
        : (otherUser?.profilePicture || otherUser?.avatar || 'https://images.unsplash.com/photo-1516245834210-c4c142787335?q=80&w=1000&auto=format&fit=crop');

    const renderRemoteVideo = (isFull = true) => (
        <View style={isFull ? styles.remoteVideo : styles.previewVideo}>
            <Image
                source={{ uri: dynamicRemoteSource }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
            />
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.3)']}
                style={StyleSheet.absoluteFill}
            />
        </View>
    );

    const renderLocalCamera = (isFull = true) => (
        <View style={isFull ? styles.localCameraFullScreen : styles.localCameraPreview}>
            {typeof CameraView !== 'undefined' ? (
                <CameraView
                    ref={cameraRef}
                    style={styles.camera}
                    facing="front"
                    animateShutter={false}
                />
            ) : (
                <View style={[styles.camera, { backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ color: '#555', fontSize: 10 }}>WAITING...</Text>
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Background Layer */}
            {/* Background Layer */}
            <LinearGradient
                colors={callType === 'voice' ? ['#1a2a6c', '#b21f1f', '#fdbb2d'] : ['#000', '#000']}
                style={styles.background}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {/* VOICE CALL UI */}
                {callType === 'voice' && (
                    <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                        <View style={styles.voicePulseContainer}>
                            <View style={[styles.pulseCircle, { transform: [{ scale: 1.2 }], opacity: 0.3 }]} />
                            <View style={[styles.pulseCircle, { transform: [{ scale: 1.1 }], opacity: 0.5 }]} />
                            <Image
                                source={{ uri: otherUser?.profilePicture || otherUser?.avatar || getAvatarWithInitials(otherUser?.name || callerName, 200) }}
                                style={styles.voiceAvatar}
                            />
                        </View>
                        {callStatus === 'Connected' && (
                            <Text style={styles.voiceTimer}>{formatTime(duration)}</Text>
                        )}
                        <Text style={styles.voiceUserName}>{otherUser?.name || callerName}</Text>
                        <Text style={styles.voiceStatus}>{callStatus}</Text>
                    </View>
                )}

                {/* VIDEO CALL UI */}
                {callType === 'video' && (
                    <View style={StyleSheet.absoluteFill}>
                        {/* 1. Main Fullscreen Video (Remote User usually, or Local if swapped) */}
                        <View style={StyleSheet.absoluteFill}>
                            {callStatus === 'Connected' ? (
                                isSwapped ? renderLocalCamera(true) : renderRemoteVideo(true)
                            ) : (
                                // While connecting, show Local Camera full screen so user sees themselves
                                renderLocalCamera(true)
                            )}
                        </View>

                        {/* 2. Floating PIP Video (Self usually, or Remote if swapped) */}
                        {callStatus === 'Connected' && !localIsVideoOff && (
                            <TouchableOpacity
                                activeOpacity={0.9}
                                style={[styles.miniPreviewContainer, isSwapped ? { borderColor: theme.colors.primary } : {}]}
                                onPress={swapVideo}
                            >
                                {isSwapped ? renderRemoteVideo(false) : renderLocalCamera(false)}
                            </TouchableOpacity>
                        )}

                        {/* 3. Helper Text if Video is Swapped/Off */}
                        {localIsVideoOff && callStatus === 'Connected' && (
                            <View style={styles.miniPreviewContainer}>
                                <View style={{ flex: 1, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }}>
                                    <Text style={{ fontSize: 30 }}>📷</Text>
                                    <Text style={{ color: '#fff', fontSize: 10, marginTop: 4 }}>Camera Off</Text>
                                </View>
                            </View>
                        )}
                    </View>
                )}
            </LinearGradient>

            {/* Remove the old mini preview block that was outside LinearGradient to avoid duplication/z-index issues */}

            {/* Content Layer */}
            <SafeAreaView style={[styles.content, { pointerEvents: 'box-none' }]}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.minimizeBtn} onPress={handleMinimize}>
                        <Text style={styles.minimizeIcon}>⌄</Text>
                    </TouchableOpacity>

                    {/* Only show header status for Video calls, because Voice call has it central */}
                    {callType === 'video' && (
                        <View style={styles.headerCenter}>
                            <Text style={styles.statusText}>{callStatus}</Text>
                            {callStatus === 'Connected' && (
                                <Text style={styles.timerText}>{formatTime(duration)}</Text>
                            )}
                        </View>
                    )}

                    {callStatus === 'Connected' && (
                        <TouchableOpacity style={styles.addParticipantBtn} onPress={handleAddParticipant}>
                            <Text style={styles.addParticipantIcon}>👤+</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Main Info (Overlay for Video Call mainly) */}
                {callType === 'video' && (callStatus !== 'Connected' || localIsVideoOff) && (
                    <View style={styles.mainInfo}>
                        {/* User requested ONLY their face (local camera) to be visible when not connected. 
                            So we remove the Avatar image overlay. 
                            If video is OFF, we might want to show it, but for 'Calling...' with video ON, hide it.
                        */}
                        {localIsVideoOff && (
                            <View style={styles.avatarGlow}>
                                <Image
                                    source={{ uri: otherUser?.profilePicture || otherUser?.avatar || getAvatarWithInitials(otherUser?.name || callerName, 150) }}
                                    style={styles.avatar}
                                />
                            </View>
                        )}

                        {/* Keep text so they know who they are calling, but maybe smaller? */}
                        <Text style={styles.username}>{otherUser?.name || callerName}</Text>
                        <Text style={styles.callTypeLabel}>VIDEO CALL</Text>
                    </View>
                )}

                {/* Bottom Controls */}
                <View style={styles.bottomSection}>
                    {isIncoming && callStatus === 'Incoming...' ? (
                        <View style={styles.incomingActions}>
                            <TouchableOpacity style={styles.actionBtn} onPress={handleEndCall}>
                                <View style={[styles.iconCircle, { backgroundColor: '#ff3b30' }]}>
                                    <Text style={styles.actionIcon}>📞</Text>
                                </View>
                                <Text style={styles.actionLabel}>Decline</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionBtn} onPress={handleAnswer}>
                                <View style={[styles.iconCircle, { backgroundColor: '#4cd964' }]}>
                                    <Text style={styles.actionIcon}>📞</Text>
                                </View>
                                <Text style={styles.actionLabel}>Accept</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.activeActions}>
                            <View style={styles.controlsRow}>
                                <TouchableOpacity style={[styles.secondaryBtn, localIsMuted && styles.activeSecondaryBtn]} onPress={toggleMute}>
                                    <Text style={styles.secondaryIcon}>{localIsMuted ? '🔇' : '🎙️'}</Text>
                                    <Text style={styles.secondaryLabel}>Mute</Text>
                                </TouchableOpacity>

                                {callType === 'video' && (
                                    <TouchableOpacity style={[styles.secondaryBtn, localIsVideoOff && styles.activeSecondaryBtn]} onPress={toggleVideo}>
                                        <Text style={styles.secondaryIcon}>{localIsVideoOff ? '🚫' : '📹'}</Text>
                                        <Text style={styles.secondaryLabel}>Video</Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity style={[styles.secondaryBtn, isSpeaker && styles.activeSecondaryBtn]} onPress={toggleSpeaker}>
                                    <Text style={styles.secondaryIcon}>{isSpeaker ? '🔊' : '🔈'}</Text>
                                    <Text style={styles.secondaryLabel}>Speaker</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity style={styles.hangupBtn} onPress={handleEndCall}>
                                <Text style={styles.hangupIcon}>📞</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </SafeAreaView>

            {/* Add Participant Modal */}
            <Modal
                transparent
                visible={isAddParticipantVisible}
                animationType="slide"
                onRequestClose={() => setIsAddParticipantVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <FlatList
                            data={contacts}
                            keyExtractor={item => item._id}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.contactItem} onPress={() => confirmAddParticipant(item)}>
                                    <Image
                                        source={{ uri: item.profilePicture || getAvatarWithInitials(item.name) }}
                                        style={styles.contactAvatar}
                                    />
                                    <Text style={styles.contactName}>{item.name}</Text>
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity style={styles.closeBtn} onPress={() => setIsAddParticipantVisible(false)}>
                            <Text style={styles.closeBtnText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    background: { flex: 1 },
    remoteVideo: { flex: 1, backgroundColor: '#000' },
    previewVideo: { flex: 1, borderRadius: 12 },
    localCameraFullScreen: { flex: 1 },
    localCameraPreview: { flex: 1, borderRadius: 12 },
    camera: { flex: 1 },
    backgroundAvatar: { width: '100%', height: '100%', resizeMode: 'cover', opacity: 0.5 },
    miniPreviewContainer: {
        position: 'absolute',
        top: 100,
        right: 20,
        width: 100,
        height: 150,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#fff',
        zIndex: 50,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5
    },
    content: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10
    },
    minimizeBtn: { padding: 10 },
    minimizeIcon: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    headerCenter: { alignItems: 'center' },
    statusText: { color: '#fff', fontSize: 16, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 2 },
    timerText: { color: '#4cd964', fontSize: 14, marginTop: 4, fontWeight: 'bold' },
    addParticipantBtn: { padding: 10 },
    addParticipantIcon: { color: '#fff', fontSize: 20 },
    mainInfo: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
    avatarGlow: {
        padding: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 80,
        marginBottom: 20
    },
    avatar: { width: 150, height: 150, borderRadius: 75, borderWidth: 3, borderColor: '#fff' },
    username: { fontSize: 28, color: '#fff', fontWeight: 'bold', marginBottom: 8, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4 },
    callTypeLabel: { fontSize: 14, color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
    bottomSection: { paddingBottom: 40, paddingHorizontal: 30 },
    incomingActions: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', width: '100%' },
    activeActions: { width: '100%', alignItems: 'center' },
    controlsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 30 },
    actionBtn: { alignItems: 'center' },
    iconCircle: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 10, elevation: 5 },
    actionIcon: { fontSize: 32 },
    actionLabel: { color: '#fff', fontSize: 14, fontWeight: '500' },
    secondaryBtn: { alignItems: 'center', padding: 10, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.1)', minWidth: 80 },
    activeSecondaryBtn: { backgroundColor: '#fff' },
    secondaryIcon: { fontSize: 24, marginBottom: 5 },
    secondaryLabel: { color: '#fff', fontSize: 12 },
    hangupBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#ff3b30', justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4 },
    hangupIcon: { fontSize: 32, transform: [{ rotate: '135deg' }] },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#1c1c1e', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: height * 0.7 },
    contactItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#333' },
    contactAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 15 },
    contactName: { color: '#fff', fontSize: 16 },
    closeBtn: { marginTop: 20, alignItems: 'center', padding: 15, backgroundColor: '#333', borderRadius: 10 },
    closeBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },

    // Voice Call Specific Styles
    voicePulseContainer: {
        justifyContent: 'center',
        alignItems: 'center', // Fix alignment
        marginBottom: 30
    },
    pulseCircle: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(255,255,255,0.2)'
    },
    voiceAvatar: {
        width: 150,
        height: 150,
        borderRadius: 75,
        borderWidth: 3,
        borderColor: '#fff'
    },
    voiceTimer: {
        fontSize: 32,
        fontWeight: '300',
        color: '#fff',
        marginBottom: 10
    },
    voiceUserName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 5
    },
    voiceStatus: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
        letterSpacing: 1
    }
});
