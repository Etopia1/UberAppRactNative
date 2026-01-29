import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import BookingsScreen from '../screens/BookingsScreen';
import SocialFeedScreen from '../screens/SocialFeedScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ProfileScreen from '../screens/ProfileScreen';
import DiscoverUsersScreen from '../screens/DiscoverUsersScreen';
import { Image } from 'react-native';
import { getAvatarSource } from '../utils/avatar';
import { theme } from '../constants/theme';

import { useSelector } from 'react-redux';

import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
    const totalUnreadCount = useSelector(state => state.chat.totalUnreadCount);

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.textSecondary,
                tabBarStyle: {
                    backgroundColor: theme.colors.surface,
                    borderTopWidth: 0,
                    elevation: 10,
                    height: 80, // Increased height
                    paddingBottom: 20, // Push icons up clearly
                    paddingTop: 10,
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -5 },
                    shadowOpacity: 0.1,
                    shadowRadius: 10,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                    marginBottom: 5 // Space between icon and text
                }
            }}
        >
            <Tab.Screen
                name="HomeTab"
                component={HomeScreen}
                options={{
                    tabBarLabel: 'Ride',
                    tabBarIcon: ({ color, size }) => <Ionicons name="car-sport" size={28} color={color} />
                }}
            />
            <Tab.Screen
                name="FeedTab"
                component={SocialFeedScreen}
                options={{
                    tabBarLabel: 'Feed',
                    tabBarIcon: ({ color, size }) => <Ionicons name="newspaper" size={24} color={color} />
                }}
            />
            <Tab.Screen
                name="DiscoverTab"
                component={DiscoverUsersScreen}
                options={{
                    tabBarLabel: 'Discover',
                    tabBarIcon: ({ color, size }) => <Ionicons name="compass" size={28} color={color} />
                }}
            />
            <Tab.Screen
                name="ChatTab"
                component={ChatListScreen}
                options={{
                    tabBarLabel: 'Chat',
                    tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles" size={26} color={color} />,
                    tabBarBadge: totalUnreadCount > 0 ? totalUnreadCount : null,
                    tabBarBadgeStyle: { backgroundColor: theme.colors.error, color: '#fff' }
                }}
            />
            <Tab.Screen
                name="Bookings"
                component={BookingsScreen}
                options={{
                    tabBarLabel: 'Trips',
                    tabBarIcon: ({ color, size }) => <Ionicons name="receipt" size={24} color={color} />
                }}
            />
            <Tab.Screen
                name="ProfileTab"
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'Account',
                    tabBarIcon: ({ color, size }) => {
                        const user = useSelector(state => state.auth.user);
                        return (
                            <Image
                                source={getAvatarSource(user)}
                                style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 1, borderColor: color }}
                            />
                        );
                    }
                }}
            />
        </Tab.Navigator>
    );
}
