import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        priority: Notifications.AndroidNotificationPriority.HIGH
    }),
});

export const registerForPushNotificationsAsync = async () => {
    let token;


    if (Platform.OS === 'web') {
        console.log('Web Push not configured - skipping token registration.');
        return null;
    }

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('messages', {
            name: 'Messages',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
            sound: true,
            enableVibrate: true
        });

        await Notifications.setNotificationChannelAsync('calls', {
            name: 'Calls',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 500, 500, 500],
            lightColor: '#00FF00',
            sound: true,
            enableVibrate: true
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
    }

    // Get the token using the Project ID from app.json
    try {
        const projectId = '943d08cd-090d-4ba0-8e19-2ba2c9217017'; // From app.json
        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        token = tokenData.data;
        console.log('✅ Expo Push Token:', token);
    } catch (error) {
        console.error('❌ Error fetching push token:', error);
    }

    return token;
};

export const schedulePushNotification = async (title, body, data = {}) => {
    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            data,
            sound: true,
        },
        trigger: null, // Send immediately
    });
};

// Show notification for new message
export const showMessageNotification = async (senderName, messageContent, conversationId) => {
    await Notifications.scheduleNotificationAsync({
        content: {
            title: senderName,
            body: messageContent,
            data: {
                type: 'message',
                conversationId
            },
            sound: true,
            badge: 1
        },
        trigger: null
    });
};

// Show notification for incoming call
export const showCallNotification = async (callerName, callType, callId) => {
    await Notifications.scheduleNotificationAsync({
        content: {
            title: `${callType === 'video' ? '📹' : '📞'} Incoming ${callType} call`,
            body: `${callerName} is calling...`,
            data: {
                type: 'call',
                callId,
                callType
            },
            sound: true,
            priority: Notifications.AndroidNotificationPriority.MAX,
            categoryIdentifier: 'call'
        },
        trigger: null
    });
};

// Show notification for group message
export const showGroupMessageNotification = async (groupName, senderName, messageContent, groupId) => {
    await Notifications.scheduleNotificationAsync({
        content: {
            title: groupName,
            body: `${senderName}: ${messageContent}`,
            data: {
                type: 'group_message',
                groupId
            },
            sound: true,
            badge: 1
        },
        trigger: null
    });
};

// Clear all notifications
export const clearAllNotifications = async () => {
    await Notifications.dismissAllNotificationsAsync();
};

// Clear specific notification
export const clearNotification = async (notificationId) => {
    await Notifications.dismissNotificationAsync(notificationId);
};
