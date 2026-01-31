import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';
import api from '../services/api';
import { ActivityIndicator } from 'react-native';

export default function AirportAutocomplete({ placeholder, initialValue, onSelect, zIndex }) {
    const [query, setQuery] = useState(initialValue || '');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchAirports = async () => {
            if (query.length < 2) {
                setShowSuggestions(false);
                return;
            }

            setLoading(true);
            try {
                // Call Backend Amadeus Proxy
                const response = await api.get(`/flight/locations?keyword=${query}`);
                if (response.data.results) {
                    const formatted = response.data.results.map(item => ({
                        iata: item.iataCode,
                        city: item.detailedName.split(',')[0], // Extract City
                        name: item.name,
                        raw: item
                    }));
                    setSuggestions(formatted);
                    setShowSuggestions(true);
                }
            } catch (error) {
                console.log('Airport Search Error:', error);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(fetchAirports, 500); // 500ms debounce
        return () => clearTimeout(debounce);
    }, [query]);

    const handleSelect = (airport) => {
        setQuery(`${airport.city} (${airport.iata})`);
        setShowSuggestions(false);
        onSelect(airport);
    };

    return (
        <View style={[styles.container, { zIndex: zIndex || 1 }]}>
            <View>
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
                {loading && (
                    <ActivityIndicator
                        size="small"
                        color={theme.colors.primary}
                        style={{ position: 'absolute', right: 15, top: 15 }}
                    />
                )}
            </View>

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
