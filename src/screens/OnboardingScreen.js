import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity, Image } from 'react-native';
import { theme } from '../constants/theme';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

const slides = [
    {
        id: '1',
        title: 'Travel Without Limits',
        description: 'Book flights and rides in one seamless experience. The world is yours to explore.',
        image: require('../../assets/onboarding_flight.png'),
    },
    {
        id: '2',
        title: 'Go Green with Us',
        description: 'Choose sustainable travel options with our eco-friendly fleet. Ride responsibly.',
        image: require('../../assets/onboarding_car.jpg'),
    },
    {
        id: '3',
        title: 'Community Driven',
        description: 'Connect with people, share rides, and discover new destinations together.',
        image: require('../../assets/onboarding_community.png'),
    },
];

export default function OnboardingScreen({ navigation }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef(null);

    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const handleNext = () => {
        if (currentIndex < slides.length - 1) {
            flatListRef.current.scrollToIndex({ index: currentIndex + 1 });
        } else {
            navigation.replace('Login');
        }
    };

    const handleSkip = () => {
        navigation.replace('Login');
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            <FlatList
                ref={flatListRef}
                data={slides}
                renderItem={({ item }) => (
                    <View style={styles.slide}>
                        <View style={styles.imageContainer}>
                            <Image source={item.image} style={styles.image} resizeMode="contain" />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.title}>{item.title}</Text>
                            <Text style={styles.description}>{item.description}</Text>
                        </View>
                    </View>
                )}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewConfig}
            />

            <View style={styles.footer}>
                <View style={styles.pagination}>
                    {slides.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                currentIndex === index && styles.activeDot,
                            ]}
                        />
                    ))}
                </View>

                <View style={styles.buttonsContainer}>
                    <TouchableOpacity onPress={handleSkip}>
                        <Text style={styles.skipText}>Skip</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                        <Text style={styles.nextButtonText}>
                            {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background, // Dark background
    },
    slide: {
        width: width,
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageContainer: {
        flex: 0.6,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    image: {
        width: width * 0.8,
        height: width * 0.8,
        borderRadius: 20,
    },
    textContainer: {
        flex: 0.4,
        alignItems: 'center',
        paddingHorizontal: theme.spacing.l,
        paddingTop: theme.spacing.m,
    },
    title: {
        ...theme.typography.header,
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: theme.spacing.s,
    },
    description: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    footer: {
        paddingHorizontal: theme.spacing.l,
        marginBottom: theme.spacing.xl,
        position: 'absolute',
        bottom: 0,
        width: '100%',
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: theme.spacing.xl,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.gray,
        marginHorizontal: 4,
    },
    activeDot: {
        backgroundColor: theme.colors.primary,
        width: 24,
    },
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    skipText: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        fontWeight: '600',
    },
    nextButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: theme.borderRadius.l,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
