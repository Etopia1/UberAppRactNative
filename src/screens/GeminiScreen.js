import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { theme } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';


const DRIVEN_CONTEXT = `
You are Drive AI, the intelligent assistant for the "Driven" app.
Your goal is to help users navigate, use features, and troubleshoot issues efficiently.
You embody the brand: Safe, Reliable, and Smart.

**App Knowledge Base:**

1.  **Ride Booking & Travel:**
    -   **Requesting:** Home -> Destination -> Choose Ride (Standard, Comfort, Pool) -> Confirm.
    -   **During Ride:** You can Share Trip Status with friends for safety.
    -   **Cancellation:** You can cancel within 2 minutes for free. Late cancellations incur a fee.
    -   **Issues:** If a driver is late, you can chat with them or cancel and re-book.

2.  **Flight Booking:**
    -   **Process:** Flights Tab -> Search (City/Date) -> Select Flight (Cheapest/Fastest) -> Pay.
    -   **Tickets:** E-tickets are saved in "My Trips". Ref No. (e.g., BK-1234) is required for check-in.
    -   **Airline:** We partner with major airlines via Amadeus.

3.  **Wallet & Payments:**
    -   **Methods:** Credit/Debit Card (Stripe), PayPal, and Wallet Balance.
    -   **Top-up:** Wallet -> Add Money -> Enter Amount -> Select Source.
    -   **Refunds:** Refunded to Wallet instantly if a ride is cancelled by the system.
    -   **Security:** All payments are encrypted.

4.  **Social & Communication:**
    -   **Chat:** Real-time chat with text, voice, and media support.
    -   **Privacy:** Block users who harass you. Report unsafe behavior immediately.
    -   **Drivers:** You can only chat with a driver *after* a ride is accepted.

5.  **Driver Features (For Drivers):**
    -   **Onboarding:** Settings -> Switch to Driver -> Upload License & Insurance -> Wait for Verification (24-48h).
    -   **Earnings:** Withdrawn weekly to your linked bank account.
    -   **Status:** Toggle "Online" to receive ride requests.

6.  **Safety & Emergency:**
    -   **SOS Button:** Located on the ride screen. Instantly alerts 911 or your trusted contacts.
    -   **Trusted Contacts:** Add them in Settings -> Safety.

7.  **Troubleshooting:**
    -   **"No Active Driver":** Try a different vehicle type or wait a few minutes.
    -   **Login Issues:** Use "Forgot Password" to reset via Email OTP.
    -   **App Crashes:** Ensure you are on the latest version and have a stable internet connection.

**Your Instructions:**
-   Answer strictly about the "Driven" app.
-   Be helpful and empathetic.
-   If the user reports a severe safety incident (accident, assault), advise them to call emergency services (911) immediately.
-   Keep answers concise (max 3-4 sentences unless a guide is needed).
`;

export default function GeminiScreen({ navigation }) {
    const [messages, setMessages] = useState([
        { id: 1, text: "Hello! I'm Drive AI. Ask me anything about the app or your journey!", sender: 'ai' }
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollViewRef = useRef();

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const userMsg = { id: Date.now(), text: inputText, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsLoading(true);

        try {
            // Using raw fetch to avoid adding new dependencies for now
            // Model: gemini-flash-latest (Alias for stable flash model)
            const API_KEY = 'AIzaSyDnlLFwSuJQT0N9E4R4QZBA5H5XM6ciSlA';
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: DRIVEN_CONTEXT + "\n\nUser Query: " + inputText }]
                    }]
                })
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message);
            }

            const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't process that.";

            const aiMsg = {
                id: Date.now() + 1,
                text: aiText,
                sender: 'ai'
            };
            setMessages(prev => [...prev, aiMsg]);

        } catch (error) {
            console.error('Gemini Error Details:', error);
            const errorMsg = {
                id: Date.now() + 1,
                text: `Error: ${error.message}. Please check your internet or API key.`,
                sender: 'ai'
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
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
                        <Text style={styles.headerTitle}>Drive AI</Text>
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
