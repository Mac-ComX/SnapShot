// screens/MapScreen.js
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
  ScrollView 
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useNavigation } from '@react-navigation/native';
import BottomSheet from '@gorhom/bottom-sheet';
import SvgCircle from '../components/svg/SvgCircle';
import PublicImage from '../components/PublicImage';

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
const PhotoMarker = React.memo(({ photo, onPress, markerSize }) => {
  const borderColor = useMemo(() => {
    if (photo.functionalityStatus === 'En panne') {
      return 'red';
    } else if (photo.functionalityStatus === 'Fonctionnelle') {
      return 'green';
    }
    return '#ffffff'; // Couleur par défaut
  }, [photo.functionalityStatus]);

  return (
    <Marker
      coordinate={{
        latitude: photo.latitude,
        longitude: photo.longitude,
      }}
      onPress={() => onPress(photo)}
    >
      <PublicImage 
        storagePath={photo.imageUri}  // URL ou chemin Firebase
        style={[
          styles.markerImage,
          {
            width: markerSize,
            height: markerSize,
            borderColor,
          },
        ]}  // Style de l'image
      />
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

  const sheetRef = useRef(null);
  const mapRef = useRef(null);
  const navigation = useNavigation();
  const TOLERANCE_RADIUS = 20;

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  const snapPoints = useMemo(() => [height * 0.1, height * 0.38, height * 0.85], [height]);

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
        { accuracy: Location.Accuracy.Highest, timeInterval: 5000, distanceInterval: 10 },
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

  // Fonction pour ouvrir les détails d'une photo
  const openPhotoDetails = useCallback((photo) => {
    setSelectedPhoto(null); // Réinitialiser la sélection
    sheetRef.current?.close(); // Fermer le modal

    setTimeout(() => {
      setSelectedPhoto(photo); // Définir la nouvelle sélection
      sheetRef.current?.snapToIndex(1); // Ouvrir le modal avec les nouvelles données
    }, 300); // Attendre un court instant pour éviter un bug de mise à jour
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

  // Fonction pour calculer la taille des marqueurs en fonction du niveau de zoom
  const markerSize = useMemo(() => {
    const defaultSize = 20;
    const zoomFactor = zoomLevel > 1 ? zoomLevel / 7 : 1;
    const size = defaultSize + 8 * zoomFactor;
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
      ]).start(() => console.log('Animations pour BottomSheet index 2 terminées.'));
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
      ]).start(() => console.log('Animations pour BottomSheet index différent de 2 terminées.'));
    }
  }, [fadeAnim, translateYAnim]);

  // Gestion des interactions utilisateur avec la carte
  const handleUserInteractionStart = useCallback(() => {
    isUserInteracting.current = true;
  }, []);

  const handleUserInteractionEnd = useCallback(() => {
    setTimeout(() => {
      isUserInteracting.current = false;
    }, 1000); // Temps d'attente avant de réactiver les animations automatiques
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
      <>
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

          {/* Marqueurs des photos */}
          {photos.map((photo) => (
            <PhotoMarker 
              key={photo.id} 
              photo={photo} 
              onPress={openPhotoDetails} 
              markerSize={markerSize} 
            />
          ))}
        </MapView>

        {/* BottomSheet pour les détails de la photo */}
        <BottomSheet
          ref={sheetRef}
          snapPoints={snapPoints}
          index={0}
          onChange={handleBottomSheetChange}
        >
          {selectedPhoto ? (
            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.modalTitle}>{selectedPhoto.installationName}</Text>
              <PublicImage 
                storagePath={selectedPhoto.imageUri}  // URL ou chemin Firebase
                style={styles.modalImage}  // Style de l'image
              />
              
              <View style={styles.modalFullContent}>
                {/* Adresse */}
                <View style={styles.row}>
                  <Ionicons name="location-outline" size={22} color="#3498db" style={styles.icon} />
                  <Text style={styles.modalLabel}>Adresse : </Text>
                  <Text style={styles.modalMetadata}>
                    {selectedPhoto.address || 'Adresse non spécifiée'}
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
            
                {/* Statut */}
                <View style={styles.row}>
                  <Ionicons name="checkbox-outline" size={22} color={selectedPhoto.installationStatus === 'Installée' ? '#27ae60' : '#e74c3c'} style={styles.icon} />
                  <Text style={styles.modalLabel}>Statut : </Text>
                  <Text style={[styles.modalMetadata, { color: selectedPhoto.installationStatus === 'Installée' ? '#27ae60' : '#e74c3c' }]}>
                    {selectedPhoto.installationStatus || 'Non spécifié'}
                  </Text>
                </View>
            
                {/* État */}
                <View style={styles.row}>
                  <Ionicons name="alert-circle-outline" size={22} color="#3498db" style={styles.icon} />
                  <Text style={styles.modalLabel}>État : </Text>
                  <Text style={styles.modalMetadata}>{selectedPhoto.functionalityStatus || 'Non spécifié'}</Text>
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
                  <Text style={styles.modalLabel}>Commentaire : </Text>
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

        {/* Bouton flottant pour centrer la carte sur l'utilisateur */}
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
            <Ionicons name="location-sharp" size={28} color="#1b484e" />
          </TouchableOpacity>
        </Animated.View>
      </>
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
    padding: 20,
    flexGrow: 1,
    backgroundColor: '#ffffff',  // Couleur de fond blanc moderne
    borderRadius: 20,  // Coins arrondis pour un effet plus moderne
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 0,
    elevation: 5,  // Effet d'ombre pour donner de la profondeur
    margin: 0,  // Espacement autour du modal
  },
  modalImage: {
    width: '100%',
    height: 250,
    borderRadius: 15,  // Arrondi des bords de l'image
    marginBottom: 15,  // Espacement sous l'image
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,  // Effet d'ombre léger pour l'image
  },
  modalTitle: {
    fontSize: 24,  // Augmentation de la taille du texte pour le titre
    fontWeight: 'bold',
    color: '#34495e',  // Couleur sombre pour une bonne lisibilité
    marginBottom: 20,  // Espace sous le titre
    textAlign: 'center',  // Centrage du titre
  },
  modalFullContent: {
    marginTop: 15,  // Espacement supérieur pour le contenu sous l'image
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,  // Espacement entre chaque ligne d'information
    padding: 10,  // Espacement interne pour une meilleure disposition
    borderRadius: 10,  // Arrondi des bords pour chaque ligne
    backgroundColor: '#f7f9fa',  // Couleur de fond douce pour chaque ligne
  },
  icon: {
    marginRight: 10,  // Espace entre l'icône et le texte
  },
  modalLabel: {
    fontSize: 18,  // Augmentation de la taille de la police pour les labels
    fontWeight: 'bold',
    color: '#34495e',  // Couleur plus sombre pour les labels
  },
  modalMetadata: {
    fontSize: 16,  // Taille de police standard pour les métadonnées
    color: '#7f8c8d',  // Couleur gris doux pour les métadonnées
    flex: 1,  // Prend le reste de l'espace dans la ligne
  },
  noPhotoText: {
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 16,
    color: '#7f8c8d',  // Texte gris pour le message de non-sélection de photo
  },
  floatingButton: {
    position: 'absolute',
    top: 145,
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
  mapToggleButton: {
    position: 'absolute',
    top: 100,
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
    backgroundColor: '#1b484e',  // Couleur du bouton
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
});
