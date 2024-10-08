import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity, 
  Alert, 
  Dimensions, 
  Animated, 
  ScrollView,
  Modal,
  Image,
  Linking,
  Platform
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useNavigation } from '@react-navigation/native';
import BottomSheet from '@gorhom/bottom-sheet';
import SvgCircle from '../components/svg/SvgCircle';
import PublicImage from '../components/PublicImage';
import { Picker } from '@react-native-picker/picker';

const { height } = Dimensions.get('window');

// Fonction pour calculer la distance entre deux coordonnées GPS
const calculateDistance = (coord1, coord2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371e3; // Rayon de la Terre en mètres
  const lat1 = toRad(coord1.latitude);
  const lat2 = toRad(coord2.latitude);
  const deltaLat = toRad(coord2.latitude - coord1.latitude);
  const deltaLon = toRad(coord2.longitude - coord1.longitude);

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// Fonction pour parser la chaîne de caractères du format "30/09/2024, 17:46:05"
const parseDateTimeString = (dateTimeString) => {
  const [datePart, timePart] = dateTimeString.split(', ');
  const [day, month, year] = datePart.split('/');
  const [hours, minutes] = timePart.split(':');
  const date = new Date(`${year}-${month}-${day}T${hours}:${minutes}:00`);
  return date;
};

// Fonction pour formater la date en "Lundi 30 Septembre 2024 à 17:46"
const formatDate = (date) => {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = date.toLocaleDateString('fr-FR', options);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${formattedDate} à ${hours}:${minutes}`;
};

// Composant de marqueur optimisé avec React.memo
const PhotoMarker = React.memo(({ photo, onPressDetails, onPressEditPosition, markerSize, onDragEnd, draggable }) => {
  const borderColor = useMemo(() => {
    if (photo.installationType === 'Armoire') { 
      return 'black'; // Couleur noire pour les armoires
    } else if (photo.functionalityStatus === 'En panne') {
      return 'red';
    } else if (photo.functionalityStatus === 'Fonctionnelle') {
      return 'green';
    }
    return '#ffffff'; // Couleur par défaut
  }, [photo.functionalityStatus, photo.installationType]);

  // Fonction pour ouvrir l'application GPS
  const handleNavigateToMarker = () => {
    const latitude = photo.latitude;
    const longitude = photo.longitude;
    const label = encodeURIComponent(photo.installationName || 'Destination');
    let url = '';

    if (Platform.OS === 'ios') {
      url = `http://maps.apple.com/?ll=${latitude},${longitude}&q=${label}`;
    } else {
      url = `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`;
    }

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Erreur', 'Aucune application de navigation disponible.');
      }
    }).catch(err => {
      console.error('Erreur lors de l\'ouverture de l\'application de navigation:', err);
      Alert.alert('Erreur', 'Impossible d\'ouvrir l\'application de navigation.');
    });
  };

  return (
    <Marker
      coordinate={{
        latitude: photo.latitude,
        longitude: photo.longitude,
      }}
      draggable={draggable}
      onDragEnd={(e) => onDragEnd(photo, e.nativeEvent.coordinate)}
    >
      <PublicImage 
        storagePath={photo.imageUri}
        style={[
          styles.markerImage,
          {
            width: markerSize,
            height: markerSize,
            borderColor,
          },
        ]}
      />
      <Callout tooltip>
        <View style={styles.calloutContainer}>
          {/* Image de l'installation */}
          <PublicImage
            storagePath={photo.imageUri}
            style={styles.calloutImage}
          />
          <Text style={styles.calloutTitle}>{photo.rue || photo.installationName}</Text>
          <View style={styles.calloutButtonsContainer}>
            <TouchableOpacity style={styles.calloutButton} onPress={() => onPressDetails(photo)}>
              <Ionicons name="information-circle-outline" size={20} color="#fff" />
              <Text style={styles.calloutButtonText}>Détails</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.calloutButton} onPress={() => onPressEditPosition(photo)}>
              <Ionicons name="map-outline" size={20} color="#fff" />
              <Text style={styles.calloutButtonText}>Modifier</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.calloutButton} onPress={handleNavigateToMarker}>
              <Ionicons name="navigate-outline" size={20} color="#fff" />
              <Text style={styles.calloutButtonText}>GPS</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Callout>
    </Marker>
  );
});

