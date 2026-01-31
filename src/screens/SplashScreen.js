
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const SplashScreen = ({ onFinish }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.5)).current; // Start smaller for pop effect

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 5,
                tension: 40,
                useNativeDriver: true,
            })
        ]).start();

        const timer = setTimeout(() => {
            // Fade out before finishing
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true
            }).start(() => onFinish());
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
                {/* Use the same logo as native splash for seamless feel */}
                <Image
                    source={require('../../assets/mylogo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />

                {/* Optional: Keep text if user wants, but logo is primary */}
                <Text style={styles.tagline}>Move Better. Live Better.</Text>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000', // Match native splash background
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: width * 0.6,
        height: width * 0.6, // Adjust aspect ratio as needed
        marginBottom: 20
    },
    tagline: {
        fontSize: 14,
        color: '#888888',
        letterSpacing: 2,
        textTransform: 'uppercase',
        opacity: 0.9,
    }
});

export default SplashScreen;
