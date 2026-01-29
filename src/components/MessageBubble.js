import React, { memo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { Video, ResizeMode } from 'expo-av';

const MessageBubble = ({ item, userId, onLongPress, onImagePress, onPlayAudio, playingAudioId, getMediaUrl, formatDuration, formatTime }) => {
    // Safe ID Comparison
    const msgSenderId = item.sender?._id || item.sender?.id || item.sender;
    const currentUserId = userId;
    const isMyMessage = String(msgSenderId) === String(currentUserId);

    // Status Icon Logic (WhatsApp Style)
    const renderStatusIcon = () => {
        if (!isMyMessage) return null;
        if (item.pending) return <Ionicons name="time-outline" size={14} color="white" style={styles.statusIcon} />;
        if (item.status === 'read') return <Ionicons name="checkmark-done" size={14} color="#4FC3F7" style={styles.statusIcon} />; // Blue Ticks
        if (item.status === 'delivered') return <Ionicons name="checkmark-done" size={14} color="rgba(255,255,255,0.7)" style={styles.statusIcon} />; // Gray Double Ticks
        return <Ionicons name="checkmark" size={14} color="rgba(255,255,255,0.7)" style={styles.statusIcon} />; // Single Tick
    };

    return (
        <View style={[styles.messageContainer, isMyMessage ? styles.myMessage : styles.otherMessage]}>
            {!isMyMessage && (
                <Image
                    source={{ uri: item.sender?.profilePicture || item.sender?.avatar || 'https://via.placeholder.com/50' }}
                    style={styles.messageAvatar}
                />
            )}
            <TouchableOpacity
                activeOpacity={0.9}
                onLongPress={() => onLongPress(item)}
                style={[styles.messageBubble, isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble]}
            >
                {/* Image */}
                {item.type === 'image' && (
                    <TouchableOpacity onPress={() => onImagePress(getMediaUrl(item.mediaUrl))}>
                        <Image source={{ uri: getMediaUrl(item.mediaUrl) }} style={styles.messageImage} />
                    </TouchableOpacity>
                )}

                {/* Video */}
                {item.type === 'video' && (
                    <Video
                        style={styles.videoPlayer}
                        source={{ uri: getMediaUrl(item.mediaUrl) }}
                        resizeMode={ResizeMode.COVER}
                        useNativeControls
                    />
                )}

                {/* Audio */}
                {item.type === 'audio' && (
                    <View style={styles.audioContainer}>
                        <TouchableOpacity onPress={() => onPlayAudio(item.mediaUrl, item._id)} style={{ marginRight: 10 }}>
                            <Text style={{ fontSize: 24 }}>{playingAudioId === item._id ? '⏸️' : '▶️'}</Text>
                        </TouchableOpacity>
                        <Text style={isMyMessage ? styles.myMessageText : styles.otherMessageText}>
                            {formatDuration(item.mediaDuration || 0)}
                        </Text>
                        <View style={{ height: 2, flex: 1, backgroundColor: isMyMessage ? 'rgba(255,255,255,0.5)' : '#ddd', marginLeft: 10, marginRight: 5 }} />
                    </View>
                )}

                {/* Text and Deleted Message */}
                {(item.type === 'text' || item.isDeleted) && (
                    <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.otherMessageText, item.isDeleted && { fontStyle: 'italic', color: '#999' }]}>
                        {item.content}
                    </Text>
                )}

                {/* Footer: Time & Status */}
                <View style={styles.footerContainer}>
                    <Text style={[styles.messageTime, isMyMessage ? styles.myMessageTime : styles.otherMessageTime]}>
                        {formatTime(item.createdAt)}
                    </Text>
                    {renderStatusIcon()}
                </View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    messageContainer: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-end' },
    myMessage: { justifyContent: 'flex-end' },
    otherMessage: { justifyContent: 'flex-start' },
    messageAvatar: { width: 28, height: 28, borderRadius: 14, marginRight: 8, marginBottom: 2 },
    messageBubble: { maxWidth: '78%', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 18, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 1, elevation: 1 },
    myMessageBubble: { backgroundColor: theme.colors.primary, borderBottomRightRadius: 4 },
    otherMessageBubble: { backgroundColor: '#fff', borderBottomLeftRadius: 4 },
    messageText: { fontSize: 15, lineHeight: 22 },
    myMessageText: { color: '#fff' },
    otherMessageText: { color: '#1a1a1a' },
    footerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 },
    messageTime: { fontSize: 10, marginRight: 4 },
    myMessageTime: { color: 'rgba(255,255,255,0.7)' },
    otherMessageTime: { color: '#999' },
    statusIcon: { marginLeft: 2 },
    messageImage: { width: 220, height: 160, borderRadius: 12, marginBottom: 2 },
    videoPlayer: { width: 220, height: 160, borderRadius: 12 },
    audioContainer: { flexDirection: 'row', alignItems: 'center', padding: 5, minWidth: 120, justifyContent: 'flex-start' }
});

export default memo(MessageBubble);
