import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, Image } from 'react-native';
import { theme } from '../constants/theme';


const { width } = Dimensions.get('window');

export default function RideSuggestionModal({ visible, onClose, onConfirm, flightData }) {
    if (!visible) return null;

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <View style={styles.iconContainer}>
                        <Text style={styles.icon}>✈️ ➔ 🚗</Text>
                    </View>

                    <Text style={styles.title}>Flight Confirmed!</Text>
                    <Text style={styles.subtitle}>
                        You land at <Text style={styles.highlight}>{flightData?.time || 'Unknown Time'}</Text>.
                    </Text>
                    <Text style={styles.description}>
                        Want a ride waiting for you at {flightData?.pickup || 'the airport'}?
                    </Text>

                    <View style={styles.estimateContainer}>
                        <Text style={styles.estimateLabel}>Estimated Fare</Text>
                        <Text style={styles.estimatePrice}>$45 - $55</Text>
                        <Text style={styles.estimateTime}>~15 miles</Text>
                    </View>

                    <TouchableOpacity style={styles.bookButton} onPress={onConfirm}>
                        <Text style={styles.bookButtonText}>Book Ride Now</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.skipButton} onPress={onClose}>
                        <Text style={styles.skipButtonText}>Maybe Later</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 20
    },
    modalView: {
        width: width * 0.85,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20
    },
    icon: {
        fontSize: 32
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#111'
    },
    subtitle: {
        fontSize: 16,
        color: '#444',
        marginBottom: 5,
        textAlign: 'center'
    },
    highlight: {
        fontWeight: 'bold',
        color: theme.colors.primary
    },
    description: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 25,
        lineHeight: 20
    },
    estimateContainer: {
        width: '100%',
        backgroundColor: '#F9F9F9',
        padding: 15,
        borderRadius: 10,
        marginBottom: 25,
        alignItems: 'center'
    },
    estimateLabel: {
        fontSize: 12,
        color: '#888',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 5
    },
    estimatePrice: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111'
    },
    estimateTime: {
        fontSize: 12,
        color: '#666'
    },
    bookButton: {
        backgroundColor: 'black',
        width: '100%',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 15
    },
    bookButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold'
    },
    skipButton: {
        padding: 10
    },
    skipButtonText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '600'
    }
});
