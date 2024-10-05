import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { MaterialIcons } from '@expo/vector-icons';
import PublicImage from '../components/PublicImage';

export default function MaintenanceScreen() {
  const navigation = useNavigation();

  const [refreshing, setRefreshing] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('tout'); // 'tout' par défaut
  const [sortOrder, setSortOrder] = useState('name'); // 'name' par défaut pour trier par nom
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const translateYAnim = useState(new Animated.Value(300))[0];

  const fetchPhotos = async () => {
    setLoading(true);
    setError(null);

    try {
      let validFilters = [
        where('functionalityStatus', '==', 'En panne'), // Filtrer uniquement les décorations en panne
      ];

      // Appliquer les filtres supplémentaires basés sur installationStatus
      if (filter === 'installée') {
        validFilters.push(where('installationStatus', '==', 'Installée'));
      } else if (filter === 'non installée') {
        validFilters.push(where('installationStatus', '==', 'Non installée'));
      }
      // Si filter === 'tout', ne rien ajouter

      const decorationsCollection = collection(db, 'decorations');
      const photosQuery = query(decorationsCollection, ...validFilters);
      const snapshot = await getDocs(photosQuery);
      const photosList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

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
      setError('Erreur lors du chargement des décorations');
      console.error('Erreur Firestore:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, [filter, sortOrder]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPhotos().finally(() => setRefreshing(false));
  }, [filter, sortOrder]);

  const openPhotoDetails = (photo) => {
    navigation.navigate('DetailsDebugScreen', { photo });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date non disponible';
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

  const renderPhotoItem = ({ item }) => (
    <TouchableOpacity onPress={() => openPhotoDetails(item)}>
      
      <View style={styles.card}>
        <PublicImage 
            storagePath={item.imageUri}  // URL ou chemin Firebase
            style={styles.photo}  // Style de l'image
          />
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.installationName || 'Nom indisponible'}</Text>
          <Text style={styles.status}>{item.functionalityStatus || 'Statut non spécifié'}</Text>
          <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Chargement des décorations en panne...</Text>
      </View>
    );
  }

  if (error) {
    Alert.alert('Erreur', 'Impossible de récupérer les décorations.');
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {filter === 'tout'
            ? 'Toutes les décorations en panne'
            : filter === 'installée'
            ? 'Décorations en panne installées'
            : 'Décorations en panne non installées'}
        </Text>
        <TouchableOpacity onPress={openModal} style={styles.filterIcon}>
          <MaterialIcons name="filter-list" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={photos}
        renderItem={renderPhotoItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.noPhotosText}>Aucune décoration disponible.</Text>}
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

const styles = StyleSheet.create({
  // ... (les styles ont été mis à jour pour un design plus moderne)
  container: {
    flex: 1,
    backgroundColor: '#f7f8fa',
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#34495e',
    flexShrink: 1,
  },
  filterIcon: {
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  photo: {
    width: 70,
    height: 70,
    borderRadius: 15,
    marginRight: 15,
    backgroundColor: '#ecf0f1',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#34495e',
  },
  status: {
    fontSize: 14,
    color: 'red',
    marginTop: 2,
  },
  date: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
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
});
