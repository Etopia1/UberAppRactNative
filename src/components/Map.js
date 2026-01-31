import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Platform } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import * as Location from 'expo-location';
import Constants from 'expo-constants'; // Import Constants
import { theme } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

// Set Token from App Config (Best Practice)
const MAPBOX_TOKEN = Constants.expoConfig?.extra?.MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiZXRvcGlhMTIzNCIsImEiOiJjbWtzMDZtenUxN3NlM2VzOTJobnp5dm1jIn0.nJ-d1lTNg9LBgfxp9BOR5A';
MapboxGL.setAccessToken(MAPBOX_TOKEN);

export default function Map({ origin, destination, onMapReady, nearbyDrivers = [], routeGeoJSON }) {
  const cameraRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [followUser, setFollowUser] = useState(true);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation([location.coords.longitude, location.coords.latitude]);
    })();
  }, []);

  const centerOnUser = async () => {
    if (userLocation && cameraRef.current) {
      setFollowUser(true);
      cameraRef.current.setCamera({
        centerCoordinate: userLocation,
        zoomLevel: 15,
        animationDuration: 1000,
        pitch: 45 // 3D Pitch
      });
    } else {
      // Fallback if no location yet
      const location = await Location.getCurrentPositionAsync({});
      const newLoc = [location.coords.longitude, location.coords.latitude];
      setUserLocation(newLoc);
      cameraRef.current?.setCamera({
        centerCoordinate: newLoc,
        zoomLevel: 15,
        animationDuration: 1000,
        pitch: 45
      });
    }
  };

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        style={styles.map}
        styleURL="mapbox://styles/mapbox/navigation-night-v1" // Slick 3D Night Style
        logoEnabled={false}
        attributionEnabled={false}
        onDidFinishLoadingMap={onMapReady}
        onTouchStart={() => setFollowUser(false)} // Stop following on user interaction
      >
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={15}
          pitch={45} // Tilt for 3D effect
          centerCoordinate={userLocation || [0, 0]}
          followUserLocation={followUser && !destination && !routeGeoJSON}
          followUserMode="compass"
          animationMode="flyTo"
          animationDuration={2000}
        />

        {/* 3D Buildings Layer */}
        <MapboxGL.FillExtrusionLayer
          id="3d-buildings"
          sourceID="composite"
          sourceLayerID="building"
          filter={['==', 'extrude', 'true']}
          minZoomLevel={12}
          style={{
            fillExtrusionColor: '#aaa',
            fillExtrusionHeight: ['get', 'height'],
            fillExtrusionBase: ['get', 'min_height'],
            fillExtrusionOpacity: 0.6
          }}
        />

        <MapboxGL.UserLocation
          visible={true}
          showsUserHeadingIndicator={true}
          androidRenderMode="gps"
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
                style={{ width: 25, height: 25, resizeMode: 'contain' }}
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
                lineOpacity: 0.9
              }}
            />
          </MapboxGL.ShapeSource>
        )}

      </MapboxGL.MapView>

      {/* Recenter Button */}
      <TouchableOpacity style={styles.recenterBtn} onPress={centerOnUser}>
        <Ionicons name="locate" size={24} color={theme.colors.primary} />
      </TouchableOpacity>
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
    backgroundColor: '#fff', padding: 5, borderRadius: 15, elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 2
  },
  recenterBtn: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4
  }
});
