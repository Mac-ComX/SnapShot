import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import MapView, { Callout, CalloutSubview, Marker } from 'react-native-maps'; // Import CalloutSubview
import Svg, { Circle, G } from 'react-native-svg';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import PublicImage from '../components/PublicImage';
import SvgCircle from '../components/svg/SvgCircle';
import { db } from '../services/firebase';
import MapStyle from '../Styles/MapStyle';

// Importez votre image de logo ici
import LogoImage from '../assets/logoUser.jpg'; // Assurez-vous que le chemin est correct

// Importez la fonction pour générer des couleurs aléatoires
import { getRandomColor } from '../utils/colorUtils'; // Assurez-vous que ce fichier existe

const { height, width } = Dimensions.get('window');
const screenWidth = Dimensions.get('window').width;
const radius = 90;
const strokeWidth = 40;
const center = radius + strokeWidth / 2;

// Clé pour AsyncStorage
const SHORTCUTS_KEY = 'USER_SHORTCUTS';

// Fonction pour calculer la distance entre deux coordonnées GPS
const calculateDistance = (coord1, coord2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371e3; // Rayon de la Terre en mètres
  const lat1 = toRad(coord1.latitude);
  const lat2 = toRad(coord2.latitude);
  const deltaLat = toRad(coord2.latitude - coord1.latitude);
  const deltaLon = toRad(coord2.longitude - coord1.longitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
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
const PhotoMarker = React.memo(({ photo, onPressDetails, onPressEditPosition, markerSize, onDragEnd, draggable, isHighlighted }) => {
  const borderColor = useMemo(() => {
    if (photo.installationType === 'Armoire') {
      return '#FF5E00'; // Couleur orange pour les armoires
    } else if (photo.functionalityStatus === 'En panne') {
      return 'red';
    } else if (photo.functionalityStatus === 'Fonctionnelle') {
      return 'green';
    }
    return '#ffffff'; // Couleur par défaut
  }, [photo.functionalityStatus, photo.installationType]);

  // Animation pour le marqueur mis en évidence
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isHighlighted) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.5,
          duration: 500,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isHighlighted, scaleAnim]);

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
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <PublicImage
          storagePath={photo.imageUri}
          style={[
            MapStyle.markerImage,
            {
              width: markerSize,
              height: markerSize,
              borderColor,
            },
          ]}
        />
      </Animated.View>
      <Callout tooltip={false}>
        <View style={MapStyle.calloutContainer}>
          {/* Image de l'installation */}
          <PublicImage
            storagePath={photo.imageUri}
            style={MapStyle.calloutImage}
          />
          <Text style={MapStyle.calloutTitle}>{photo.rue || photo.installationName}</Text>
          <View style={MapStyle.calloutButtonsContainer}>
            <View style={MapStyle.calloutButtonsRow}>
              <CalloutSubview onPress={() => onPressDetails(photo)}>
                <TouchableOpacity style={MapStyle.calloutButton}>
                  <Ionicons name="information-circle-outline" size={20} color="#fff" />
                  <Text style={MapStyle.calloutButtonText}>Détails</Text>
                </TouchableOpacity>
              </CalloutSubview>
              <CalloutSubview onPress={handleNavigateToMarker}>
                <TouchableOpacity style={MapStyle.calloutButton}>
                  <Ionicons name="navigate-outline" size={20} color="#fff" />
                  <Text style={MapStyle.calloutButtonText}>GPS</Text>
                </TouchableOpacity>
              </CalloutSubview>
            </View>
            <CalloutSubview onPress={() => onPressEditPosition(photo)}>
              <TouchableOpacity style={MapStyle.calloutButtonFullWidth}>
                <Ionicons name="map-outline" size={20} color="#fff" />
                <Text style={MapStyle.calloutButtonText}>Modifier la position</Text>
              </TouchableOpacity>
            </CalloutSubview>
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
  const [highlightedMarkerId, setHighlightedMarkerId] = useState(null); // État pour le marqueur à mettre en évidence

  // Nouvel état pour stocker le nombre total de photos filtrées
  const [totalFilteredPhotos, setTotalFilteredPhotos] = useState(0);

  // Nouvel État pour la Barre de Recherche
  const [searchQuery, setSearchQuery] = useState('');

  // Nouvel État pour les statistiques du graphique
  const [photosByType, setPhotosByType] = useState({});

  // Nouvel État pour les raccourcis personnalisés
  const [customShortcutModalVisible, setCustomShortcutModalVisible] = useState(false);
  const [selectedCustomShortcut, setSelectedCustomShortcut] = useState(null);

  const sheetRef = useRef(null);
  const mapRef = useRef(null);
  const navigation = useNavigation();
  const route = useRoute(); // Accéder aux paramètres de navigation
  const TOLERANCE_RADIUS = 20;

  // Animations pour les autres boutons
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  // Animation pour le bouton flottant
  const fadeFloatingButtonAnim = useRef(new Animated.Value(1)).current;

  const snapPoints = useMemo(() => [height * 0.12, height * 0.45, height * 0.90], [height]);

  const hasSetInitialRegionRef = useRef(false);
  const initialLocationRef = useRef(null);
  const isUserInteracting = useRef(false);

  // Liste des raccourcis disponibles avec icône et type d'icône
  const availableShortcuts = useMemo(() => [
    { label: 'Notes', screen: 'NotesListScreen', icon: 'note-alt', iconType: 'MaterialIcons' },
    { label: 'Armoires', screen: 'ArmoireScreen', icon: 'door-sliding', iconType: 'MaterialIcons' },
    { label: 'Journal', screen: 'JournalScreen', icon: 'newspaper', iconType: 'MaterialIcons' },
    { label: 'Pannes', screen: 'MaintenanceScreen', icon: 'build', iconType: 'MaterialIcons' },
    { label: 'Photo', screen: 'CameraScreen', icon: 'add-a-photo', iconType: 'MaterialIcons' },
    { label: 'Dashbord', screen: 'DashboardScreen', icon: 'assessment', iconType: 'MaterialIcons' },
  ], []);

  // État pour les raccourcis dynamiques
  const [shortcuts, setShortcuts] = useState([]); // Initialisation vide, chargement depuis AsyncStorage

  // Fonction pour charger les raccourcis depuis AsyncStorage
  const loadShortcuts = async () => {
    try {
      const storedShortcuts = await AsyncStorage.getItem(SHORTCUTS_KEY);
      if (storedShortcuts !== null) {
        setShortcuts(JSON.parse(storedShortcuts));
      } else {
        // Si aucun raccourci n'est stocké, initialiser avec "Mes Notes"
        const defaultShortcut = availableShortcuts.find(s => s.screen === 'NotesListScreen');
        if (defaultShortcut) {
          setShortcuts([{
            label: defaultShortcut.label,
            sublabel: '', // Pas de sous-label pour le raccourci par défaut
            screen: defaultShortcut.screen,
            icon: defaultShortcut.icon,
            iconType: defaultShortcut.iconType,
            color: '#00BCD4', // Couleur par défaut
          }]);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des raccourcis:', error);
    }
  };

  // Fonction pour sauvegarder les raccourcis dans AsyncStorage
  const saveShortcuts = async (shortcutsToSave) => {
    try {
      await AsyncStorage.setItem(SHORTCUTS_KEY, JSON.stringify(shortcutsToSave));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des raccourcis:', error);
    }
  };

  // Fonction pour ajouter un nouveau raccourci
  const addShortcut = (shortcut) => {
    // Vérifier si le raccourci est déjà présent
    const isAlreadyAdded = shortcuts.some(s => s.screen === shortcut.screen);
    if (isAlreadyAdded) {
      Alert.alert('Erreur', 'Ce raccourci est déjà ajouté.');
      return;
    }

    // Vérifier la limite de raccourcis
    if (shortcuts.length >= 4) {
      Alert.alert('Limite Atteinte', 'Vous ne pouvez pas ajouter plus de 4 raccourcis.');
      return;
    }

    // Assigner une couleur aléatoire
    const color = getRandomColor();

    // Ajouter le nouveau raccourci
    const newShortcut = {
      label: shortcut.label,
      sublabel: '', // Vous pouvez personnaliser cela si nécessaire
      screen: shortcut.screen,
      icon: shortcut.icon,
      iconType: shortcut.iconType,
      color,
    };

    const updatedShortcuts = [...shortcuts, newShortcut];
    setShortcuts(updatedShortcuts);
    saveShortcuts(updatedShortcuts);
  };

  // Fonction pour supprimer un raccourci
  const removeShortcut = (screen) => {
    const updatedShortcuts = shortcuts.filter(s => s.screen !== screen);
    setShortcuts(updatedShortcuts);
    saveShortcuts(updatedShortcuts);
  };

  // Initialisation de la localisation et abonnement aux photos
  useEffect(() => {
    let isMounted = true;
    let locationSubscription;

    const initializeUserLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (isMounted) setLoading(false);
        Alert.alert('Permission refusée', 'Permission de localisation nécessaire pour utiliser la carte.');
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
        mapRef.current.animateCamera({ center: initialRegion }, { duration: 1000, easing: Easing.ease });
        hasSetInitialRegionRef.current = true;
      }

      initialLocationRef.current = coords;

      // Abonnement aux mises à jour de la localisation
      locationSubscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Highest, timeInterval: 5000, distanceInterval: 5 },
        (newLocation) => {
          const { coords: newCoords } = newLocation;

          // Comparaison avec la position précédente pour éviter les mises à jour inutiles
          if (isMounted && calculateDistance(initialLocationRef.current, newCoords) > 1) {
            setLocation(newCoords);
          }

          if (initialLocationRef.current) {
            const distance = calculateDistance(initialLocationRef.current, newCoords);

            // Vérifiez la distance et si l'utilisateur n'interagit pas avec la carte
            if (distance > TOLERANCE_RADIUS && mapRef.current && !isUserInteracting.current) {
              // Récupérer les paramètres actuels de la caméra, y compris l'orientation (heading)
              mapRef.current.getCamera().then((currentCamera) => {
                const newRegion = {
                  latitude: newCoords.latitude,
                  longitude: newCoords.longitude,
                  latitudeDelta: currentCamera.latitudeDelta || 0.00922,
                  longitudeDelta: currentCamera.longitudeDelta || 0.00421,
                  heading: currentCamera.heading, // Maintenir l'orientation actuelle
                };

                // Recentre la carte avec une animation douce sans changer l'orientation
                mapRef.current.animateCamera({ center: newRegion, heading: currentCamera.heading }, { duration: 1000, easing: Easing.ease });
                initialLocationRef.current = newCoords;
              }).catch(error => {
                console.error('Erreur lors de la récupération de la caméra:', error);
              });
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
    loadShortcuts(); // Charger les raccourcis depuis AsyncStorage

    return () => {
      isMounted = false;
      if (locationSubscription) locationSubscription.remove();
      unsubscribePhotos();
    };
  }, []);

  // Gestion des paramètres de navigation pour centrer sur un marqueur spécifique
  useEffect(() => {
    const { targetLatitude, targetLongitude, targetPhotoId } = route.params || {};

    if (targetLatitude && targetLongitude && targetPhotoId) {
      // Centrer et zoomer sur le marqueur spécifique avec animation fluide
      if (mapRef.current) {
        const specificCamera = {
          center: {
            latitude: targetLatitude,
            longitude: targetLongitude,
          },
          pitch: 0,
          heading: 0,
          altitude: 1000,
          zoom: 17,
        };
        mapRef.current.animateCamera(specificCamera, { duration: 2000, easing: Easing.ease });
      }

      // Mettre en évidence le marqueur spécifique
      setHighlightedMarkerId(targetPhotoId);
    }
  }, [route.params]);

  // Fonction pour filtrer les photos par armoire et recherche
  const filteredPhotos = useMemo(() => {
    let result = photos;
    if (selectedArmoire !== 'Toutes') {
      result = result.filter(photo => (photo.armoire || 'Non spécifié') === selectedArmoire);
    }
    if (searchQuery.trim() !== '') {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(photo =>
        (photo.installationName && photo.installationName.toLowerCase().includes(query)) ||
        (photo.armoire && photo.armoire.toLowerCase().includes(query))
      );
    }
    return result;
  }, [selectedArmoire, photos, searchQuery]);

  // Fonction pour ouvrir les détails d'une photo
  const handlePressDetails = useCallback((photo) => {
    setSelectedPhoto(null); // Réinitialiser la sélection
    sheetRef.current?.close(); // Fermer le BottomSheet

    setTimeout(() => {
      setSelectedPhoto(photo); // Définir la nouvelle sélection
      sheetRef.current?.snapToIndex(2); // Ouvrir le BottomSheet au niveau maximal pour les détails
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
          pitch: 0,
          heading: 0,
          altitude: 1000,
          zoom: 17,
        };
        mapRef.current.animateCamera(camera, { duration: 3000, easing: Easing.ease });
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de la position actuelle:', error);
      Alert.alert('Erreur', 'Impossible de récupérer la position actuelle.');
    }
  }, []);

  // Fonction pour centrer la carte sur l'armoire sélectionnée
  const goToArmoireLocation = useCallback(() => {
    if (selectedArmoire !== 'Toutes') {
      const armoirePhoto = photos.find(photo => (photo.armoire || 'Non spécifié') === selectedArmoire);
      if (armoirePhoto && mapRef.current) {
        const camera = {
          center: {
            latitude: armoirePhoto.latitude,
            longitude: armoirePhoto.longitude,
          },
          pitch: 0,
          heading: 0,
          altitude: 1000,
          zoom: 17,
        };
        mapRef.current.animateCamera(camera, { duration: 2000, easing: Easing.ease });
      } else {
        Alert.alert('Erreur', 'Aucune armoire trouvée avec ce nom.');
      }
    }
  }, [selectedArmoire, photos]);

  // Fonction pour changer le type de carte
  const toggleMapType = useCallback(() => {
    setMapType((prevType) => (prevType === 'standard' ? 'satellite' : 'standard'));
  }, []);

  // Fonction pour gérer l'affichage du modal
  const toggleFilterModal = () => {
    setModalVisible(!modalVisible);
  };

  // Fonction pour appliquer le filtre et centrer sur l'armoire
  const applyFilter = () => {
    toggleFilterModal();
    goToArmoireLocation();
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
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: -30,
          duration: 300,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ]).start();
    }

    // Fermer le clavier si le BottomSheet est réduit
    if (index < snapPoints.length - 1) {
      Keyboard.dismiss();
    }
  }, [fadeFloatingButtonAnim, fadeAnim, translateYAnim, snapPoints.length]);

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

  // Fonction pour gérer le clic sur la carte (hors des marqueurs)
  const handleMapPress = useCallback(() => {
    if (selectedPhoto) {
      setSelectedPhoto(null); // Réinitialiser la sélection
      sheetRef.current?.snapToIndex(0); // Ouvrir le BottomSheet au niveau de la barre de recherche
    }
  }, [selectedPhoto]);

  // Fonction pour gérer le focus sur le champ de recherche
  const handleSearchFocus = () => {
    sheetRef.current?.snapToIndex(2); // Ouvrir le BottomSheet au niveau maximal
  };

  // Fonction pour gérer la perte de focus sur le champ de recherche
  const handleSearchBlur = () => {
    if (searchQuery.trim() === '') {
      sheetRef.current?.snapToIndex(0); // Réduire le BottomSheet si la recherche est vide
    }
  };

  // Effet pour fermer le clavier lorsque le BottomSheet est réduit
  useEffect(() => {
    if (bottomSheetIndex === 0) {
      Keyboard.dismiss();
    }
  }, [bottomSheetIndex]);

  // Fonction pour obtenir les 6 dernières photos
  const getLastFourPhotos = (photos) => {
    return photos
      .filter(photo => photo.createdAt) // Assurer que la photo a une date
      .sort((a, b) => parseDateTimeString(b.createdAt) - parseDateTimeString(a.createdAt)) // Trier par date décroissante
      .slice(0, 6); // Ne garder que les 6 dernières
  };
  const defaultPhotos = getLastFourPhotos(photos);

  // Filtrer les photos (exclusion des armoires et des "Non installée") et préparer les données du graphique
  useEffect(() => {
    const calculateStats = () => {
      // Calcul des types de photos, en excluant les armoires et les installations non installées
      const typeCounts = photos.reduce((acc, photo) => {
        const type = photo.installationType || 'Type inconnu';
        if (type !== 'Armoire' && photo.installationStatus !== 'Non installée') { // Exclure les armoires et non installées
          acc[type] = (acc[type] || 0) + 1;
        }
        return acc;
      }, {});

      // Calculer le nombre total de photos après avoir exclu les armoires et "Non installée"
      const totalFilteredPhotos = photos.reduce((count, photo) => {
        if (photo.installationType !== 'Armoire' && photo.installationStatus !== 'Non installée') {
          return count + 1;
        }
        return count;
      }, 0);

      // Mettre à jour l'état avec les données calculées
      setPhotosByType(typeCounts);
      setTotalFilteredPhotos(totalFilteredPhotos); // Stocker totalFilteredPhotos dans l'état
    };

    calculateStats();
  }, [photos]);

  // Préparation des données pour le graphique
  const pieChartData = useMemo(() => {
    return Object.keys(photosByType).map((type, index) => ({
      name: type,
      percentage: photosByType[type],
      color: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'][index % 5],
    }));
  }, [photosByType]);

  const totalPercentage = pieChartData.reduce((acc, item) => acc + item.percentage, 0);
  let startAngle = 0;

  // Affichage du loader pendant le chargement des données
  if (loading || !location) {
    return (
      <View style={MapStyle.loadingContainer}>
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

  // Récupérer la rue et la ville de la première photo par défaut
  const firstDefaultPhoto = defaultPhotos[0];
  const street = firstDefaultPhoto ? firstDefaultPhoto.rue || 'Rue non spécifiée' : 'Rue non spécifiée';
  const city = firstDefaultPhoto ? firstDefaultPhoto.ville || 'Ville non spécifiée' : 'Ville non spécifiée';

  return (
    <View style={MapStyle.container}>
      {/* Bouton Menu */}
      <Animated.View
        style={[
          MapStyle.menuButton,
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
        style={MapStyle.map}
        initialRegion={initialRegion}
        mapType={mapType}
        pitchEnabled={true}
        zoomControlEnabled={true}
        showsCompass={true}
        onRegionChangeComplete={handleRegionChangeComplete}
        onPanDrag={handleUserInteractionStart} // Début de l'interaction
        onTouchStart={handleUserInteractionStart} // Début de l'interaction
        onTouchEnd={handleUserInteractionEnd} // Fin de l'interaction
        onMarkerPress={handleUserInteractionStart} // Début de l'interaction sur un marqueur
        onPress={handleMapPress} // Gestion du clic sur la carte
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
            isHighlighted={photo.id === highlightedMarkerId} // Passer la prop isHighlighted
          />
        ))}

        {/* Marqueur spécifique à partir des paramètres de navigation */}
        {highlightedMarkerId && (() => {
          const specificPhoto = photos.find(photo => photo.id === highlightedMarkerId);
          if (specificPhoto) {
            return (
              <Marker
                coordinate={{ latitude: specificPhoto.latitude, longitude: specificPhoto.longitude }}
                pinColor="blue" // Mettre en évidence le marqueur avec une couleur différente
              >
                <Callout tooltip={false}>
                  <View style={MapStyle.calloutContainer}>
                    <PublicImage
                      storagePath={specificPhoto.imageUri}
                      style={MapStyle.calloutImage}
                    />
                    <Text style={MapStyle.calloutTitle}>{specificPhoto.rue || specificPhoto.installationName}</Text>
                    <View style={MapStyle.calloutButtonsContainer}>
                      <View style={MapStyle.calloutButtonsRow}>
                        <CalloutSubview onPress={() => handlePressDetails(specificPhoto)}>
                          <TouchableOpacity style={MapStyle.calloutButton}>
                            <Ionicons name="information-circle-outline" size={20} color="#fff" />
                            <Text style={MapStyle.calloutButtonText}>Détails</Text>
                          </TouchableOpacity>
                        </CalloutSubview>
                        <CalloutSubview onPress={() => {
                          // Naviguer vers DetailsScreen pour ce marqueur
                          navigation.navigate('DetailsScreen', { photo: specificPhoto });
                        }}>
                          <TouchableOpacity style={MapStyle.calloutButton}>
                            <Ionicons name="navigate-outline" size={20} color="#fff" />
                            <Text style={MapStyle.calloutButtonText}>GPS</Text>
                          </TouchableOpacity>
                        </CalloutSubview>
                      </View>
                      <CalloutSubview onPress={() => handlePressEditPosition(specificPhoto)}>
                        <TouchableOpacity style={MapStyle.calloutButtonFullWidth}>
                          <Ionicons name="map-outline" size={20} color="#fff" />
                          <Text style={MapStyle.calloutButtonText}>Modifier la position</Text>
                        </TouchableOpacity>
                      </CalloutSubview>
                    </View>
                  </View>
                </Callout>
              </Marker>
            );
          }
          return null;
        })()}
      </MapView>

      {/* BottomSheet pour la barre de recherche ou les détails de la photo */}
      <BottomSheet
        ref={sheetRef}
        snapPoints={snapPoints}
        index={0}
        onChange={handleBottomSheetChange}
        backgroundStyle={MapStyle.bottomSheet}
        handleStyle={MapStyle.handle}
        handleIndicatorStyle={MapStyle.handleIndicator}
      >
        <BlurView intensity={30} tint="light" style={MapStyle.blurContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <BottomSheetScrollView contentContainerStyle={MapStyle.searchContainer}>
                {/* Champ de recherche toujours rendu */}
                <View style={MapStyle.searchInputWrapper}>
                  <View style={MapStyle.searchInputContainer}>
                    <Ionicons name="search" size={20} color="#7f8c8d" style={MapStyle.searchIcon} />
                    <TextInput
                      style={MapStyle.searchInput}
                      placeholder="Rechercher une armoire ou une installation..."
                      placeholderTextColor="#7f8c8d"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      clearButtonMode="while-editing"
                      onFocus={handleSearchFocus}
                      onBlur={handleSearchBlur}
                    />
                  </View>
                  <View style={MapStyle.logoContainer}>
                    <Image source={LogoImage} style={MapStyle.logoImage} />
                  </View>
                </View>

                {/* Contenu conditionnel */}
                {selectedPhoto ? (
                  // Affichage des détails de l'installation lorsqu'un marqueur est sélectionné
                  <View style={MapStyle.modalContent}>
                    <Text style={MapStyle.modalTitle}>{selectedPhoto.installationName}</Text>
                    <PublicImage
                      storagePath={selectedPhoto.imageUri}
                      style={MapStyle.modalImage}
                    />

                    <View style={MapStyle.modalFullContent}>
                      {/* Adresse */}
                      <View style={MapStyle.row}>
                        <Ionicons name="location-outline" size={22} color="#3498db" style={MapStyle.icon} />
                        <Text style={MapStyle.modalLabel}>Adresse : </Text>
                        <Text style={MapStyle.modalMetadata}>
                          {selectedPhoto.numeroRue || 'Adresse non spécifiée'} {selectedPhoto.rue || 'Adresse non spécifiée'}, {selectedPhoto.ville || 'Ville non spécifiée'}
                        </Text>
                      </View>

                      {/* Date */}
                      <View style={MapStyle.row}>
                        <Ionicons name="calendar-outline" size={22} color="#3498db" style={MapStyle.icon} />
                        <Text style={MapStyle.modalLabel}>Date : </Text>
                        <Text style={MapStyle.modalMetadata}>
                          {selectedPhoto?.createdAt ? formatDate(parseDateTimeString(selectedPhoto.createdAt)) : 'Date non spécifiée'}
                        </Text>
                      </View>

                      {/* Type */}
                      <View style={MapStyle.row}>
                        <Ionicons name="build-outline" size={22} color="#3498db" style={MapStyle.icon} />
                        <Text style={MapStyle.modalLabel}>Type : </Text>
                        <Text style={MapStyle.modalMetadata}>{selectedPhoto.installationType || 'Non spécifié'}</Text>
                      </View>

                      {/* Armoire */}
                      <View style={MapStyle.row}>
                        <Ionicons name="browsers-outline" size={22} color="#3498db" style={MapStyle.icon} />
                        <Text style={MapStyle.modalLabel}>Armoire : </Text>
                        <Text style={MapStyle.modalMetadata}>{selectedPhoto.armoire || 'Non spécifié'}</Text>
                      </View>

                      {/* Commentaire */}
                      <View style={MapStyle.row}>
                        <Ionicons name="chatbox-ellipses-outline" size={22} color="#3498db" style={MapStyle.icon} />
                        <Text style={MapStyle.modalLabel}>Info : </Text>
                        <Text style={MapStyle.modalMetadata}>{selectedPhoto.comment || 'Aucun commentaire'}</Text>
                      </View>

                      {/* Bouton pour naviguer vers DetailsScreen.js */}
                      <TouchableOpacity
                        style={MapStyle.detailsButton}
                        onPress={() => {
                          navigation.navigate('DetailsScreen', { photo: selectedPhoto });
                        }}
                      >
                        <Ionicons name="information-circle-outline" size={24} color="#fff" style={MapStyle.detailsIcon} />
                        <Text style={MapStyle.detailsButtonText}>Voir les détails</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : searchQuery.trim() !== '' ? (
                  filteredPhotos.length > 0 ? (
                    // Affichage des résultats de recherche
                    filteredPhotos.map((item) => (
                      <TouchableOpacity key={item.id} style={MapStyle.searchResultItem} onPress={() => handlePressDetails(item)}>
                        <PublicImage
                          storagePath={item.imageUri}
                          style={MapStyle.searchResultImage}
                        />
                        <View style={MapStyle.searchResultTextContainer}>
                          <Text style={MapStyle.searchResultTitle}>{item.installationName || 'Nom non spécifié'}</Text>
                          <Text style={MapStyle.searchResultSubtitle}>
                            {item.numeroRue || 'Adresse non spécifiée'} {item.rue || 'Adresse non spécifiée'}, {item.ville || 'Ville non spécifiée'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={MapStyle.noResultsText}>Aucun résultat trouvé.</Text>
                  )
                ) : (
                  // Affichage du contenu par défaut
                  <>
                    {/* Titre "Récents" */}
                    <View style={MapStyle.recentSection}>
                      <Text style={MapStyle.sectionTitre}>Récents</Text>
                    </View>
                    {/* Slide horizontal des images */}
                    <View style={MapStyle.card}>
                      <Text style={MapStyle.cardTitle}>Dernière Installation</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {defaultPhotos.map((item) => (
                          <TouchableOpacity key={item.id} onPress={() => handlePressDetails(item)}>
                            <PublicImage
                              storagePath={item.imageUri}
                              style={MapStyle.cardImage}
                            />
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      <View style={MapStyle.separator} />

                      <Text style={MapStyle.cardSousTitle}>Secteur</Text>
                      <Text style={MapStyle.cardStreet}>{`${street}, ${city}`}</Text>
                    </View>

                    <View style={MapStyle.recentSection}>
                      <Text style={MapStyle.sectionTitre}>Raccourcis</Text>
                    </View>

                    {/* Conteneur des raccourcis */}
                    <View style={MapStyle.shortcutContainer}>
                      {shortcuts.map((shortcut, index) => (
                        <TouchableOpacity
                          key={index}
                          style={MapStyle.shortcut}
                          onPress={() => navigation.navigate(shortcut.screen)}
                          onLongPress={() => {
                            Alert.alert(
                              'Supprimer le raccourci',
                              `Êtes-vous sûr de vouloir supprimer le raccourci "${shortcut.label}" ?`,
                              [
                                { text: 'Annuler', style: 'cancel' },
                                { text: 'Supprimer', style: 'destructive', onPress: () => removeShortcut(shortcut.screen) },
                              ]
                            );
                          }}
                        >
                          <View style={[MapStyle.iconWrapper, { backgroundColor: shortcut.color }]}>
                            {shortcut.iconType === 'Ionicons' ? (
                              <Ionicons name={shortcut.icon} size={30} color="#fff" />
                            ) : (
                              <MaterialIcons name={shortcut.icon} size={30} color="#fff" />
                            )}
                          </View>
                          <Text style={MapStyle.label}>{shortcut.label}</Text>
                          {shortcut.sublabel && <Text style={MapStyle.sublabel}>{shortcut.sublabel}</Text>}
                        </TouchableOpacity>
                      ))}

                      {/* Bouton Ajouter */}
                      {shortcuts.length < 4 && (
                        <TouchableOpacity
                          style={MapStyle.shortcut}
                          onPress={() => setCustomShortcutModalVisible(true)}
                        >
                          <View style={[MapStyle.iconWrapper, { backgroundColor: '#2196F3' }]}>
                            <Ionicons name="add-outline" size={30} color="#fff" />
                          </View>
                          <Text style={MapStyle.label}>Ajouter</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Titre "Indicateur" */}
                    <View style={MapStyle.recentSection}>
                      <Text style={MapStyle.sectionTitre}>Indicateur</Text>
                    </View>
                    {/* Répartition des Types d'Installations */}
                    <View style={MapStyle.cardLarge}>
                      <Text style={MapStyle.chartTitle}>Répartition Types de décorations</Text>
                      <View style={MapStyle.pieChartContainer}>
                        <Svg width={screenWidth - 60} height={220}>
                          <G rotation="-90" origin={`${center}, ${center}`}>
                            {pieChartData.map((item, index) => {
                              const percentage = item.percentage / totalPercentage;
                              const strokeDasharray = `${2 * Math.PI * radius * percentage} ${2 * Math.PI * radius}`;
                              const strokeDashoffset = 2 * Math.PI * radius * startAngle;
                              startAngle += percentage;

                              return (
                                <Circle
                                  key={index}
                                  cx={center}
                                  cy={center}
                                  r={radius}
                                  stroke={item.color}
                                  strokeWidth={strokeWidth}
                                  strokeDasharray={strokeDasharray}
                                  strokeDashoffset={-strokeDashoffset}
                                  fill="transparent"
                                />
                              );
                            })}
                          </G>
                        </Svg>
                        <View style={MapStyle.centerTextContainer}>
                          <Text style={MapStyle.centerText}>{totalFilteredPhotos}</Text>
                          <Text style={MapStyle.centerLabel}>Décors</Text>
                        </View>
                      </View>
                      <View style={MapStyle.legendContainer}>
                        {pieChartData.map((item, index) => (
                          <View key={index} style={MapStyle.legendItem}>
                            <View style={[MapStyle.legendColor, { backgroundColor: item.color }]} />
                            <Text style={MapStyle.legendLabel}>
                              {item.name}: {item.percentage}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </>
                )}
              </BottomSheetScrollView>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </BlurView>
      </BottomSheet>

      {/* Modal pour le raccourci personnalisé */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={customShortcutModalVisible}
        onRequestClose={() => setCustomShortcutModalVisible(false)}
      >
        <View style={MapStyle.modalContainer}>
          <View style={MapStyle.modalContentFiltre}>
            <Text style={MapStyle.modalTitleFiltre}>Choisir un raccourci</Text>
            <Picker
              selectedValue={selectedCustomShortcut}
              onValueChange={(itemValue) => setSelectedCustomShortcut(itemValue)}
            >
              <Picker.Item label="Sélectionner..." value={null} />
              {availableShortcuts.map((shortcut) => {
                // Vérifier si le raccourci est déjà ajouté
                const isAdded = shortcuts.some(s => s.screen === shortcut.screen);
                if (isAdded) return null; // Ne pas afficher les raccourcis déjà ajoutés
                return (
                  <Picker.Item key={shortcut.screen} label={shortcut.label} value={shortcut.screen} />
                );
              })}
            </Picker>
            <TouchableOpacity
              style={MapStyle.applyButton}
              onPress={() => {
                if (selectedCustomShortcut) {
                  const shortcutToAdd = availableShortcuts.find(s => s.screen === selectedCustomShortcut);
                  if (shortcutToAdd) {
                    addShortcut(shortcutToAdd);
                    setCustomShortcutModalVisible(false);
                    setSelectedCustomShortcut(null);
                  }
                } else {
                  Alert.alert('Erreur', 'Veuillez sélectionner un raccourci.');
                }
              }}
            >
              <Text style={MapStyle.applyButtonText}>Valider</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bouton flottant pour centrer la carte sur l'utilisateur */}
      <Animated.View
        style={[
          MapStyle.floatingButton,
          {
            opacity: fadeFloatingButtonAnim,
          },
        ]}
      >
        <TouchableOpacity onPress={goToUserLocation}>
          <Ionicons name="navigate" size={26} color="#3498db" style={{ marginLeft: -4 }} />
        </TouchableOpacity>
      </Animated.View>

      {/* Bouton pour afficher/masquer le filtre */}
      <Animated.View
        style={[
          MapStyle.filterToggleButton,
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
        onRequestClose={toggleFilterModal}
      >
        <View style={MapStyle.modalContainer}>
          <View style={MapStyle.modalContentFiltre}>
            <Text style={MapStyle.modalTitleFiltre}>Filtrer par armoire</Text>
            <Picker
              selectedValue={selectedArmoire}
              onValueChange={(itemValue) => setSelectedArmoire(itemValue)}
            >
              <Picker.Item label="Toutes" value="Toutes" />
              {Array.from(new Set(photos.map(photo => photo.armoire || 'Non spécifié')))
                .sort((a, b) => {
                  // Tenter d'extraire le numéro de l'armoire 'a' s'il existe
                  const numA = a.match(/-(\d+)$/) ? parseInt(a.match(/-(\d+)$/)[1], 10) : null;
                  // Tenter d'extraire le numéro de l'armoire 'b' s'il existe
                  const numB = b.match(/-(\d+)$/) ? parseInt(b.match(/-(\d+)$/)[1], 10) : null;

                  // Si numA et numB sont définis, les comparer normalement
                  if (numA !== null && numB !== null) {
                    return numA - numB;
                  }
                  // Si numA est défini mais pas numB, numA vient après
                  if (numA !== null && numB === null) {
                    return 1;
                  }
                  // Si numB est défini mais pas numA, numB vient après
                  if (numA === null && numB !== null) {
                    return -1;
                  }
                  // Si ni l'un ni l'autre n'ont de numéro, les comparer par ordre alphabétique
                  return a.localeCompare(b);
                })
                .map(armoire => (
                  <Picker.Item key={armoire} label={armoire} value={armoire} />
                ))}
            </Picker>

            <TouchableOpacity
              style={MapStyle.applyButton}
              onPress={applyFilter}
            >
              <Text style={MapStyle.applyButtonText}>Appliquer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bouton pour changer le type de carte */}
      <Animated.View
        style={[
          MapStyle.mapToggleButton,
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
