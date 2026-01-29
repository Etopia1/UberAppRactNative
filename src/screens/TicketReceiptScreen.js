import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Alert, Image, Dimensions } from 'react-native';
import { theme } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

export default function TicketReceiptScreen({ route, navigation }) {
    const { booking, flightDetails } = route.params;

    const generateHtml = () => {
        return `
            <html>
              <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
                <style>
                  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; text-align: center; color: #333; padding: 20px; }
                  .ticket { border: 2px solid #0F9D58; border-radius: 10px; padding: 20px; max-width: 600px; margin: 0 auto; }
                  .header { background-color: #0F9D58; color: white; padding: 15px; border-radius: 8px 8px 0 0; }
                  .header h1 { margin: 0; font-size: 24px; }
                  .airline-logo { width: 60px; height: 60px; object-fit: contain; margin: 10px auto; display: block; }
                  .flight-info { display: flex; justify-content: space-between; margin: 20px 0; border-bottom: 2px dashed #ddd; padding-bottom: 20px; }
                  .airport-code { font-size: 40px; font-weight: bold; color: #0F9D58; }
                  .time { font-size: 14px; color: #666; }
                  .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; text-align: left; margin-bottom: 20px; }
                  .detail-item { padding: 10px; background: #f9f9f9; border-radius: 5px; }
                  .label { font-size: 12px; color: #888; text-transform: uppercase; }
                  .value { font-size: 16px; font-weight: bold; color: #333; }
                  .barcode { margin-top: 20px; font-family: 'Courier New', Courier, monospace; letter-spacing: 5px; font-size: 20px; color: #555; }
                  .footer { margin-top: 30px; font-size: 12px; color: #aaa; }
                </style>
              </head>
              <body>
                <div class="ticket">
                  <div class="header">
                    <h1>Electronic Ticket</h1>
                    <p>Booking Reference: ${booking.pnr || booking.flightId}</p>
                  </div>
                  
                  <img src="${flightDetails.logo}" class="airline-logo" alt="Airline Logo" />
                  <h3>${flightDetails.airline}</h3>
                  
                  <div class="flight-info">
                    <div class="departure">
                      <div class="airport-code">${flightDetails.departure.airport}</div>
                      <div class="time">${flightDetails.departure.time}</div>
                    </div>
                    <div style="font-size: 24px; line-height: 50px;">✈</div>
                    <div class="arrival">
                      <div class="airport-code">${flightDetails.arrival.airport}</div>
                      <div class="time">${flightDetails.arrival.time}</div>
                    </div>
                  </div>
                  
                  <div class="details-grid">
                    <div class="detail-item">
                      <div class="label">Passenger</div>
                      <div class="value">JOLA ETOPIA</div>
                    </div>
                    <div class="detail-item">
                      <div class="label">Flight No</div>
                      <div class="value">${flightDetails.flightNumber}</div>
                    </div>
                    <div class="detail-item">
                      <div class="label">Class</div>
                      <div class="value">Economy</div>
                    </div>
                     <div class="detail-item">
                      <div class="label">Seat</div>
                      <div class="value">12A</div>
                    </div>
                    <div class="detail-item">
                      <div class="label">Date</div>
                      <div class="value">${new Date().toLocaleDateString()}</div>
                    </div>
                    <div class="detail-item">
                      <div class="label">Ticket No</div>
                      <div class="value">${booking._id.substring(0, 10).toUpperCase()}</div>
                    </div>
                  </div>
                  
                  <div class="barcode">
                    ||| || ||| || ||| || |||
                  </div>
                  
                  <div class="footer">
                    Thank you for booking with UberApp.<br>
                    Please present this receipt directly at the counter.
                  </div>
                </div>
              </body>
            </html>
        `;
    };

    const handlePrint = async () => {
        try {
            const { uri } = await Print.printToFileAsync({ html: generateHtml() });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
            Alert.alert('Error', 'Failed to generate receipt');
            console.error('Print error:', error);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.receiptCard}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Boarding Pass</Text>
                    <Image
                        source={{ uri: 'https://img.icons8.com/color/48/000000/verified-account.png' }}
                        style={{ width: 30, height: 30 }}
                    />
                </View>

                {/* Airline & Route */}
                <View style={styles.routeContainer}>
                    <View style={styles.airportInfo}>
                        <Text style={styles.airportCode}>{flightDetails.departure.airport}</Text>
                        <Text style={styles.cityText}>Departure</Text>
                        <Text style={styles.timeText}>{flightDetails.departure.time}</Text>
                    </View>

                    <View style={styles.planeIconContainer}>
                        <Ionicons name="airplane" size={24} color={theme.colors.primary} />
                        <Text style={styles.durationText}>{flightDetails.duration}</Text>
                    </View>

                    <View style={styles.airportInfo}>
                        <Text style={styles.airportCode}>{flightDetails.arrival.airport}</Text>
                        <Text style={styles.cityText}>Arrival</Text>
                        <Text style={styles.timeText}>{flightDetails.arrival.time}</Text>
                    </View>
                </View>

                {/* Divider */}
                <View style={styles.divider}>
                    <View style={[styles.circle, styles.leftCircle]} />
                    <View style={styles.line} />
                    <View style={[styles.circle, styles.rightCircle]} />
                </View>

                {/* Details */}
                <View style={styles.detailsContainer}>
                    <View style={styles.row}>
                        <View style={styles.detailItem}>
                            <Text style={styles.label}>Passenger</Text>
                            <Text style={styles.value}>JOLA ETOPIA</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.label}>Flight</Text>
                            <Text style={styles.value}>{flightDetails.flightNumber}</Text>
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={styles.detailItem}>
                            <Text style={styles.label}>Date</Text>
                            <Text style={styles.value}>{new Date().toLocaleDateString()}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.label}>Seat</Text>
                            <Text style={styles.value}>12A</Text>
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={styles.detailItem}>
                            <Text style={styles.label}>Class</Text>
                            <Text style={styles.value}>Economy</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.label}>PNR</Text>
                            <Text style={[styles.value, { color: theme.colors.primary }]}>{booking.pnr || 'PENDING'}</Text>
                        </View>
                    </View>
                </View>

                {/* Barcode (Simulated) */}
                <View style={styles.barcodeContainer}>
                    <Text style={styles.barcode}>||| || ||| || ||| || ||| || ||||||</Text>
                    <Text style={styles.ticketId}>TICKET: {booking._id.substring(0, 16).toUpperCase()}</Text>
                </View>
            </View>

            {/* Actions */}
            <TouchableOpacity style={styles.actionButton} onPress={handlePrint}>
                <Ionicons name="download-outline" size={24} color="#fff" style={{ marginRight: 10 }} />
                <Text style={styles.actionText}>Download / Share Ticket</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Home')}>
                <Text style={styles.secondaryText}>Back to Home</Text>
            </TouchableOpacity>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212', // Dark background
    },
    content: {
        padding: 20,
        alignItems: 'center',
        paddingTop: 60
    },
    receiptCard: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 30,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 5 }
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.colors.primary,
        padding: 20,
        paddingTop: 25
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 1
    },
    routeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 25,
        backgroundColor: '#fff'
    },
    airportInfo: {
        alignItems: 'center'
    },
    airportCode: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333'
    },
    cityText: {
        fontSize: 12,
        color: '#888',
        textTransform: 'uppercase',
        marginTop: 4
    },
    timeText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.primary,
        marginTop: 4
    },
    planeIconContainer: {
        alignItems: 'center'
    },
    durationText: {
        fontSize: 12,
        color: '#bbb',
        marginTop: 5
    },
    divider: {
        height: 1,
        width: '100%',
        position: 'relative',
        backgroundColor: 'transparent',
        justifyContent: 'center',
        marginVertical: 0
    },
    line: {
        height: 2,
        width: '100%',
        backgroundColor: '#f0f0f0',
        borderStyle: 'dashed',
        borderRadius: 1
    },
    circle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#121212', // Match screen background
        position: 'absolute',
        top: -12
    },
    leftCircle: { left: -12 },
    rightCircle: { right: -12 },
    detailsContainer: {
        padding: 25,
        backgroundColor: '#fff'
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20
    },
    detailItem: {
        flex: 1
    },
    label: {
        fontSize: 12,
        color: '#aaa',
        textTransform: 'uppercase',
        marginBottom: 4
    },
    value: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333'
    },
    barcodeContainer: {
        alignItems: 'center',
        paddingBottom: 25,
        borderTopWidth: 2,
        borderTopColor: '#f5f5f5',
        paddingTop: 15,
        marginHorizontal: 25
    },
    barcode: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 24,
        letterSpacing: 4,
        color: '#555',
        opacity: 0.6,
        transform: [{ scaleY: 1.5 }]
    },
    ticketId: {
        fontSize: 10,
        color: '#ccc',
        marginTop: 10,
        letterSpacing: 1
    },
    actionButton: {
        flexDirection: 'row',
        backgroundColor: theme.colors.primary,
        paddingVertical: 18,
        paddingHorizontal: 30,
        borderRadius: 30,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
        shadowColor: theme.colors.primary,
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8
    },
    actionText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold'
    },
    secondaryButton: {
        paddingVertical: 15
    },
    secondaryText: {
        color: '#666',
        fontSize: 16
    }
});
