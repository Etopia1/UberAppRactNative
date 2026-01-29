import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Dimensions } from 'react-native';
import Map from '../components/Map';
import { theme } from '../constants/theme';
import Toast from 'react-native-toast-message';

const { height } = Dimensions.get('window');

export default function RideRequestScreen({ navigation, route }) {
    const [pickup, setPickup] = useState('Current Location');
    const [destination, setDestination] = useState('');

    useEffect(() => {
        if (route.params?.pickup) {
            setPickup(route.params.pickup); // Auto-fill from suggestion
        }
    }, [route.params]);

    const handleConfirmPickup = () => {
        if (!destination) {
            Toast.show({
                type: 'error',
                text1: 'Where to?',
                text2: 'Please enter a destination',
            });
            return;
        }
        navigation.navigate('RideSelection', { pickup, destination });
    };

    return (
        <View style={styles.container}>
            <Map style={styles.map} />

            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>

            {/* Bottom Sheet UI */}
            <View style={styles.bottomSheet}>
                <View style={styles.handle} />

                {/* Date/Time Toggle */}
                <View style={styles.timeToggle}>
                    <Text style={styles.timeText}>Now</Text>
                    <Text style={styles.dropdownIcon}>▼</Text>
                </View>

                <View style={styles.inputContainer}>
                    {/* Connector Line */}
                    <View style={styles.connectorContainer}>
                        <View style={styles.circleIndicator} />
                        <View style={styles.lineIndicator} />
                        <View style={styles.squareIndicator} />
                    </View>

                    <View style={styles.inputs}>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={[styles.input, styles.pickupInput]}
                                value={pickup}
                                onChangeText={setPickup}
                                placeholder="Pickup?"
                                selectTextOnFocus
                            />
                        </View>
                        <View style={styles.separator} />
                        <View style={styles.inputRow}>
                            <TextInput
                                style={[styles.input, styles.destInput]}
                                placeholder="Where to?"
                                value={destination}
                                onChangeText={setDestination}
                                autoFocus={!route.params?.pickup} // Auto focus if not pre-filled
                            />
                        </View>
                    </View>
                </View>

                <View style={styles.savedPlaces}>
                    <TouchableOpacity style={styles.savedPlaceItem}>
                        <View style={styles.iconCircle}><Text style={styles.iconText}>🏠</Text></View>
                        <Text style={styles.savedPlaceText}>Home</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.savedPlaceItem}>
                        <View style={styles.iconCircle}><Text style={styles.iconText}>💼</Text></View>
                        <Text style={styles.savedPlaceText}>Work</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.savedPlaceItem}>
                        <View style={styles.iconCircle}><Text style={styles.iconText}>➕</Text></View>
                        <Text style={styles.savedPlaceText}>Saved</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmPickup}>
                    <Text style={styles.btnText}>Choose a Ride</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
        backgroundColor: '#fff',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5
    },
    backArrow: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000'
    },
    map: {
        height: height * 0.55,
    },
    bottomSheet: {
        height: height * 0.5,
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        marginTop: -30,
        shadowColor: '#000',
        elevation: 10,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#ddd',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 15
    },
    timeToggle: {
        alignSelf: 'center',
        backgroundColor: '#eee',
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderRadius: 20,
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'center'
    },
    timeText: { fontWeight: 'bold', fontSize: 12, marginRight: 5 },
    dropdownIcon: { fontSize: 10, color: '#666' },

    inputContainer: {
        flexDirection: 'row',
        marginBottom: 25,
        backgroundColor: '#fff',
    },
    connectorContainer: {
        width: 30,
        alignItems: 'center',
        paddingTop: 15,
        paddingBottom: 15
    },
    circleIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#000',
        marginBottom: 5
    },
    lineIndicator: {
        width: 2,
        flex: 1,
        backgroundColor: '#ddd',
        marginBottom: 5
    },
    squareIndicator: {
        width: 8,
        height: 8,
        backgroundColor: '#000'
    },
    inputs: {
        flex: 1,
    },
    inputRow: {
        height: 50,
        justifyContent: 'center',
        backgroundColor: '#f6f6f6',
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 5
    },
    separator: {
        height: 5
    },
    input: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111'
    },
    pickupInput: { color: theme.colors.primary }, // Highlight pickup

    savedPlaces: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 25,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 20
    },
    savedPlaceItem: {
        alignItems: 'center'
    },
    iconCircle: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8
    },
    iconText: { fontSize: 20 },
    savedPlaceText: {
        fontWeight: '500',
        color: '#333',
        fontSize: 12
    },
    confirmBtn: {
        backgroundColor: '#000',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5
    },
    btnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold'
    }
});
