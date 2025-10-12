import { Platform, Linking, Alert } from 'react-native';

/**
 * Opens the native maps app (Google Maps on Android, Apple Maps on iOS)
 * with navigation to the specified address
 */
export const openMapsNavigation = async (address: string, label?: string) => {
  try {
    // Encode the address for URL
    const encodedAddress = encodeURIComponent(address);
    
    let url: string;

    if (Platform.OS === 'ios') {
      // Apple Maps URL scheme
      url = `maps://app?daddr=${encodedAddress}&dirflg=d`;
      
      // Alternative: Google Maps on iOS if installed
      const googleMapsUrl = `comgooglemaps://?daddr=${encodedAddress}&directionsmode=driving`;
      
      // Try Google Maps first, fall back to Apple Maps
      const canOpenGoogleMaps = await Linking.canOpenURL(googleMapsUrl);
      if (canOpenGoogleMaps) {
        url = googleMapsUrl;
      }
    } else {
      // Android - Google Maps
      url = `google.navigation:q=${encodedAddress}&mode=d`;
      
      // Alternative: Use geo: scheme if Google Maps is not installed
      const geoUrl = `geo:0,0?q=${encodedAddress}`;
      
      // Try Google Maps, fall back to generic geo URI
      const canOpenGoogleMaps = await Linking.canOpenURL(url);
      if (!canOpenGoogleMaps) {
        url = geoUrl;
      }
    }

    // Check if the URL can be opened
    const canOpen = await Linking.canOpenURL(url);
    
    if (canOpen) {
      await Linking.openURL(url);
      return true;
    } else {
      // Fallback: open in browser with Google Maps web
      const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
      await Linking.openURL(webUrl);
      return true;
    }
  } catch (error) {
    console.error('Error opening maps navigation:', error);
    Alert.alert(
      'Navigation Error',
      'Unable to open maps application. Please ensure you have Google Maps or Apple Maps installed.',
      [{ text: 'OK' }]
    );
    return false;
  }
};

/**
 * Opens maps navigation using coordinates (latitude and longitude)
 * More accurate than address-based navigation
 */
export const openMapsNavigationWithCoords = async (
  latitude: number,
  longitude: number,
  label?: string
) => {
  try {
    let url: string;

    if (Platform.OS === 'ios') {
      // Apple Maps with coordinates
      url = `maps://app?daddr=${latitude},${longitude}&dirflg=d`;
      
      // Try Google Maps on iOS if available
      const googleMapsUrl = `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=driving`;
      const canOpenGoogleMaps = await Linking.canOpenURL(googleMapsUrl);
      if (canOpenGoogleMaps) {
        url = googleMapsUrl;
      }
    } else {
      // Android - Google Maps with coordinates
      url = `google.navigation:q=${latitude},${longitude}&mode=d`;
      
      // Fallback to geo URI
      const geoUrl = `geo:${latitude},${longitude}?q=${latitude},${longitude}${label ? `(${encodeURIComponent(label)})` : ''}`;
      const canOpenGoogleMaps = await Linking.canOpenURL(url);
      if (!canOpenGoogleMaps) {
        url = geoUrl;
      }
    }

    const canOpen = await Linking.canOpenURL(url);
    
    if (canOpen) {
      await Linking.openURL(url);
      return true;
    } else {
      // Fallback to web version
      const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      await Linking.openURL(webUrl);
      return true;
    }
  } catch (error) {
    console.error('Error opening maps navigation with coords:', error);
    Alert.alert(
      'Navigation Error',
      'Unable to open maps application. Please ensure you have Google Maps or Apple Maps installed.',
      [{ text: 'OK' }]
    );
    return false;
  }
};

/**
 * Opens maps to show a location without navigation
 * Useful for viewing the location before starting navigation
 */
export const openMapsLocation = async (
  address: string,
  latitude?: number,
  longitude?: number
) => {
  try {
    const encodedAddress = encodeURIComponent(address);
    let url: string;

    if (latitude && longitude) {
      // Use coordinates if available (more accurate)
      if (Platform.OS === 'ios') {
        url = `maps://app?ll=${latitude},${longitude}&q=${encodedAddress}`;
      } else {
        url = `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodedAddress})`;
      }
    } else {
      // Use address only
      if (Platform.OS === 'ios') {
        url = `maps://app?q=${encodedAddress}`;
      } else {
        url = `geo:0,0?q=${encodedAddress}`;
      }
    }

    const canOpen = await Linking.canOpenURL(url);
    
    if (canOpen) {
      await Linking.openURL(url);
      return true;
    } else {
      // Fallback to web
      const webUrl = latitude && longitude
        ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
        : `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
      await Linking.openURL(webUrl);
      return true;
    }
  } catch (error) {
    console.error('Error opening maps location:', error);
    Alert.alert(
      'Maps Error',
      'Unable to open maps application.',
      [{ text: 'OK' }]
    );
    return false;
  }
};

