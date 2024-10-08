import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  Animated,
  Easing,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import { db } from '../services/firebase';
import { MaterialIcons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import PublicImage from '../components/PublicImage';

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
      <View style={styles.loadingContainer}>
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
    const [isSwiped, setIsSwiped] = useState(false);
    const swipeableRef = useRef(null);

    const renderRightActions = (progress, dragX) => {
      const opacity = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
      });

      return (
        <TouchableOpacity onPress={() => handleDelete(item.id, item.imageUri)} activeOpacity={0.6}>
          <Animated.View style={[styles.deleteButton, { opacity }]}>
            <Text style={styles.deleteButtonText}>Supprimer</Text>
          </Animated.View>
        </TouchableOpacity>
      );
    };

    return (
      <View style={styles.itemContainer}>
        <Swipeable
          ref={swipeableRef}
          renderRightActions={renderRightActions}
          overshootRight={false}
          friction={2}
          onSwipeableWillOpen={() => setIsSwiped(true)}
          onSwipeableWillClose={() => setIsSwiped(false)}
          containerStyle={styles.swipeableContainer}
        >
          <TouchableOpacity onPress={() => openPhotoDetails(item)}>
            <View style={[styles.card, isSwiped && styles.cardSwiped]}>
              <PublicImage
                storagePath={item.imageUri}
                style={styles.photo}
              />
              <View style={styles.textContainer}>
                <Text style={styles.title}>{item.installationName || 'Nom indisponible'}</Text>
                <Text style={styles.status}>{item.functionalityStatus || 'Statut non spécifié'}</Text>
                <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </Swipeable>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Chargement des photos...</Text>
      </View>
    );
  }

  if (error) {
    Alert.alert('Erreur', error);
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header avec la flèche de retour */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
            {filter === 'tout'
              ? 'Toutes les décorations'
              : filter === 'installée'
              ? 'Décorations installées'
              : 'Décorations non installées'}
          </Text>
        </View>
        <TouchableOpacity onPress={openModal} style={styles.filterIcon}>
          <MaterialIcons name="filter-list" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={photos}
        renderItem={renderPhotoItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.noPhotosText}>Aucune photo disponible.</Text>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />

      {/* Modal pour filtre et tri */}
      {isFilterModalVisible && (
        <Modal transparent={true} visible={isFilterModalVisible} animationType="none">
          <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
            <Animated.View
              style={[
                styles.modalContainer,
                { transform: [{ translateY: translateYAnim }] },
              ]}
            >
              <Text style={styles.modalTitle}>Filtrer les décorations</Text>

              {/* Options de filtre */}
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setFilter('installée');
                  closeModal();
                }}
              >
                <Text style={styles.modalText}>Installées</Text>
                {filter === 'installée' && (
                  <MaterialIcons name="check" size={24} color="#3498db" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setFilter('non installée');
                  closeModal();
                }}
              >
                <Text style={styles.modalText}>Non installées</Text>
                {filter === 'non installée' && (
                  <MaterialIcons name="check" size={24} color="#3498db" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setFilter('tout');
                  closeModal();
                }}
              >
                <Text style={styles.modalText}>Toutes les décorations</Text>
                {filter === 'tout' && (
                  <MaterialIcons name="check" size={24} color="#3498db" />
                )}
              </TouchableOpacity>

              {/* Séparateur */}
              <View style={styles.modalSeparator} />

              {/* Options de tri */}
              <Text style={styles.modalTitle}>Trier les décorations</Text>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setSortOrder('name');
                  closeModal();
                }}
              >
                <Text style={styles.modalText}>Par nom</Text>
                {sortOrder === 'name' && (
                  <MaterialIcons name="check" size={24} color="#3498db" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setSortOrder('date_asc');
                  closeModal();
                }}
              >
                <Text style={styles.modalText}>Par date croissante</Text>
                {sortOrder === 'date_asc' && (
                  <MaterialIcons name="check" size={24} color="#3498db" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setSortOrder('date_desc');
                  closeModal();
                }}
              >
                <Text style={styles.modalText}>Par date décroissante</Text>
                {sortOrder === 'date_desc' && (
                  <MaterialIcons name="check" size={24} color="#3498db" />
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={closeModal} style={styles.modalCloseButton}>
                <Text style={styles.modalCloseText}>Fermer</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </Modal>
      )}
    </View>
  );
}

// Styles pour l'interface
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f4f6',
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    // Vous pouvez ajuster le padding ou la marge selon vos besoins
  },
  backButton: {
    padding: 10,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  filterIcon: {
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 50,
    marginLeft: 10,
    flexShrink: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContainer: {
    marginBottom: 15,
  },
  swipeableContainer: {
    overflow: 'hidden',
    borderRadius: 15,
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    overflow: 'hidden',
    borderRadius: 15,
  },
  cardSwiped: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  photo: {
    width: 70,
    height: 70,
    borderRadius: 15,
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2c3e50',
  },
  status: {
    fontSize: 14,
    color: '#27ae60',
    marginTop: 4,
  },
  date: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  noPhotosText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#95a5a6',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#1b484e',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#34495e',
  },
  modalCloseButton: {
    marginTop: 20,
    paddingVertical: 15,
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#fff',
  },
  modalSeparator: {
    width: '100%',
    height: 1,
    backgroundColor: '#ecf0f1',
    marginVertical: 15,
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    width: 90,
    height: '100%',
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
