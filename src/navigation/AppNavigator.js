import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { incrementUnreadCount, setTotalUnreadCount } from '../redux/slices/chatSlice';
import api from '../services/api'; // Added missing import
import SplashScreen from '../screens/SplashScreen';
import * as Notifications from 'expo-notifications';

import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import OTPScreen from '../screens/OTPScreen';
import MainTabNavigator from './MainTabNavigator';
import FlightSearchScreen from '../screens/FlightSearchScreen';
import PaymentScreen from '../screens/PaymentScreen';
import RideRequestScreen from '../screens/RideRequestScreen';
import RideSelectionScreen from '../screens/RideSelectionScreen';
import DriverArrivalScreen from '../screens/DriverArrivalScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import ChatScreen from '../screens/ChatScreen';
import ChatListScreen from '../screens/ChatListScreen';
import SocialFeedScreen from '../screens/SocialFeedScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import PostDetailScreen from '../screens/PostDetailScreen';
import TicketReceiptScreen from '../screens/TicketReceiptScreen';
import ProfileScreen from '../screens/ProfileScreen';
import WalletScreen from '../screens/WalletScreen';
import SettingsScreen from '../screens/SettingsScreen';
import FundWalletScreen from '../screens/FundWalletScreen';
import TransactionHistoryScreen from '../screens/TransactionHistoryScreen';
import CallScreen from '../screens/CallScreen';
import NavigationScreen from '../screens/NavigationScreen';
import GeminiScreen from '../screens/GeminiScreen';
import DriverSignupScreen from '../screens/DriverSignupScreen';
import DriverDashboardScreen from '../screens/DriverDashboardScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import UserDetailsScreen from '../screens/UserDetailsScreen';
import MinimizedCall from '../components/MinimizedCall';
import socketService from '../services/socket';
import { CallProvider } from '../context/CallContext';

import RideSuggestionModal from '../components/RideSuggestionModal';

import { navigationRef } from './NavigationRef';

const Stack = createStackNavigator();
// removed local navigationRef creation

