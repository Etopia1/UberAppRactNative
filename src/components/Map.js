import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, Image, Dimensions } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { theme } from '../constants/theme';

// Set the Access Token
const MAPBOX_TOKEN = 'pk.eyJ1IjoiZXRvcGlhMTIzNCIsImEiOiJjbWtzMDZtenUxN3NlM2VzOTJobnp5dm1jIn0.nJ-d1lTNg9LBgfxp9BOR5A';
MapboxGL.setAccessToken(MAPBOX_TOKEN);

export default function Map({ origin, destination, onMapReady, nearbyDrivers = [], routeGeoJSON }) {
  const cameraRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation([location.coords.longitude, location.coords.latitude]);
    })();
  }, []);

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        style={styles.map}
        styleURL={MapboxGL.StyleURL.Dark}
        logoEnabled={false}
        attributionEnabled={false}
        onDidFinishLoadingMap={onMapReady}
        scrollEnabled={true}
        zoomEnabled={true}
        pitchEnabled={true}
        rotateEnabled={true}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={14}
          centerCoordinate={userLocation || [0, 0]}
          followUserLocation={!destination && !routeGeoJSON}
          followUserMode="normal"
          animationMode="flyTo"
          animationDuration={2000}
        />

        <MapboxGL.UserLocation
          visible={true}
          showsUserHeadingIndicator={true}
        />

        {/* Origin Marker */}
        {origin && (
          <MapboxGL.PointAnnotation
            id="origin"
            coordinate={[origin.longitude, origin.latitude]}
          >
            <View style={styles.markerContainer}>
              <View style={[styles.markerDot, { backgroundColor: theme.colors.primary }]} />
            </View>
          </MapboxGL.PointAnnotation>
        )}

        {/* Destination Marker */}
        {destination && (
          <MapboxGL.PointAnnotation
            id="dest"
            coordinate={[destination.longitude, destination.latitude]}
          >
            <View style={styles.markerContainer}>
              <View style={[styles.markerDot, { backgroundColor: 'red' }]} />
            </View>
          </MapboxGL.PointAnnotation>
        )}

        {/* Nearby Drivers */}
        {nearbyDrivers.map(driver => (
          <MapboxGL.PointAnnotation
            key={driver.id}
            id={`driver-${driver.id}`}
            coordinate={[driver.coordinate.longitude, driver.coordinate.latitude]}
          >
            <View style={styles.driverMarker}>
              <Image
                source={require('../../assets/onboarding_car.jpg')}
                style={{ width: 20, height: 20, resizeMode: 'contain' }}
              />
            </View>
          </MapboxGL.PointAnnotation>
        ))}

        {/* Dynamic Route Line */}
        {routeGeoJSON && (
          <MapboxGL.ShapeSource id="routeSource" shape={routeGeoJSON}>
            <MapboxGL.LineLayer
              id="routeFill"
              style={{
                lineColor: theme.colors.primary,
                lineWidth: 5,
                lineCap: 'round',
                lineJoin: 'round',
                lineOpacity: 0.8
              }}
            />
          </MapboxGL.ShapeSource>
        )}

      </MapboxGL.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  map: { flex: 1 },
  markerContainer: {
    width: 20, height: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 10
  },
  markerDot: {
    width: 12, height: 12, borderRadius: 6
  },
  driverMarker: {
    backgroundColor: '#fff', padding: 3, borderRadius: 10, elevation: 2
  }
});