export default function MapScreen() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [mapType, setMapType] = useState('standard');
  const [bottomSheetIndex, setBottomSheetIndex] = useState(0);
  const [selectedArmoire, setSelectedArmoire] = useState('Toutes');
  const [modalVisible, setModalVisible] = useState(false);
  const [draggablePhotoId, setDraggablePhotoId] = useState(null); // État pour le marqueur déplaçable

  const sheetRef = useRef(null);
  const mapRef = useRef(null);
  const navigation = useNavigation();
  const TOLERANCE_RADIUS = 20;

  // Animations pour les autres boutons
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  // Animation pour le bouton flottant
  const fadeFloatingButtonAnim = useRef(new Animated.Value(1)).current;

  const snapPoints = useMemo(() => [height * 0.1, height * 0.45, height * 0.90], [height]);

  const hasSetInitialRegionRef = useRef(false);
  const initialLocationRef = useRef(null);
  const isUserInteracting = useRef(false);

  // Initialisation de la localisation et abonnement aux photos
  useEffect(() => {
    let isMounted = true;
    let locationSubscription;

    const initializeUserLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (isMounted) setLoading(false);
        return;
      }

      let initialPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      const { coords } = initialPosition;
      if (isMounted) setLocation(coords);

      if (!hasSetInitialRegionRef.current && mapRef.current) {
        const initialRegion = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };
        mapRef.current.animateToRegion(initialRegion, 1000);
        hasSetInitialRegionRef.current = true;
      }

      initialLocationRef.current = coords;

      // Abonnement aux mises à jour de la localisation
      locationSubscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Highest, timeInterval: 5000, distanceInterval: 3 },
        (newLocation) => {
          const { coords: newCoords } = newLocation;

          // Comparaison avec la position précédente pour éviter les mises à jour inutiles
          if (isMounted && calculateDistance(initialLocationRef.current, newCoords) > 1) {
            setLocation(newCoords);
          }

          if (initialLocationRef.current) {
            const distance = calculateDistance(initialLocationRef.current, newCoords);
            if (distance > TOLERANCE_RADIUS && mapRef.current && !isUserInteracting.current) {
              const newRegion = {
                latitude: newCoords.latitude,
                longitude: newCoords.longitude,
                latitudeDelta: mapRef.current.getCamera().latitudeDelta || 0.00922,
                longitudeDelta: mapRef.current.getCamera().longitudeDelta || 0.00421,
              };
              mapRef.current.animateToRegion(newRegion, 1000);
              initialLocationRef.current = newCoords;
            }
          }
        }
      );

      if (isMounted) setLoading(false);
    };

    const subscribeToPhotos = () => {
      const unsubscribe = onSnapshot(collection(db, 'decorations'), (snapshot) => {
        const photoList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        if (isMounted) setPhotos(photoList);
      }, (error) => {
        console.error('Erreur lors de la récupération des photos :', error);
        Alert.alert('Erreur', 'Impossible de récupérer les photos.');
        if (isMounted) setLoading(false);
      });

      return unsubscribe;
    };

    const unsubscribePhotos = subscribeToPhotos();
    initializeUserLocation();

    return () => {
      isMounted = false;
      if (locationSubscription) locationSubscription.remove();
      unsubscribePhotos();
    };
  }, []);

  // Fonction pour filtrer les photos par armoire
  const filteredPhotos = useMemo(() => {
    if (selectedArmoire === 'Toutes') return photos;
    return photos.filter(photo => (photo.armoire || 'Non spécifié') === selectedArmoire);
  }, [selectedArmoire, photos]);

  // Fonction pour ouvrir les détails d'une photo
  const handlePressDetails = useCallback((photo) => {
    setSelectedPhoto(null); // Réinitialiser la sélection
    sheetRef.current?.close(); // Fermer le BottomSheet

    setTimeout(() => {
      setSelectedPhoto(photo); // Définir la nouvelle sélection
      sheetRef.current?.snapToIndex(1); // Ouvrir le BottomSheet avec les nouvelles données
    }, 300); // Attendre un court instant pour éviter un bug de mise à jour
  }, []);

  // Fonction pour activer le mode déplaçable du marqueur
  const handlePressEditPosition = useCallback((photo) => {
    setDraggablePhotoId(photo.id);
    Alert.alert('Mode édition', 'Vous pouvez maintenant déplacer le marqueur sur la carte.');
  }, []);

  // Fonction pour centrer la carte sur la position de l'utilisateur
  const goToUserLocation = useCallback(async () => {
    try {
      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
      if (mapRef.current) {
        const camera = {
          center: {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          },
          zoom: 17,
          pitch: 0,
          altitude: 1000,
        };
        mapRef.current.animateCamera(camera, { duration: 3000 });
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de la position actuelle:', error);
      Alert.alert('Erreur', 'Impossible de récupérer la position actuelle.');
    }
  }, []);

  // Fonction pour changer le type de carte
  const toggleMapType = useCallback(() => {
    setMapType((prevType) => (prevType === 'standard' ? 'satellite' : 'standard'));
  }, []);

  // Fonction pour gérer l'affichage du modal de filtre
  const toggleFilterModal = () => {
    setModalVisible(!modalVisible);
  };

  // Fonction pour calculer la taille des marqueurs en fonction du niveau de zoom
  const markerSize = useMemo(() => {
    const defaultSize = 15;
    const zoomFactor = zoomLevel > 0.5 ? zoomLevel / 15 : 1;
    const size = defaultSize * 2.9 * zoomFactor;
    return size;
  }, [zoomLevel]);

  // Gestionnaire de changement de région pour mettre à jour le niveau de zoom
  const handleRegionChangeComplete = useCallback((newRegion) => {
    const zoom = Math.round(Math.log(360 / newRegion.latitudeDelta) / Math.LN2);
    setZoomLevel(zoom);
  }, []);

  // Gestionnaire de changement d'état du BottomSheet
  const handleBottomSheetChange = useCallback((index) => {
    setBottomSheetIndex(index);

    if (index >= 1) {
      Animated.timing(fadeFloatingButtonAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeFloatingButtonAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }

    if (index > 1) {
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
  }, [fadeFloatingButtonAnim, fadeAnim, translateYAnim]);

  // Gestion des interactions utilisateur avec la carte
  const handleUserInteractionStart = useCallback(() => {
    isUserInteracting.current = true;
  }, []);

  const handleUserInteractionEnd = useCallback(() => {
    setTimeout(() => {
      isUserInteracting.current = false;
    }, 1000);
  }, []);

  // Fonction pour gérer la fin du déplacement du marqueur
  const handleMarkerDragEnd = useCallback(async (photo, newCoordinate) => {
    // Mettre à jour les coordonnées du marqueur dans l'état local
    setPhotos((prevPhotos) =>
      prevPhotos.map((p) =>
        p.id === photo.id ? { ...p, latitude: newCoordinate.latitude, longitude: newCoordinate.longitude } : p
      )
    );

    // Mettre à jour les coordonnées dans la base de données Firebase
    try {
      const photoDocRef = doc(db, 'decorations', photo.id);
      await updateDoc(photoDocRef, {
        latitude: newCoordinate.latitude,
        longitude: newCoordinate.longitude,
      });
      Alert.alert('Succès', 'La position a été mise à jour avec succès.');
    } catch (error) {
      console.error('Erreur lors de la mise à jour des coordonnées de la photo:', error);
      Alert.alert('Erreur', "Impossible de mettre à jour les coordonnées de la photo.");
    }

    // Désactiver le mode déplaçable
    setDraggablePhotoId(null);
  }, []);

  // Affichage du loader pendant le chargement des données
  if (loading || !location) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Chargement de la carte...</Text>
      </View>
    );
  }

  // Définition de la région initiale basée sur la localisation de l'utilisateur
  const initialRegion = {
    latitude: location.latitude,
    longitude: location.longitude,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  };

  return (
    <View style={styles.container}>
      {/* Bouton Menu */}
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

      {/* Carte */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        mapType={mapType}
        pitchEnabled={true}
        zoomControlEnabled={true}
        showsCompass={true}
        onRegionChangeComplete={handleRegionChangeComplete}
        onPanDrag={handleUserInteractionStart}
        onTouchStart={handleUserInteractionStart}
        onTouchEnd={handleUserInteractionEnd}
        onMarkerPress={handleUserInteractionStart}
      >

        {/* Marqueur de l'utilisateur */}
        {location && (
          <Marker
            coordinate={{ latitude: location.latitude, longitude: location.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
            flat={true}
          >
            <SvgCircle size={25} innerColor="#1b484e" outerColor="lightgray" />
          </Marker>
        )}

        {/* Marqueurs des photos filtrées */}
        {filteredPhotos.map((photo) => (
          <PhotoMarker 
            key={photo.id} 
            photo={photo} 
            onPressDetails={handlePressDetails} 
            onPressEditPosition={handlePressEditPosition}
            markerSize={markerSize}
            onDragEnd={handleMarkerDragEnd}
            draggable={photo.id === draggablePhotoId}
          />
        ))}
      </MapView>

      {/* BottomSheet pour les détails de la photo */}
      <BottomSheet
        ref={sheetRef}
        snapPoints={snapPoints}
        index={0}
        onChange={handleBottomSheetChange}
        style={styles.bottomSheet}
      >
        {selectedPhoto ? (
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedPhoto.installationName}</Text>
            <PublicImage 
              storagePath={selectedPhoto.imageUri}
              style={styles.modalImage}
            />
            
            <View style={styles.modalFullContent}>
              {/* Adresse */}
              <View style={styles.row}>
                <Ionicons name="location-outline" size={22} color="#3498db" style={styles.icon} />
                <Text style={styles.modalLabel}>Adresse : </Text>
                <Text style={styles.modalMetadata}>
                  {selectedPhoto.numeroRue || 'Adresse non spécifiée'} {selectedPhoto.rue || 'Adresse non spécifiée'}, {selectedPhoto.ville || 'Adresse non spécifiée'}
                </Text>
              </View>
          
              {/* Date */}
              <View style={styles.row}>
                <Ionicons name="calendar-outline" size={22} color="#3498db" style={styles.icon} />
                <Text style={styles.modalLabel}>Date : </Text>
                <Text style={styles.modalMetadata}>
                  {selectedPhoto?.createdAt ? formatDate(parseDateTimeString(selectedPhoto.createdAt)) : 'Date non spécifiée'}
                </Text>
              </View>
          
              {/* Type */}
              <View style={styles.row}>
                <Ionicons name="build-outline" size={22} color="#3498db" style={styles.icon} />
                <Text style={styles.modalLabel}>Type : </Text>
                <Text style={styles.modalMetadata}>{selectedPhoto.installationType || 'Non spécifié'}</Text>
              </View>
          
              {/* Armoire */}
              <View style={styles.row}>
                <Ionicons name="timer-outline" size={22} color="#3498db" style={styles.icon} />
                <Text style={styles.modalLabel}>Armoire : </Text>
                <Text style={styles.modalMetadata}>{selectedPhoto.armoire || 'Non spécifié'}</Text>
              </View>
          
              {/* Commentaire */}
              <View style={styles.row}>
                <Ionicons name="chatbubble-ellipses-outline" size={22} color="#3498db" style={styles.icon} />
                <Text style={styles.modalLabel}>Info : </Text>
                <Text style={styles.modalMetadata}>{selectedPhoto.comment || 'Aucun commentaire'}</Text>
              </View>

              {/* Bouton pour naviguer vers DetailsScreen.js */}
              <TouchableOpacity 
                style={styles.detailsButton} 
                onPress={() => {
                  navigation.navigate('DetailsScreen', { photo: selectedPhoto });
                }}
              >
                <Ionicons name="information-circle-outline" size={24} color="#fff" style={styles.detailsIcon} />
                <Text style={styles.detailsButtonText}>Voir les détails</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          <Text style={styles.noPhotoText}>Aucune photo sélectionnée</Text>
        )}
      </BottomSheet>

      {/* Bouton flottant pour centrer la carte sur l'utilisateur */}
      <Animated.View
        style={[
          styles.floatingButton,
          {
            opacity: fadeFloatingButtonAnim,
          },
        ]}
      >
        <TouchableOpacity onPress={goToUserLocation}>
          <Ionicons name="navigate" size={30} color="#1b484e" />
        </TouchableOpacity>
      </Animated.View>

      {/* Bouton pour afficher/masquer le filtre */}
      <Animated.View
        style={[
          styles.filterToggleButton,
          {
            opacity: fadeAnim,
            transform: [{ translateY: translateYAnim }],
          },
        ]}
      >
        <TouchableOpacity onPress={toggleFilterModal}>
          <Ionicons name="filter" size={21} color="#1b484e" />
        </TouchableOpacity>
      </Animated.View>

      {/* Modal pour le filtre d'armoire */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContentFiltre}>
            <Text style={styles.modalTitleFiltre}>Filtrer par armoire</Text>
            <Picker
              selectedValue={selectedArmoire}
              onValueChange={(itemValue) => setSelectedArmoire(itemValue)}
            >
              <Picker.Item label="Toutes" value="Toutes" />
              {Array.from(new Set(photos.map(photo => photo.armoire || 'Non spécifié')))
                .map(armoire => (
                  <Picker.Item key={armoire} label={armoire} value={armoire} />
                ))}
            </Picker>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={toggleFilterModal}
            >
              <Text style={styles.applyButtonText}>Appliquer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
    </View>
  );
}

const styles = StyleSheet.create({
  // ... vos styles existants
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContentFiltre: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitleFiltre: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#34495e',
  },
  applyButton: {
    marginTop: 20,
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
    padding: 20,
    flexGrow: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    margin: 0,
    zIndex: 1,
  },
  modalImage: {
    width: '100%',
    height: 250,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#34495e',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalFullContent: {
    marginTop: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#f7f9fa',
  },
  icon: {
    marginRight: 10,
  },
  modalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34495e',
  },
  modalMetadata: {
    fontSize: 16,
    color: '#7f8c8d',
    flex: 1,
  },
  noPhotoText: {
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 16,
    color: '#7f8c8d',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 110,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 50,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
    zIndex: 10,
  },
  mapToggleButton: {
    position: 'absolute',
    top: 102,
    right: 7,
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
  filterToggleButton: {
    position: 'absolute',
    top: 150,
    right: 7,
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
    top: 55,
    left: 7,
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
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1b484e',
    padding: 10,
    borderRadius: 8,
    marginTop: 20,
    alignSelf: 'center',
  },
  detailsIcon: {
    marginRight: 8,
  },
  detailsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSheet: {
    zIndex: 1000,
    elevation: 20,
  },
  calloutContainer: {
    width: 250,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  calloutImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 8,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#34495e',
    marginBottom: 8,
    textAlign: 'center',
  },
  calloutButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  calloutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498db',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  calloutButtonText: {
    color: '#fff',
    marginLeft: 5,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
