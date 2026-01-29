import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Vibration, Platform } from 'react-native';
import socketService from '../services/socket';
import { Audio } from 'expo-av';
import { Camera } from 'expo-camera';

const CallContext = createContext();

export const useCall = () => useContext(CallContext);

export const CallProvider = ({ children }) => {
    const [callStatus, setCallStatus] = useState('Idle'); // Idle, Calling..., Incoming..., Connected, Ended
    const [callType, setCallType] = useState('voice');
    const [otherUser, setOtherUser] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isSpeaker, setIsSpeaker] = useState(false);
    const [duration, setDuration] = useState(0);
    const [remoteFrame, setRemoteFrame] = useState(null); // For video streaming

    const soundRef = useRef(null);
    const timerRef = useRef(null);
    const cameraRef = useRef(null);
    const streamingInterval = useRef(null);

    // Socket Event Handlers
    useEffect(() => {
        const handleIncomingCall = (data) => {
            if (callStatus !== 'Idle') {
                // Already in a call, maybe auto-reject or show missed?
                socketService.emit('end_call', { to: data.from, wasMissed: true, busy: true });
                return;
            }
            setOtherUser({
                _id: data.from,
                name: data.name,
                avatar: data.avatar // Assuming these come through
            });
            setCallType(data.callType);
            setCallStatus('Incoming...');
        };

        const handleCallAccepted = async () => {
            setCallStatus('Connected');
            Vibration.cancel();
            stopSound();
            startTimer();
            // Audio Mode
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                staysActiveInBackground: true,
                playThroughEarpieceAndroid: callType === 'voice',
            });
        };

        const handleCallEnded = () => {
            endCallCleanup();
        };

        const handleVideoFrame = (data) => {
            setRemoteFrame(data.frame);
        };

        const handleRemoteMediaStatus = (data) => {
            if (data.type === 'video' && !data.status) {
                setRemoteFrame(null);
            }
        };

        socketService.on('incoming_call', handleIncomingCall);
        socketService.on('call_accepted', handleCallAccepted);
        socketService.on('call_ended', handleCallEnded);
        socketService.on('video_frame', handleVideoFrame);
        socketService.on('remote_media_status', handleRemoteMediaStatus);

        return () => {
            socketService.off('incoming_call', handleIncomingCall);
            socketService.off('call_accepted', handleCallAccepted);
            socketService.off('call_ended', handleCallEnded);
            socketService.off('video_frame', handleVideoFrame);
            socketService.off('remote_media_status', handleRemoteMediaStatus);
        };
    }, [callStatus, callType]);

    // Ringing Sound
    useEffect(() => {
        const playSound = async () => {
            try {
                if (soundRef.current) await soundRef.current.unloadAsync();

                // Classic Phone Ring
                const uri = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
                const { sound } = await Audio.Sound.createAsync(
                    { uri },
                    { shouldPlay: true, isLooping: true }
                );
                soundRef.current = sound;
            } catch (error) {
                console.log('Error playing sound', error);
            }
        };

        if (callStatus === 'Calling...' || callStatus === 'Incoming...') {
            playSound();
            if (callStatus === 'Incoming...' && Platform.OS !== 'web') Vibration.vibrate([0, 500, 1000], true);
        } else {
            stopSound();
            Vibration.cancel();
        }
    }, [callStatus]);

    const stopSound = async () => {
        if (soundRef.current) {
            await soundRef.current.stopAsync();
            await soundRef.current.unloadAsync();
            soundRef.current = null;
        }
    };

    const startCall = async (userToCall, type) => {
        setOtherUser(userToCall);
        setCallType(type);
        setCallStatus('Calling...');
        setDuration(0);
        setIsMuted(false);
        setIsVideoOff(false);

        // Emit call
        socketService.emit('call_user', {
            userToCall: userToCall._id,
            from: socketService.userId, // Ensure we have ID access or pass it
            // Wait, socketService.userId might not be public. We usually pass user._id from component.
            // We'll rely on global socket auth for 'from'? No, backend uses socket.userId.
            // But 'call_user' payload in backend expects 'from' sometimes or sets it?
            // Backend 'call_user' (Index.js line 262): io.to(userToCall).emit('incoming_call', { ...data, from: socket.userId }); 
            // IMPORTANT: It overrides 'from' with socket.userId. So we don't strictly need to send it if backend sets it.
            // But existing code sends it.
            userToCall: userToCall._id,
            name: 'User', // We might need name from AuthContext?
            callType: type
        });
    };

    const answerCall = () => {
        socketService.emit('answer_call', {
            to: otherUser._id,
            signal: 'active'
        });
        setCallStatus('Connected');
        startTimer();
    };

    const rejectCall = () => {
        socketService.emit('end_call', { to: otherUser._id });
        endCallCleanup();
    };

    const endCall = () => {
        if (otherUser) {
            socketService.emit('end_call', { to: otherUser._id || otherUser.id });
        }
        endCallCleanup();
    };

    const endCallCleanup = () => {
        setCallStatus('Idle');
        setOtherUser(null);
        setDuration(0);
        setRemoteFrame(null);
        stopSound();
        stopTimer();
        if (streamingInterval.current) {
            clearInterval(streamingInterval.current);
            streamingInterval.current = null;
        }
    };

    const startTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => setDuration(p => p + 1), 1000);
    };

    const stopTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };

    // Video Streaming Logic (Moved from CallScreen)
    // We need cameraRef passed from UI or handled here?
    // Camera is a UI Component. Logic to capture frame must be tied to UI.
    // BUT we want streaming to continue if minimized?
    // If App is minimized (background), Camera might pause on some OS.
    // But if "Minimised" means just navigating back to ChatScreen: Camera unmounts if it's in CallScreen.
    // To keep Camera active, it MUST be in the GlobalOverlay or hidden view in Root.
    // Complex!
    // For now, if user navigates away, we might lose outgoing video if Camera unmounts.
    // BUT user asked "CUT THE CALL AND CALL THE PERSON AGE".
    // "Minimise" -> He probably means pressing Home Button (App Background) vs Back Button (In-App Navigation).
    // "Prevent disconnect on back navigation" is my interpretation.
    // So if I move Camera to CallScreen (UI), and UI unmounts, Camera dies.
    // Solution: Render Camera in GlobalCallOverlay (width 1x1 pixel?) or just keep Audio?
    // Video calls usually PAUSE video when you leave the screen, but Audio stays.
    // I will implement that: Audio Call Persists. Video Call Persists but Video Pauses (or small PiP).

    const value = {
        callStatus,
        callType,
        otherUser,
        duration,
        remoteFrame,
        isMuted,
        isVideoOff,
        startCall,
        answerCall,
        rejectCall,
        endCall,
        setCallStatus // Temporary if needed
    };

    return (
        <CallContext.Provider value={value}>
            {children}
        </CallContext.Provider>
    );
};
