import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { Audio } from 'expo-av';
import { theme } from '../constants/theme';

export default function VoiceRecorder({ onSend, onCancel }) {
    const [recording, setRecording] = useState(null);
    const [duration, setDuration] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const durationInterval = useRef(null);

    const startPulse = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 500,
                    useNativeDriver: true
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true
                })
            ])
        ).start();
    };

    const stopPulse = () => {
        pulseAnim.stopAnimation();
        pulseAnim.setValue(1);
    };

    const startRecording = async () => {
        try {
            // Request permissions
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                alert('Permission to access microphone is required!');
                return;
            }

            // Configure audio mode
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                shouldDuckAndroid: true,
                playThroughEarpieceAndroid: false
            });

            // Create recording
            const { recording: newRecording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            setRecording(newRecording);
            setIsRecording(true);
            setDuration(0);
            startPulse();

            // Start duration counter
            durationInterval.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error('Failed to start recording:', error);
            alert('Failed to start recording');
        }
    };

    const stopRecording = async () => {
        if (!recording) return;

        try {
            stopPulse();
            clearInterval(durationInterval.current);
            setIsRecording(false);

            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();

            setRecording(null);
            return uri;
        } catch (error) {
            console.error('Failed to stop recording:', error);
            return null;
        }
    };

    const handleSend = async () => {
        const uri = await stopRecording();
        if (uri && onSend) {
            onSend(uri, duration);
        }
    };

    const handleCancel = async () => {
        await stopRecording();
        if (onCancel) {
            onCancel();
        }
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Auto-start recording when component mounts
    React.useEffect(() => {
        startRecording();
        return () => {
            if (durationInterval.current) {
                clearInterval(durationInterval.current);
            }
            if (recording) {
                recording.stopAndUnloadAsync();
            }
        };
    }, []);

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.recordingContainer} onPress={handleSend}>
                <Animated.View style={[styles.recordingDot, { transform: [{ scale: pulseAnim }] }]} />
                <Text style={styles.durationText}>{formatDuration(duration)}</Text>
                <Text style={styles.recordingText}>Tap to Send</Text>
            </TouchableOpacity>

            <View style={styles.buttonsContainer}>
                <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={handleCancel}
                >
                    <Text style={styles.buttonText}>🗑️</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.sendButton]}
                    onPress={handleSend}
                >
                    <Text style={styles.buttonText}>Send ➤</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0'
    },
    recordingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20
    },
    recordingDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#ff0000',
        marginRight: 10
    },
    durationText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginRight: 10
    },
    recordingText: {
        fontSize: 14,
        color: '#666'
    },
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around'
    },
    button: {
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
        minWidth: 120,
        alignItems: 'center'
    },
    cancelButton: {
        backgroundColor: '#ff4444'
    },
    sendButton: {
        backgroundColor: theme.colors.primary
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600'
    }
});
