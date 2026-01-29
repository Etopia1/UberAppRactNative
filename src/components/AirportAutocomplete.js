import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';

// Robust local dataset to ensure "no errors" and instant suggestions
const MAJOR_AIRPORTS = [
    { iata: 'JFK', city: 'New York', name: 'John F. Kennedy International Airport' },
    { iata: 'LHR', city: 'London', name: 'Heathrow Airport' },
    { iata: 'DXB', city: 'Dubai', name: 'Dubai International Airport' },
    { iata: 'LAX', city: 'Los Angeles', name: 'Los Angeles International Airport' },
    { iata: 'CDG', city: 'Paris', name: 'Charles de Gaulle Airport' },
    { iata: 'HND', city: 'Tokyo', name: 'Haneda Airport' },
    { iata: 'SIN', city: 'Singapore', name: 'Changi Airport' },
    { iata: 'FRA', city: 'Frankfurt', name: 'Frankfurt Airport' },
    { iata: 'AMS', city: 'Amsterdam', name: 'Schiphol Airport' },
    { iata: 'ORD', city: 'Chicago', name: 'O\'Hare International Airport' },
    { iata: 'YYZ', city: 'Toronto', name: 'Pearson International Airport' },
    { iata: 'SYD', city: 'Sydney', name: 'Kingsford Smith Airport' },
    { iata: 'LOS', city: 'Lagos', name: 'Murtala Muhammed International Airport' },
    { iata: 'JNB', city: 'Johannesburg', name: 'O.R. Tambo International Airport' },
    { iata: 'CAI', city: 'Cairo', name: 'Cairo International Airport' },
    { iata: 'ACC', city: 'Accra', name: 'Kotoka International Airport' },
    { iata: 'NBO', city: 'Nairobi', name: 'Jomo Kenyatta International Airport' }
];

export default function AirportAutocomplete({ placeholder, initialValue, onSelect, zIndex }) {
    const [query, setQuery] = useState(initialValue || '');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        if (query.length > 0) {
            const filtered = MAJOR_AIRPORTS.filter(airport =>
                airport.city.toLowerCase().includes(query.toLowerCase()) ||
                airport.iata.toLowerCase().includes(query.toLowerCase()) ||
                airport.name.toLowerCase().includes(query.toLowerCase())
            );
            setSuggestions(filtered);
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    }, [query]);

    const handleSelect = (airport) => {
        setQuery(`${airport.city} (${airport.iata})`);
        setShowSuggestions(false);
        onSelect(airport);
    };

    return (
        <View style={[styles.container, { zIndex: zIndex || 1 }]}>
            <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor={theme.colors.darkGray}
                value={query}
                onChangeText={setQuery}
                onFocus={() => {
                    if (query.length > 0) setShowSuggestions(true);
                }}
            />

            {showSuggestions && suggestions.length > 0 && (
                <View style={styles.dropdown}>
                    <FlatList
                        data={suggestions}
                        keyExtractor={item => item.iata}
                        keyboardShouldPersistTaps="handled"
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.item} onPress={() => handleSelect(item)}>
                                <View style={styles.codeBadge}>
                                    <Text style={styles.codeText}>{item.iata}</Text>
                                </View>
                                <View>
                                    <Text style={styles.cityText}>{item.city}</Text>
                                    <Text style={styles.nameText}>{item.name}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                        style={{ maxHeight: 200 }}
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    input: {
        backgroundColor: theme.colors.inputBg,
        borderWidth: 1,
        borderColor: theme.colors.inputBorder,
        borderRadius: 12,
        padding: 16,
        color: theme.colors.text,
        fontSize: 16,
        fontWeight: 'bold',
    },
    dropdown: {
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.inputBorder,
        elevation: 10,
        zIndex: 1000,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.inputBorder,
    },
    codeBadge: {
        backgroundColor: theme.colors.primary + '20', // 20% opacity hex
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 6,
        marginRight: 12,
    },
    codeText: {
        color: theme.colors.primary,
        fontWeight: 'bold',
        fontSize: 14,
    },
    cityText: {
        color: theme.colors.text,
        fontWeight: 'bold',
        fontSize: 15,
    },
    nameText: {
        color: theme.colors.darkGray,
        fontSize: 12,
    }
});
