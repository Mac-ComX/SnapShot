import React, { useState, useEffect, useRef, useMemo } from 'react'; 
import { View, Text, StyleSheet, ActivityIndicator, Image, TouchableOpacity, Alert, Dimensions, Animated } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useNavigation } from '@react-navigation/native';
import BottomSheet from '@gorhom/bottom-sheet';

const { height } = Dimensions.get('window');

export default function MapScreen() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState([]);
  const [region, setRegion] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [mapType, setMapType] = useState('satellite'); // Default to satellite mode
  const [bottomSheetIndex, setBottomSheetIndex] = useState(0); // Gérer l'index du BottomSheet

  const sheetRef = useRef(null);
  const mapRef = useRef(null);
  const navigation = useNavigation();

  // Animations pour les icônes
  const fadeAnim = useRef(new Animated.Value(1)).current; // Initialiser à l'opacité 1
  const translateYAnim = useRef(new Animated.Value(0)).current; // Initialiser sans translation

  const snapPoints = useMemo(() => [height * 0.1, height * 0.38, height * 0.85], [height]);

  // Fonction pour récupérer la localisation de l'utilisateur
  useEffect(() => {
    const getLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'La localisation est nécessaire pour cette fonctionnalité.');
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High, // Position très précise
      });
      setLocation(currentLocation.coords);
      setRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.00922,
        longitudeDelta: 0.00421,
      });
      setLoading(false);
    };

    // Fonction pour récupérer les photos depuis Firestore
    const subscribeToPhotos = () => {
      const unsubscribe = onSnapshot(collection(db, 'decorations'), (snapshot) => {
        const photoList = snapshot.docs.map(doc => doc.data());
        setPhotos(photoList); // Stocke les photos récupérées
      }, (error) => {
        console.error('Erreur lors de la récupération des photos :', error);
      });

      return unsubscribe;
    };

    getLocation();
    const unsubscribe = subscribeToPhotos();

    return () => unsubscribe();
  }, []);

  const openPhotoDetails = (photo) => {
    setSelectedPhoto(photo);
    sheetRef.current?.snapToIndex(1); // Ouvrir le BottomSheet
  };

  // Aller à la position de l'utilisateur
  const goToUserLocation = async () => {
    try {
      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      if (mapRef.current) {
        const camera = {
          center: {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          },
          zoom: 17,
          pitch: 0,
          heading: 0,
          altitude: 1000,
        };
        mapRef.current.animateCamera(camera, { duration: 3000 });
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de récupérer la position actuelle.');
    }
  };

  // Alterner entre les modes de carte
  const toggleMapType = () => {
    setMapType((prevType) => (prevType === 'standard' ? 'satellite' : 'standard'));
  };

  // Calculer la taille du marqueur en fonction du niveau de zoom
  const calculateMarkerSize = () => {
    const defaultSize = 20;
    const zoomFactor = zoomLevel > 1 ? zoomLevel / 7 : 1;
    return defaultSize + 1 * 8 * zoomFactor;
  };

  const handleRegionChangeComplete = (newRegion) => {
    setRegion(newRegion);
    const zoom = Math.round(Math.log(360 / newRegion.latitudeDelta) / Math.LN2);
    setZoomLevel(zoom);
  };

  // Animation du BottomSheet
  const handleBottomSheetChange = (index) => {
    setBottomSheetIndex(index);

    if (index === 2) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: -30,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  if (loading || !location) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Chargement de la carte...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Bouton de menu */}
      <Animated.View
        style={[
          styles.menuButton,
          {
            opacity: fadeAnim,
            transform: [{ translateY: translateYAnim }],
          },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu" size={28} color="#1b484e" />
        </TouchableOpacity>
      </Animated.View>

      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        mapType={mapType}
        pitchEnabled={true}
        zoomControlEnabled={true}
        showsCompass={true}
        onRegionChangeComplete={handleRegionChangeComplete}
      >
        {photos.map((photo, index) => (
          <Marker
            key={index}
            coordinate={{
              latitude: photo.latitude,
              longitude: photo.longitude,
            }}
            onPress={() => openPhotoDetails(photo)}
          >
            <Image
              source={{ uri: photo.imageUri }}
              style={[styles.markerImage, { width: calculateMarkerSize(), height: calculateMarkerSize() }]}
            />
          </Marker>
        ))}
      </MapView>

      <BottomSheet
        ref={sheetRef}
        snapPoints={snapPoints}
        index={0}
        onChange={handleBottomSheetChange}
      >
        {selectedPhoto ? (
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedPhoto.installationName}</Text>
            <Image source={{ uri: selectedPhoto.imageUri }} style={styles.modalImage} />
            <View style={styles.modalFullContent}>
              <Text style={styles.modalDescription}>{selectedPhoto.comment}</Text>
              <Text style={styles.modalMetadata}>Type : {selectedPhoto.installationType || 'Non spécifié'}</Text>
              <Text style={styles.modalMetadata}>Statut : {selectedPhoto.installationStatus || 'Non spécifié'}</Text>
              <Text style={styles.modalMetadata}>État : {selectedPhoto.functionalityStatus || 'Non spécifié'}</Text>
              <Text style={styles.modalMetadata}>Urgence de réparation : {selectedPhoto.repairUrgency || 'Non spécifié'}</Text>
              <Text style={styles.modalDate}>Date : {new Date(selectedPhoto.createdAt).toLocaleDateString()}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.noPhotoText}>Aucune photo sélectionnée</Text>
        )}
      </BottomSheet>

      {/* Bouton pour changer le type de carte */}
      <Animated.View
        style={[
          styles.mapToggleButton,
          {
            opacity: fadeAnim,
            transform: [{ translateY: translateYAnim }],
          },
        ]}
      >
        <TouchableOpacity onPress={toggleMapType}>
          <Ionicons name={mapType === 'standard' ? 'earth' : 'map'} size={21} color="#1b484e" />
        </TouchableOpacity>
      </Animated.View>

      {/* Bouton pour se déplacer à la position de l'utilisateur */}
      <Animated.View
        style={[
          styles.floatingButton,
          {
            opacity: fadeAnim,
            transform: [{ translateY: translateYAnim }],
          },
        ]}
      >
        <TouchableOpacity onPress={goToUserLocation}>
          <Ionicons name="navigate-outline" size={28} color="#1b484e" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerImage: {
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#fff',
  },
  modalContent: {
    padding: 8,
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  modalFullContent: {
    marginTop: 50,
  },
  modalDescription: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMetadata: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  modalDate: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  noPhotoText: {
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 16,
  },
  floatingButton: {
    position: 'absolute',
    top: 120,
    right: 20,
    backgroundColor: '#66b08d',
    borderRadius: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  mapToggleButton: {
    position: 'absolute',
    top: 75,
    right: 20,
    backgroundColor: '#66b08d',
    borderRadius: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  menuButton: {
    position: 'absolute',
    top: 75,
    left: 20,
    zIndex: 100,
    backgroundColor: '#66b08d',
    borderRadius: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
});
