import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Map({ style, children }) {
    return (
        <View style={[styles.container, style]}>
            <View style={styles.placeholder}>
                <Text style={styles.text}>Map View (Web Not Supported)</Text>
                <Text style={styles.subtext}>Open on Android/iOS to see the map.</Text>
            </View>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center'
    },
    placeholder: {
        alignItems: 'center',
        justifyContent: 'center'
    },
    text: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#666'
    },
    subtext: {
        fontSize: 14,
        color: '#999',
        marginTop: 5
    }
});
