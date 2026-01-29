import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Image, ActivityIndicator } from 'react-native';
import { theme } from '../constants/theme';
import api from '../services/api';
import Toast from 'react-native-toast-message';

export default function CreateGroupScreen({ navigation }) {
    const [groupName, setGroupName] = useState('');
    const [description, setDescription] = useState('');
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/social/users');
            setUsers(response.data.users);
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Failed to load users' });
        } finally {
            setLoading(false);
        }
    };

    const toggleUser = (userId) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
        } else {
            setSelectedUsers([...selectedUsers, userId]);
        }
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim()) {
            Toast.show({ type: 'error', text1: 'Please enter group name' });
            return;
        }

        if (selectedUsers.length === 0) {
            Toast.show({ type: 'error', text1: 'Please select at least one member' });
            return;
        }

        try {
            setCreating(true);
            const response = await api.post('/groups', {
                name: groupName,
                description,
                memberIds: selectedUsers
            });

            Toast.show({ type: 'success', text1: 'Group created!' });
            navigation.navigate('GroupChat', { group: response.data.group });
        } catch (error) {
            console.error('Create group error:', error);
            Toast.show({ type: 'error', text1: 'Failed to create group' });
        } finally {
            setCreating(false);
        }
    };

    const renderUser = ({ item }) => {
        const isSelected = selectedUsers.includes(item._id);

        return (
            <TouchableOpacity
                style={[styles.userItem, isSelected && styles.userItemSelected]}
                onPress={() => toggleUser(item._id)}
            >
                <Image
                    source={{ uri: item.profilePicture || item.avatar || 'https://via.placeholder.com/50' }}
                    style={styles.avatar}
                />
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userEmail}>{item.email}</Text>
                </View>
                {isSelected && (
                    <Text style={styles.checkmark}>✓</Text>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.form}>
                <TextInput
                    style={styles.input}
                    placeholder="Group Name"
                    value={groupName}
                    onChangeText={setGroupName}
                    placeholderTextColor="#999"
                />
                <TextInput
                    style={[styles.input, styles.descriptionInput]}
                    placeholder="Description (optional)"
                    value={description}
                    onChangeText={setDescription}
                    placeholderTextColor="#999"
                    multiline
                />
            </View>

            <View style={styles.membersSection}>
                <Text style={styles.sectionTitle}>
                    Select Members ({selectedUsers.length})
                </Text>
                {loading ? (
                    <ActivityIndicator color={theme.colors.primary} style={styles.loader} />
                ) : (
                    <FlatList
                        data={users}
                        renderItem={renderUser}
                        keyExtractor={(item) => item._id}
                        contentContainerStyle={styles.usersList}
                    />
                )}
            </View>

            <TouchableOpacity
                style={[styles.createButton, creating && styles.createButtonDisabled]}
                onPress={handleCreateGroup}
                disabled={creating}
            >
                {creating ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.createButtonText}>Create Group</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa'
    },
    form: {
        padding: 20,
        backgroundColor: '#fff',
        marginBottom: 10
    },
    input: {
        backgroundColor: '#f5f7fa',
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        color: '#333',
        marginBottom: 15
    },
    descriptionInput: {
        height: 80,
        textAlignVertical: 'top'
    },
    membersSection: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 15
    },
    loader: {
        marginTop: 20
    },
    usersList: {
        flexGrow: 1
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        backgroundColor: '#f8f9fa'
    },
    userItemSelected: {
        backgroundColor: theme.colors.primary + '20',
        borderWidth: 2,
        borderColor: theme.colors.primary
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12
    },
    userInfo: {
        flex: 1
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333'
    },
    userEmail: {
        fontSize: 14,
        color: '#666'
    },
    checkmark: {
        fontSize: 24,
        color: theme.colors.primary,
        fontWeight: 'bold'
    },
    createButton: {
        backgroundColor: theme.colors.primary,
        margin: 20,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center'
    },
    createButtonDisabled: {
        backgroundColor: '#ccc'
    },
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600'
    }
});
