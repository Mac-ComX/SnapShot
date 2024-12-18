import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  Animated,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import { db } from '../services/firebase';
import { MaterialIcons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import PublicImage from '../components/PublicImage';
import PhotosRueStyle from '../Styles/PhotosRueStyle';

const formatInstallationName = (name) => {
  // Utiliser une expression régulière pour supprimer le tiret et les chiffres à la fin
  return name.replace(/-\d+$/, '');
};


export default function PhotosRueScreen({ route }) {
  const { rue, ville } = route.params || {};
  const navigation = useNavigation();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('tout'); // 'tout' par défaut
  const [sortOrder, setSortOrder] = useState('name'); // 'name' par défaut pour trier par nom
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const translateYAnim = useState(new Animated.Value(300))[0]; // Pour l'animation de translation du modal

  if (!rue || !ville) {
    return (
      <View style={PhotosRueStyle.loadingContainer}>
        <Text>Paramètres de rue ou de ville manquants.</Text>
      </View>
    );
  }

  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let validFilters = [
        where('rue', '==', rue),
        where('ville', '==', ville),
        where('functionalityStatus', '==', 'Fonctionnelle'),
      ];

      if (filter === 'installée') {
        validFilters.push(where('installationStatus', '==', 'Installée'));
      } else if (filter === 'non installée') {
        validFilters.push(where('installationStatus', '==', 'Non installée'));
      }

      const decorationsCollection = collection(db, 'decorations');
      const photosQuery = query(decorationsCollection, ...validFilters);
      const snapshot = await getDocs(photosQuery);
      let photosList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      // Filtrer les photos pour exclure les "Armoires" côté client
      photosList = photosList.filter(photo => photo.installationType !== 'Armoire');

      // Tri des décorations en fonction du sortOrder
      if (sortOrder === 'name') {
        photosList.sort((a, b) => {
          const nameA = a.installationName || '';
          const nameB = b.installationName || '';
          return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
        });
      } else if (sortOrder === 'date_asc') {
        photosList.sort((a, b) => parseDate(a.createdAt) - parseDate(b.createdAt));
      } else if (sortOrder === 'date_desc') {
        photosList.sort((a, b) => parseDate(b.createdAt) - parseDate(a.createdAt));
      }

      setPhotos(photosList);
    } catch (err) {
      setError('Erreur lors du chargement des photos');
      console.error('Erreur Firestore:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [rue, ville, filter, sortOrder]);

  useEffect(() => {
    fetchPhotos();
  }, [filter, sortOrder, fetchPhotos]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPhotos();
  }, [fetchPhotos]);

  const openPhotoDetails = (photo) => {
    navigation.navigate('DetailsScreen', { photo });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date non spécifiée';
    const date = parseDate(dateString);
    if (!date) return 'Date invalide';
    const options = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    };
    return date.toLocaleDateString('fr-FR', options);
  };

  // Fonction pour parser la date à partir de la chaîne de caractères
  const parseDate = (dateString) => {
    if (!dateString) return null;
    const [datePart, timePart] = dateString.split(', ');
    const [day, month, year] = datePart.split('/');
    const [hour, minute] = timePart.split(':');
    const date = new Date(year, month - 1, day, hour, minute);
    return date;
  };

  const openModal = () => {
    setIsFilterModalVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(translateYAnim, {
        toValue: 0,
        bounciness: 10,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setIsFilterModalVisible(false));
  };

  const handleDelete = async (id, imageUri) => {
    Alert.alert(
      'Confirmation',
      'Voulez-vous vraiment supprimer cette décoration ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => deleteItem(id, imageUri) },
      ],
      { cancelable: true }
    );
  };

  const deleteItem = async (id, imageUri) => {
    try {
      await deleteDoc(doc(db, 'decorations', id));
      if (imageUri) {
        const storage = getStorage();
        const imageRef = ref(storage, imageUri);
        await deleteObject(imageRef);
      }
      setPhotos((prevPhotos) => prevPhotos.filter((photo) => photo.id !== id));
    } catch (error) {
      console.error('Erreur lors de la suppression :', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la suppression.');
    }
  };

  const renderPhotoItem = ({ item }) => {
    return <PhotoItem item={item} />;
  };

  const PhotoItem = ({ item }) => {
    const installationName = formatInstallationName(item.installationName || '');  // Formater le nom ici
    const [isSwiped, setIsSwiped] = useState(false);
    const swipeableRef = useRef(null);

    const renderRightActions = (progress, dragX) => {
      const opacity = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
      });

      return (
        <TouchableOpacity onPress={() => handleDelete(item.id, item.imageUri)} activeOpacity={0.6}>
          <Animated.View style={[PhotosRueStyle.deleteButton, { opacity }]}>
            <Text style={PhotosRueStyle.deleteButtonText}>Supprimer</Text>
          </Animated.View>
        </TouchableOpacity>
      );
    };

    return (
      <View style={PhotosRueStyle.itemContainer}>
        <Swipeable
          ref={swipeableRef}
          renderRightActions={renderRightActions}
          overshootRight={false}
          friction={2}
          onSwipeableWillOpen={() => setIsSwiped(true)}
          onSwipeableWillClose={() => setIsSwiped(false)}
          containerStyle={PhotosRueStyle.swipeableContainer}
        >
          <TouchableOpacity onPress={() => openPhotoDetails(item)}>
            <View style={[PhotosRueStyle.card, isSwiped && PhotosRueStyle.cardSwiped]}>
              <PublicImage
                storagePath={item.imageUri}
                style={PhotosRueStyle.photo}
              />
              <View style={PhotosRueStyle.textContainer}>
                <Text style={PhotosRueStyle.title}>{installationName || 'Nom indisponible'}</Text>
                <Text style={[PhotosRueStyle.status, { color: item.installationStatus === 'Installée' ? '#27ae60' : '#e67e22' }]}>
                  {item.installationStatus || 'Statut non spécifié'}
                </Text>
                <Text style={PhotosRueStyle.date}>{formatDate(item.createdAt)}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </Swipeable>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={PhotosRueStyle.loadingContainer}>
        <Text>Chargement des photos...</Text>
      </View>
    );
  }

  if (error) {
    Alert.alert('Erreur', error);
    return null;
  }

  return (
    <View style={PhotosRueStyle.container}>
      {/* Header avec la flèche de retour */}
      <View style={PhotosRueStyle.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={PhotosRueStyle.backButton}>
          <MaterialIcons name="arrow-back" size={28} color="#3498db" />
        </TouchableOpacity>
        <View style={PhotosRueStyle.headerTextContainer}>
          <Text style={PhotosRueStyle.headerTitle} numberOfLines={1} ellipsizeMode="tail">
            {filter === 'tout'
              ? 'Toutes Décors'
              : filter === 'installée'
              ? 'Décors installées'
              : 'Décors non installées'}
          </Text>
        </View>
        <TouchableOpacity onPress={openModal} style={PhotosRueStyle.filterIcon}>
          <MaterialIcons name="filter-list" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={photos}
        renderItem={renderPhotoItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={PhotosRueStyle.noPhotosText}>Aucune photo disponible.</Text>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />

      {/* Modal pour filtre et tri */}
      {isFilterModalVisible && (
        <Modal transparent={true} visible={isFilterModalVisible} animationType="none">
          <Animated.View style={[PhotosRueStyle.modalOverlay, { opacity: fadeAnim }]}>
            <Animated.View
              style={[PhotosRueStyle.modalContainer, { transform: [{ translateY: translateYAnim }] }]}
            >
              <Text style={PhotosRueStyle.modalTitle}>Filtrer les décorations</Text>

              {/* Options de filtre */}
              <TouchableOpacity
                style={PhotosRueStyle.modalOption}
                onPress={() => {
                  setFilter('installée');
                  closeModal();
                }}
              >
                <Text style={PhotosRueStyle.modalText}>Installées</Text>
                {filter === 'installée' && (
                  <MaterialIcons name="check" size={24} color="#3498db" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={PhotosRueStyle.modalOption}
                onPress={() => {
                  setFilter('non installée');
                  closeModal();
                }}
              >
                <Text style={PhotosRueStyle.modalText}>Non installées</Text>
                {filter === 'non installée' && (
                  <MaterialIcons name="check" size={24} color="#3498db" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={PhotosRueStyle.modalOption}
                onPress={() => {
                  setFilter('tout');
                  closeModal();
                }}
              >
                <Text style={PhotosRueStyle.modalText}>Toutes les décorations</Text>
                {filter === 'tout' && (
                  <MaterialIcons name="check" size={24} color="#3498db" />
                )}
              </TouchableOpacity>

              {/* Séparateur */}
              <View style={PhotosRueStyle.modalSeparator} />

              {/* Options de tri */}
              <Text style={PhotosRueStyle.modalTitle}>Trier les décorations</Text>
              <TouchableOpacity
                style={PhotosRueStyle.modalOption}
                onPress={() => {
                  setSortOrder('name');
                  closeModal();
                }}
              >
                <Text style={PhotosRueStyle.modalText}>Par nom</Text>
                {sortOrder === 'name' && (
                  <MaterialIcons name="check" size={24} color="#3498db" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={PhotosRueStyle.modalOption}
                onPress={() => {
                  setSortOrder('date_asc');
                  closeModal();
                }}
              >
                <Text style={PhotosRueStyle.modalText}>Par date croissante</Text>
                {sortOrder === 'date_asc' && (
                  <MaterialIcons name="check" size={24} color="#3498db" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={PhotosRueStyle.modalOption}
                onPress={() => {
                  setSortOrder('date_desc');
                  closeModal();
                }}
              >
                <Text style={PhotosRueStyle.modalText}>Par date décroissante</Text>
                {sortOrder === 'date_desc' && (
                  <MaterialIcons name="check" size={24} color="#3498db" />
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={closeModal} style={PhotosRueStyle.modalCloseButton}>
                <Text style={PhotosRueStyle.modalCloseText}>Fermer</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </Modal>
      )}
    </View>
  );
}
