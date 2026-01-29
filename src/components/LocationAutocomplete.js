import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import api from '../services/api';
import { theme } from '../constants/theme';

export default function LocationAutocomplete({ placeholder, onSelect, initialValue = '', zIndex = 1 }) {
    const [query, setQuery] = useState(initialValue);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        setQuery(initialValue);
    }, [initialValue]);

    useEffect(() => {
        let active = true;

        const fetchSuggestions = async () => {
            if (query.length < 2) {
                setSuggestions([]);
                return;
            }

            setLoading(true);
            try {
                const response = await api.get(`/flight/search-location?keyword=${query}`);
                if (active) {
                    setSuggestions(response.data.results || []);
                    setShowSuggestions(true);
                }
            } catch (error) {
                console.error('Frontend Location Search Error:', error);
            } finally {
                if (active) setLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            if (isFocused && query !== initialValue) {
                fetchSuggestions();
            }
        }, 500);

        return () => {
            clearTimeout(timeoutId);
            active = false;
        };
    }, [query, isFocused]);

    const handleSelect = (item) => {
        setQuery(item.detailedName); // detailedName is "City, Country (CODE)"
        setShowSuggestions(false);
        setIsFocused(false);
        onSelect(item);
    };

    const clearInput = () => {
        setQuery('');
        setSuggestions([]);
        setShowSuggestions(false);
        onSelect({ iataCode: '' }); // Clear parent selection
    };

    return (
        <View style={[styles.container, { zIndex }]}>
            <View style={[styles.inputContainer, isFocused && styles.inputFocused]}>
                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    value={query}
                    onChangeText={text => {
                        setQuery(text);
                        if (text.length === 0) setShowSuggestions(false);
                    }}
                    onFocus={() => {
                        setIsFocused(true);
                        if (query.length >= 2) setShowSuggestions(true);
                    }}
                    onBlur={() => {
                        // Delay hiding so clicks on list items register
                        setTimeout(() => {
                            // Only hide if we aren't selecting something (handled by handleSelect)
                            // Ideally, we keep it open if we tap the list, but blur triggers first.
                            // Standard pattern: scrollview keyboardShouldPersistTaps='handled'
                            // We can use a small delay or rely on the touchable opacity logic
                            // setProcessing(false); // simplification
                        }, 200);
                    }}
                    placeholderTextColor="#999"
                />

                {loading ? (
                    <ActivityIndicator size="small" color={theme.colors.secondary} style={styles.rightIcon} />
                ) : query.length > 0 ? (
                    <TouchableOpacity onPress={clearInput} style={styles.rightIcon}>
                        <Text style={styles.clearText}>✕</Text>
                    </TouchableOpacity>
                ) : null}
            </View>

            {showSuggestions && suggestions.length > 0 && (
                <View style={styles.suggestionsDropdown}>
                    <FlatList
                        data={suggestions}
                        keyExtractor={(item) => item.iataCode}
                        keyboardShouldPersistTaps="handled"
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.suggestionItem} onPress={() => handleSelect(item)}>
                                <View style={styles.codeBadge}>
                                    <Text style={styles.iataCode}>{item.iataCode}</Text>
                                </View>
                                <View style={styles.textDetails}>
                                    <Text style={styles.cityName}>{item.name}</Text>
                                    <Text style={styles.airportName}>{item.detailedName}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                        style={styles.list}
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 15,
        position: 'relative',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        paddingHorizontal: 12,
        height: 50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2
    },
    inputFocused: {
        borderColor: theme.colors.secondary,
        borderWidth: 1.5
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        height: '100%'
    },
    rightIcon: {
        padding: 5
    },
    clearText: {
        fontSize: 14,
        color: '#999',
        fontWeight: 'bold'
    },
    suggestionsDropdown: {
        position: 'absolute',
        top: 55,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderRadius: 12,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        maxHeight: 250,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        overflow: 'hidden'
    },
    list: {
        maxHeight: 250
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5'
    },
    codeBadge: {
        backgroundColor: '#F0F7FF',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        marginRight: 12,
        minWidth: 50,
        alignItems: 'center'
    },
    iataCode: {
        fontWeight: 'bold',
        fontSize: 16,
        color: theme.colors.secondary
    },
    textDetails: {
        flex: 1
    },
    cityName: {
        fontWeight: '600',
        fontSize: 15,
        color: '#333',
        marginBottom: 2
    },
    airportName: {
        fontSize: 13,
        color: '#777'
    }
});
