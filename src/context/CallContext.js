import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Vibration, Platform } from 'react-native';
import socketService from '../services/socket';
import { Audio } from 'expo-av';
// Camera is handled in CallScreen/Bridge now

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

    // We don't need remoteFrame anymore, Bridge handles it
    // But we need to expose bridge Ref to CallScreen so it can render it? 
    // Actually, CallScreen renders Bridge, so CallScreen should pass ref HERE? 
    // OR CallContext manages state that CallScreen passes to Bridge?
    // Better: CallContext exposes functions `handleBridgeMessage` and `sendToBridge`.
    // But ref is in UI. 
    // Let's use a MutableRefObject in Context that CallScreen assigns the WebView ref to.
    const bridgeRef = useRef(null);

    const soundRef = useRef(null);
    const timerRef = useRef(null);

    // Socket Event Handlers
    useEffect(() => {
        const handleIncomingCall = (data) => {
            if (callStatus !== 'Idle') {
                socketService.emit('end_call', { to: data.from, wasMissed: true, busy: true });
                return;
            }
            setOtherUser({
                _id: data.from,
                name: data.name,
                avatar: data.avatar
            });
            setCallType(data.callType);
            setCallStatus('Incoming...');
        };

        const handleCallAccepted = async (data) => {
            // Data contains Answer SDP
            setCallStatus('Connected');
            Vibration.cancel();
            stopSound();
            startTimer();

            // Send Answer to Bridge
            if (bridgeRef.current) {
                bridgeRef.current.sendMessageToWebView('HANDLE_ANSWER', data);
            }
        };

        const handleWebrtcSignal = (data) => {
            // data.signal contains candidate or offer/answer
            if (bridgeRef.current) {
                if (data.signal.type === 'offer') {
                    // Start Receiving (Wait, we should be in Incoming state or Answer state?)
                    // Usually Offer comes before Call Accepted? 
                    // In this flow: Caller sends Call request -> Callee Accepts -> Caller sends Offer? 
                    // Or Caller sends Offer with Call Request?
                    // Let's assume standard: Caller Init -> Create Offer -> Emit 'call_user' with Offer?
                    // CURRENT BACKEND LOGIC: 'call_user' just notifies. Then 'webrtc_signal' handles SDP.
                    bridgeRef.current.sendMessageToWebView('HANDLE_OFFER', data.signal);
                } else if (data.signal.candidate) {
                    bridgeRef.current.sendMessageToWebView('HANDLE_CANDIDATE', data.signal.candidate);
                } else if (data.signal.type === 'answer') {
                    // Handled in handleCallAccepted usually, but if separate:
                    bridgeRef.current.sendMessageToWebView('HANDLE_ANSWER', data.signal);
                }
            }
        };

        const handleCallEnded = () => {
            endCallCleanup();
        };

        socketService.on('incoming_call', handleIncomingCall);
        socketService.on('call_accepted', handleCallAccepted);
        socketService.on('webrtc_signal', handleWebrtcSignal);
        socketService.on('call_ended', handleCallEnded);

        return () => {
            socketService.off('incoming_call', handleIncomingCall);
            socketService.off('call_accepted', handleCallAccepted);
            socketService.off('webrtc_signal', handleWebrtcSignal);
            socketService.off('call_ended', handleCallEnded);
        };
    }, [callStatus, callType]);

    // Ringing Sound
    useEffect(() => {
        const playSound = async () => {
            try {
                if (soundRef.current) await soundRef.current.unloadAsync();
                const uri = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
                const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true, isLooping: true });
                soundRef.current = sound;
            } catch (error) { console.log('Error playing sound', error); }
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

        // Tell Bridge to Start Media
        if (bridgeRef.current) {
            bridgeRef.current.sendMessageToWebView('INIT', { isVoiceOnly: type === 'voice' });
            // Defer Offer creation until connected? Or create now?
            // Let's create Offer now.
            setTimeout(() => {
                bridgeRef.current.sendMessageToWebView('CREATE_OFFER', {});
            }, 1000); // Wait for media init
        }
    };

    const answerCall = () => {
        setCallStatus('Connected');
        startTimer();
        stopSound();
        Vibration.cancel();

        if (bridgeRef.current) {
            bridgeRef.current.sendMessageToWebView('INIT', { isVoiceOnly: callType === 'voice' });
            // Wait for Offer from remote (handled in socket listener)
        }

        // Notify Caller we picked up (they might not send offer until we pick up?)
        socketService.emit('answer_call', {
            to: otherUser._id,
            signal: 'active' // Just ack
        });
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
        stopSound();
        stopTimer();
        if (bridgeRef.current) {
            bridgeRef.current.sendMessageToWebView('END_CALL', {});
        }
    };

    const startTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => setDuration(p => p + 1), 1000);
    };

    const stopTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };

    // Handle messages FROM Bridge
    const handleBridgeMessage = (message) => {
        switch (message.type) {
            case 'OFFER_CREATED':
                // Send Offer to Remote
                socketService.emit('call_user', {
                    userToCall: otherUser._id,
                    from: socketService.userId,
                    name: 'User',
                    callType: callType,
                    signal: message.payload // Embed offer in call request or separate?
                    // Backend expects 'signal' in 'webrtc_signal', but 'call_user' is for notification.
                    // Let's send 'call_user' first, then 'webrtc_signal'.
                });
                // Send Signal
                socketService.emit('webrtc_signal', {
                    to: otherUser._id,
                    signal: message.payload
                });
                break;
            case 'ANSWER_CREATED':
                socketService.emit('webrtc_signal', {
                    to: otherUser._id,
                    signal: message.payload
                });
                break;
            case 'ICE_CANDIDATE':
                socketService.emit('webrtc_signal', {
                    to: otherUser._id,
                    signal: { type: 'candidate', candidate: message.payload }
                });
                break;
            case 'MEDIA_READY':
                console.log('Bridge Media Ready');
                break;
            case 'ERROR':
                console.error('Bridge Error:', message.payload);
                break;
        }
    };

    const value = {
        callStatus,
        callType,
        otherUser,
        duration,
        isMuted,
        isVideoOff,
        startCall,
        answerCall,
        rejectCall,
        endCall,
        setCallStatus,
        bridgeRef, // Expose ref to UI to bind it
        handleBridgeMessage
    };

    return (
        <CallContext.Provider value={value}>
            {children}
        </CallContext.Provider>
    );
};