export default function AppNavigator() {
    const dispatch = useDispatch();
    const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
    const user = useSelector(state => state.auth.user);
    const [isFirstLaunch, setIsFirstLaunch] = useState(null);
    const [currentRoute, setCurrentRoute] = useState(null);
    const [isSplashVisible, setIsSplashVisible] = useState(true); // Splash screen state

    // Ride Suggestion State
    const [suggestionVisible, setSuggestionVisible] = useState(false);
    const [suggestionData, setSuggestionData] = useState(null);

    useEffect(() => {
        AsyncStorage.getItem('alreadyLaunched').then(value => {
            if (value == null) {
                AsyncStorage.setItem('alreadyLaunched', 'true');
                setIsFirstLaunch(true);
            } else {
                setIsFirstLaunch(false);
            }
        });
    }, []);

    // Global listener for incoming calls, hints, and notifications
    useEffect(() => {
        const userId = user?._id || user?.id;

        // Register for Push Notifications
        if (isAuthenticated && userId) {
            const { registerForPushNotificationsAsync } = require('../services/notifications');
            registerForPushNotificationsAsync().then(token => {
                // DEBUG: Show user if token exists (Remove in production)
                // Alert.alert('Push Token Status', token ? '✅ Generated' : '❌ Failed');

                if (token) {
                    console.log('Sending token to backend:', token);
                    api.post('/auth/push-token', { token })
                        .then(() => console.log('Token saved to backend'))
                        .catch(err => console.log('Failed to update push token', err));
                } else {
                    console.log('No token returned from registration');
                }
            });
        }

        // --- 1. Notification Deep Linking Listener ---
        const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            if (data?.type === 'message' && data?.conversationId) {
                // Navigate to Chat
                navigationRef.current?.navigate('MainTab', {
                    screen: 'Chat', // Navigate to the stack inside MainTab if possible, or directly to Chat if it's a root stack screen
                    params: {
                        conversation: { _id: data.conversationId },
                        otherUser: { name: response.notification.request.content.title } // Placeholder until fetch
                    }
                });
                // Note: ChatScreen might need to fetch user details if only ID is passed
                // Better approach: Navigate to 'Chat' root stack screen
                navigationRef.current?.navigate('Chat', {
                    conversation: { _id: data.conversationId },
                    otherUser: { _id: 'unknown', name: response.notification.request.content.title } // Let ChatScreen handle fetching if needed
                });
            }
        });

        if (isAuthenticated && userId) {
            socketService.connect(userId);

            const handleFlightLanded = (data) => {
                Alert.alert(
                    'Flight Landed! 🛬',
                    data.autoRide
                        ? 'Your ride has been automatically booked and is on its way.'
                        : 'Your flight has landed safely.',
                    [
                        {
                            text: 'Track Ride',
                            onPress: () => {
                                if (data.autoRide && navigationRef.current) {
                                    navigationRef.current.navigate('DriverArrival', { rideId: data.autoRide._id });
                                }
                            }
                        },
                        { text: 'OK', style: 'cancel' }
                    ]
                );
            };

            const handleNotification = (data) => {
                if (data && data.type === 'ride_suggestion') {
                    setSuggestionData(data.data);
                    setSuggestionVisible(true);
                }
            };

            const handleNewMessage = async (message) => {
                const currentRoute = navigationRef.current?.getCurrentRoute();
                // Check if we are currently in the chat screen with this person
                const isChattingWithSender = currentRoute?.name === 'Chat' && currentRoute?.params?.conversation?._id === message.conversation;

                if (!isChattingWithSender) {
                    dispatch(incrementUnreadCount());

                    // If App is in background, system notification will show usually via FCM/APNS if configured.
                    // If we are strictly relying on socket for "background" (which only works if app is suspended but socket alive),
                    // we can trigger local notification.

                    // Show a Toast (In-App)
                    Toast.show({
                        type: 'info',
                        text1: message.sender.name,
                        text2: message.content,
                        onPress: () => {
                            navigationRef.current?.navigate('Chat', {
                                conversation: { _id: message.conversation },
                                otherUser: message.sender
                            });
                        }
                    });

                    // Trigger System Notification (for system tray)
                    // This ensures "Real Time" feeling even if looking at another screen
                    await Notifications.scheduleNotificationAsync({
                        content: {
                            title: message.sender.name,
                            body: message.content,
                            data: { type: 'message', conversationId: message.conversation },
                            sound: true,
                        },
                        trigger: null,
                    });
                }
            };

            socketService.on('flight_landed', handleFlightLanded);
            socketService.on('notification', handleNotification);
            socketService.on('message_received', handleNewMessage);

            // Initial fetch of unread counts
            api.get('/chat/conversations').then(res => {
                let total = 0;
                res.data.conversations.forEach(c => {
                    total += c.unreadCount?.[userId] || 0;
                });
                dispatch(setTotalUnreadCount(total));
            }).catch(err => console.log('Failed to fetch unread count'));

            return () => {
                socketService.off('flight_landed', handleFlightLanded);
                socketService.off('notification', handleNotification);
                socketService.off('message_received', handleNewMessage);
                if (responseListener) responseListener.remove();
            };
        }

        return () => {
            if (responseListener) responseListener.remove();
        };
    }, [isAuthenticated, user]);

    const handleAcceptRide = () => {
        setSuggestionVisible(false);
        if (suggestionData && navigationRef.current) {
            navigationRef.current.navigate('RideRequest', {
                pickup: suggestionData.pickup, // Airport
                isAutoSuggestion: true
            });
        }
    };

    if (isSplashVisible || isFirstLaunch === null) {
        return <SplashScreen onFinish={() => setIsSplashVisible(false)} />;
    }

    return (
        <CallProvider>
            <NavigationContainer
                ref={navigationRef}
                onReady={() => {
                    setCurrentRoute(navigationRef.current.getCurrentRoute()?.name);
                }}
                onStateChange={() => {
                    const previousRouteName = currentRoute;
                    const currentRouteName = navigationRef.current.getCurrentRoute()?.name;
                    if (previousRouteName !== currentRouteName) {
                        setCurrentRoute(currentRouteName);
                    }
                }}
            >
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                    {isAuthenticated ? (
                        <>
                            {user?.role === 'admin' ? (
                                <>
                                    <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
                                    <Stack.Screen name="UserDetails" component={UserDetailsScreen} />
                                </>
                            ) : user?.role === 'driver' ? (
                                <Stack.Screen name="DriverDashboard" component={DriverDashboardScreen} />
                            ) : (
                                <Stack.Screen name="MainTab" component={MainTabNavigator} />
                            )}
                            <Stack.Screen name="FlightSearch" component={FlightSearchScreen} />
                            <Stack.Screen name="Payment" component={PaymentScreen} />
                            <Stack.Screen name="RideRequest" component={RideRequestScreen} />
                            <Stack.Screen name="RideSelection" component={RideSelectionScreen} />
                            <Stack.Screen name="DriverArrival" component={DriverArrivalScreen} />
                            <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: true, title: 'Chat' }} />
                            <Stack.Screen name="Call" component={CallScreen} options={{ headerShown: false }} />
                            <Stack.Screen name="ChatList" component={ChatListScreen} />
                            <Stack.Screen name="SocialFeed" component={SocialFeedScreen} />
                            <Stack.Screen name="CreatePost" component={CreatePostScreen} options={{ headerShown: true, title: 'Create Post' }} />
                            <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ headerShown: false }} />
                            <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: true, title: 'Profile' }} />
                            <Stack.Screen name="Wallet" component={WalletScreen} />
                            <Stack.Screen name="FundWallet" component={FundWalletScreen} />
                            <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
                            <Stack.Screen name="TicketReceipt" component={TicketReceiptScreen} options={{ headerShown: false }} />
                            <Stack.Screen name="Settings" component={SettingsScreen} />

                            {/* New Features */}
                            <Stack.Screen name="Navigation" component={NavigationScreen} options={{ headerShown: false }} />
                            <Stack.Screen name="Gemini" component={GeminiScreen} options={{ headerShown: false }} />
                        </>
                    ) : (
                        <>
                            {isFirstLaunch && (
                                <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                            )}
                            <Stack.Screen name="Login" component={LoginScreen} />
                            <Stack.Screen name="Signup" component={SignupScreen} />
                            <Stack.Screen name="DriverSignup" component={DriverSignupScreen} />
                            <Stack.Screen name="OTP" component={OTPScreen} />
                            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
                        </>
                    )}
                </Stack.Navigator>
                <MinimizedCall currentRoute={currentRoute} />
                <RideSuggestionModal
                    visible={suggestionVisible}
                    flightData={suggestionData}
                    onClose={() => setSuggestionVisible(false)}
                    onConfirm={handleAcceptRide}
                />
            </NavigationContainer>
        </CallProvider>
    );
}
