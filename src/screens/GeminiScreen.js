import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { theme } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GeminiScreen({ navigation }) {
    const [messages, setMessages] = useState([
        { id: 1, text: "Hello! I'm Gemini. How can I assist you with your journey today?", sender: 'ai' }
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollViewRef = useRef();

    const handleSend = () => {
        if (!inputText.trim()) return;

        const userMsg = { id: Date.now(), text: inputText, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');

        // Simulate AI Response (Legendary Style)
        setTimeout(() => {
            const aiMsg = {
                id: Date.now() + 1,
                text: "I'm processing that for you... My capabilities are fully integrated with your app's data.",
                sender: 'ai'
            };
            setMessages(prev => [...prev, aiMsg]);
        }, 1500);
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#000000', '#0a0f0d']}
                style={styles.background}
            />

            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.titleContainer}>
                        <Text style={styles.headerTitle}>Gemini AI</Text>
                        <View style={styles.onlineBadge} />
                    </View>
                    <TouchableOpacity style={styles.menuBtn}>
                        <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Chat Area */}
                <ScrollView
                    style={styles.chatArea}
                    contentContainerStyle={styles.chatContent}
                    ref={scrollViewRef}
                    onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
                >
                    {messages.map((msg) => (
                        <View key={msg.id} style={[
                            styles.messageBubble,
                            msg.sender === 'user' ? styles.userBubble : styles.aiBubble
                        ]}>
                            {msg.sender === 'ai' && (
                                <LinearGradient
                                    colors={[theme.colors.primary, '#00d4ff']}
                                    style={styles.aiAvatar}
                                >
                                    <Text style={styles.aiInitial}>✨</Text>
                                </LinearGradient>
                            )}
                            <View style={[
                                styles.msgContent,
                                msg.sender === 'user' ? styles.userMsgContent : styles.aiMsgContent
                            ]}>
                                <Text style={styles.msgText}>{msg.text}</Text>
                            </View>
                        </View>
                    ))}
                </ScrollView>

                {/* Input Area */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={10}
                    style={styles.inputContainer}
                >
                    <TextInput
                        style={styles.input}
                        placeholder="Ask Gemini..."
                        placeholderTextColor="#666"
                        value={inputText}
                        onChangeText={setInputText}
                    />
                    <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
                        <LinearGradient
                            colors={[theme.colors.primary, '#00d4ff']}
                            style={styles.sendGradient}
                        >
                            <Ionicons name="send" size={20} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    background: { position: 'absolute', width: '100%', height: '100%' },
    safeArea: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)'
    },
    backBtn: { padding: 5 },
    titleContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 15 },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', letterSpacing: 1 },
    onlineBadge: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00ff88', marginLeft: 8 },
    chatArea: { flex: 1 },
    chatContent: { padding: 20, paddingBottom: 100 },
    messageBubble: { flexDirection: 'row', marginBottom: 20, alignItems: 'flex-end' },
    userBubble: { justifyContent: 'flex-end' },
    aiBubble: { justifyContent: 'flex-start' },
    aiAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10
    },
    aiInitial: { fontSize: 18 },
    msgContent: {
        maxWidth: '75%',
        padding: 15,
        borderRadius: 20,
    },
    userMsgContent: {
        backgroundColor: '#333',
        borderBottomRightRadius: 4,
    },
    aiMsgContent: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    msgText: { color: '#fff', fontSize: 16, lineHeight: 22 },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(0,0,0,0.8)'
    },
    input: {
        flex: 1,
        height: 50,
        backgroundColor: '#1a1a1a',
        borderRadius: 25,
        paddingHorizontal: 20,
        color: '#fff',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#333'
    },
    sendBtn: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 5
    },
    sendGradient: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center'
    }
});
