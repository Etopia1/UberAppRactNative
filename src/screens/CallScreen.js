import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, SafeAreaView, Platform } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useCall } from '../context/CallContext';
import { theme } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import WebRTCBridge from '../components/WebRTCBridge';
import { getAvatarSource } from '../utils/avatar';

const { width, height } = Dimensions.get('window');

export default function CallScreen({ navigation }) {
    const {
        callStatus, callType, otherUser, duration,
        isMuted, isVideoOff,
        endCall, answerCall, bridgeRef, handleBridgeMessage
    } = useCall();

    useEffect(() => {
        if (callStatus === 'Idle') {
            navigation.goBack();
        }
    }, [callStatus]);

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const isVideo = callType === 'video';
    const isIncoming = callStatus === 'Incoming...';

    return (
        <View style={styles.container}>
            {/* WEB PLATFORM WARNING */}
            {Platform.OS === 'web' && (
                <View style={styles.webWarning}>
                    <Text style={styles.webWarningText}>📱 Video/Voice calls require iOS or Android</Text>
                    <Text style={styles.webWarningSubtext}>Please test on a physical device or emulator</Text>
                    <TouchableOpacity style={styles.webBackButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.webBackText}>← Go Back</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* ONLY RENDER ON MOBILE */}
            {Platform.OS !== 'web' && (
                <>
                    {/* BACKGROUND: Video Bridge or Gradient */}
                    {isVideo ? (
                        <View style={StyleSheet.absoluteFill}>
                            <WebRTCBridge
                                ref={bridgeRef}
                                onMessage={handleBridgeMessage}
                            />
                        </View>
                    ) : (
                        <LinearGradient
                            colors={['#1a2a6c', '#b21f1f', '#fdbb2d']}
                            style={StyleSheet.absoluteFill}
                        />
                    )}

                    {/* If Voice Call, we still need Bridge mounted but hidden */}
                    {!isVideo && (
                        <View style={{ height: 1, width: 1, opacity: 0, position: 'absolute' }}>
                            <WebRTCBridge
                                ref={bridgeRef}
                                onMessage={handleBridgeMessage}
                            />
                        </View>
                    )}

                    {/* OVERLAY UI */}
                    <SafeAreaView style={styles.overlay}>

                        {/* Header Info */}
                        <View style={styles.header}>
                            <View style={styles.avatarContainer}>
                                <Image
                                    source={getAvatarSource(otherUser)}
                                    style={styles.avatar}
                                />
                            </View>
                            <Text style={styles.name}>{otherUser?.name || 'Unknown User'}</Text>
                            <Text style={styles.status}>
                                {callStatus === 'Connected' ? formatDuration(duration) : callStatus}
                            </Text>
                        </View>

                        {/* Controls */}
                        <View style={styles.controlsContainer}>
                            {isIncoming ? (
                                <View style={styles.incomingControls}>
                                    <TouchableOpacity style={[styles.controlBtn, styles.declineBtn]} onPress={endCall}>
                                        <MaterialIcons name="call-end" size={32} color="#fff" />
                                        <Text style={styles.btnLabel}>Decline</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.controlBtn, styles.acceptBtn]} onPress={answerCall}>
                                        <MaterialIcons name="call" size={32} color="#fff" />
                                        <Text style={styles.btnLabel}>Accept</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.activeControls}>
                                    <TouchableOpacity style={styles.controlBtn} onPress={() => {/* Toggle Mute via Context/Bridge */ }}>
                                        <Ionicons name={isMuted ? "mic-off" : "mic"} size={28} color="#fff" />
                                    </TouchableOpacity>

                                    <TouchableOpacity style={[styles.controlBtn, styles.endCallBtn]} onPress={endCall}>
                                        <MaterialIcons name="call-end" size={32} color="#fff" />
                                    </TouchableOpacity>

                                    {isVideo && (
                                        <TouchableOpacity style={styles.controlBtn} onPress={() => {/* Switch Camera */ }}>
                                            <Ionicons name="camera-reverse" size={28} color="#fff" />
                                        </TouchableOpacity>
                                    )}
                                    {!isVideo && (
                                        <TouchableOpacity style={styles.controlBtn} onPress={() => {/* Toggle Speaker */ }}>
                                            <Ionicons name="volume-high" size={28} color="#fff" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                        </View>

                    </SafeAreaView>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    overlay: {
        flex: 1,
        justifyContent: 'space-between',
        paddingVertical: 50,
    },
    header: {
        alignItems: 'center',
        marginTop: 50,
    },
    avatarContainer: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    name: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 20,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 10
    },
    status: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 10,
    },
    controlsContainer: {
        paddingHorizontal: 40,
        paddingBottom: 40,
    },
    activeControls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 40,
        paddingVertical: 20,
        backdropFilter: 'blur(10px)', // Web support
    },
    incomingControls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    controlBtn: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    endCallBtn: {
        backgroundColor: '#ff4444',
        width: 70,
        height: 70,
        borderRadius: 35,
        shadowColor: "#ff4444",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10,
    },
    acceptBtn: {
        backgroundColor: '#4caf50',
        width: 70,
        height: 70,
        borderRadius: 35,
        alignItems: 'center',
        justifyContent: 'center'
    },
    declineBtn: {
        backgroundColor: '#ff4444',
        width: 70,
        height: 70,
        borderRadius: 35,
        alignItems: 'center',
        justifyContent: 'center'
    },
    btnLabel: {
        color: '#fff',
        fontSize: 12,
        marginTop: 5,
        position: 'absolute',
        bottom: -20,
        width: 80,
        textAlign: 'center'
    },
    // Web Platform Warning
    webWarning: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a2a6c',
        padding: 20
    },
    webWarningText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 10
    },
    webWarningSubtext: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        marginBottom: 30
    },
    webBackButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 25
    },
    webBackText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold'
    }
});
