import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useCall } from '../context/CallContext';
import { navigationRef } from '../navigation/NavigationRef';
import { getAvatarWithInitials } from '../utils/avatar';

export default function MinimizedCall({ currentRoute }) {
    const { callStatus, otherUser, duration, callType } = useCall();

    // Check if we are currently on the CallScreen
    const isOnCallScreen = currentRoute === 'Call';

    // Only show if call is active/incoming AND we are NOT on the CallScreen
    if (callStatus === 'Idle' || isOnCallScreen) return null;

    const handleExpand = () => {
        if (navigationRef.current) {
            navigationRef.current.navigate('Call', {
                isIncoming: callStatus === 'Incoming...',
                otherUser,
            });
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <TouchableOpacity
            style={styles.container}
            activeOpacity={0.9}
            onPress={handleExpand}
        >
            <View style={styles.content}>
                <Image
                    source={{ uri: otherUser?.profilePicture || otherUser?.avatar || getAvatarWithInitials(otherUser?.name, 40) }}
                    style={styles.avatar}
                />
                <View style={styles.info}>
                    <Text style={styles.name} numberOfLines={1}>
                        {otherUser?.name || 'Unknown'}
                    </Text>
                    <Text style={styles.duration}>
                        {callStatus === 'Connected' ? formatTime(duration) : callStatus}
                    </Text>
                </View>
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>{callType === 'video' ? '📹' : '📞'}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}


const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 50,
        alignSelf: 'center',
        backgroundColor: '#1C1C1E',
        width: '90%',
        height: 60,
        borderRadius: 30,
        zIndex: 9999,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    info: {
        flex: 1,
    },
    name: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '600',
    },
    duration: {
        color: '#4CD964',
        fontSize: 12,
        fontWeight: '500',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: {
        fontSize: 18,
    }
});
