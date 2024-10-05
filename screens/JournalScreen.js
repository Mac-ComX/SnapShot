import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
  Animated,
} from 'react-native';
import {
  getDocs,
  collection,
  query,
  where,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { MaterialIcons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import PublicImage from '../components/PublicImage';

export default function JournalScreen() {
  const [journalEntries, setJournalEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('tout'); // 'tout' par défaut
  const [sortOrder, setSortOrder] = useState('name'); // 'name' par défaut pour trier par nom
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedComment, setSelectedComment] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(300)).current; // Pour l'animation de translation du modal

  // Fonction pour récupérer les entrées du journal avec filtres et tri
  const fetchJournalEntries = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let validFilters = [];

      // Appliquer les filtres supplémentaires basés sur status
      if (filter === 'en_panne') {
        validFilters.push(where('status', '==', 'En Panne'));
      } else if (filter === 'fonctionnelle') {
        validFilters.push(where('status', '==', 'Fonctionnelle'));
      }
      // Si filter === 'tout', ne rien ajouter

      const journalsCollection = collection(db, 'journalsMaint');
      const journalsQuery = query(journalsCollection, ...validFilters);
      const snapshot = await getDocs(journalsQuery);
      let entriesList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      // Tri des entrées en fonction du sortOrder
      if (sortOrder === 'name') {
        entriesList.sort((a, b) => {
          const nameA = a.installationName || '';
          const nameB = b.installationName || '';
          return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
        });
      } else if (sortOrder === 'date_asc') {
        entriesList.sort((a, b) => parseDate(a.modificationDate) - parseDate(b.modificationDate));
      } else if (sortOrder === 'date_desc') {
        entriesList.sort((a, b) => parseDate(b.modificationDate) - parseDate(a.modificationDate));
      }

      setJournalEntries(entriesList);
    } catch (err) {
      setError('Erreur lors du chargement du Journal des suivis');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, sortOrder]);

  useEffect(() => {
    fetchJournalEntries();
  }, [fetchJournalEntries]);

  // Fonction de rafraîchissement
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchJournalEntries();
  }, [fetchJournalEntries]);

  // Fonction pour formater les dates en jj/mm/aaaa
  const formatDate = (dateString) => {
    if (!dateString) return 'Date non disponible';
    const date = parseDate(dateString);
    if (!date) return 'Date invalide';
    const day = ('0' + date.getDate()).slice(-2);
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Fonction pour parser la date à partir de la chaîne de caractères
  const parseDate = (dateString) => {
    if (!dateString) return null;
    if (typeof dateString === 'object' && dateString.seconds) {
      return new Date(dateString.seconds * 1000);
    }
    const date = new Date(dateString);
    if (isNaN(date)) return null;
    return date;
  };

  // Fonctions pour ouvrir et fermer le modal de filtre avec animations
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

  // Fonctions pour ouvrir et fermer le modal d'image
  const openImageModal = (photo, comment) => {
    setSelectedImage(photo);
    setSelectedComment(comment || '');
    setIsImageModalVisible(true);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
    setSelectedComment('');
    setIsImageModalVisible(false);
  };

  // Fonction de suppression d'une entrée du journal
  const handleDelete = async (id) => {
    Alert.alert(
      'Confirmation',
      'Voulez-vous vraiment supprimer cette entrée du Journal des suivis ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => deleteItem(id) },
      ],
      { cancelable: true }
    );
  };

  const deleteItem = async (id) => {
    try {
      await deleteDoc(doc(db, 'journalsMaint', id));
      setJournalEntries((prevEntries) => prevEntries.filter((entry) => entry.id !== id));
    } catch (error) {
      console.error('Erreur lors de la suppression :', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la suppression.');
    }
  };

  // Fonction pour rendre les actions de suppression
  const renderRightActions = (progress, dragX, id) => {
    const opacity = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    return (
      <TouchableOpacity onPress={() => handleDelete(id)} activeOpacity={0.6}>
        <Animated.View style={[styles.deleteButton, { opacity }]}>
          <MaterialIcons name="delete" size={24} color="#fff" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  // Fonction pour afficher chaque entrée du journal
  const renderJournalItem = ({ item }) => {
    const statusColor = (item.status === 'Installée' || item.status === 'Fonctionnelle') ? '#4caf50' : '#f44336';
    const etatColor = (item.etat === 'Fonctionnelle') ? '#4caf50' : '#f44336';

    return (
      <Swipeable
        renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item.id)}
        overshootRight={false}
        friction={2}
      >
        <TouchableOpacity style={styles.journalItem} activeOpacity={0.8}>
          {/* Header avec Nom et Date */}
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {item.installationName || 'Nom indisponible'}
            </Text>
            <Text style={styles.date}>{formatDate(item.modificationDate)}</Text>
          </View>

          {/* Statuts */}
          <View style={styles.statusContainer}>
            <View style={styles.statusWrapper}>
              <Text style={styles.statusLabel}>Statut: </Text>
              <Text style={[styles.statusValue, { color: statusColor }]}>
                {item.status || 'Non spécifié'}
              </Text>
            </View>
            <View style={styles.statusWrapper}>
              <Text style={styles.statusLabel}>État: </Text>
              <Text style={[styles.statusValue, { color: etatColor }]}>
                {item.etat || 'Non spécifié'}
              </Text>
            </View>
          </View>

          {/* Adresse */}
          {item.address && (
            <View style={styles.addressContainer}>
              <Text style={styles.addressTitle}>Adresse:</Text>
              <Text style={styles.addressText}>{item.address}</Text>
            </View>
          )}
          
          {/* Slider Horizontal pour les Photos */}
          {item.photos && item.photos.length > 0 && (
            <FlatList
              data={item.photos}
              renderItem={({ item: photo }) => (
                <TouchableOpacity onPress={() => openImageModal(photo, item.comment)}>
                  <PublicImage 
                storagePath={photo}  // URL ou chemin Firebase
                style={styles.photo}  // Style de l'image
              />
                </TouchableOpacity>
              )}
              keyExtractor={(photo, index) => index.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photoSlider}
            />
          )}

          {/* Dernier Commentaire */}
          <Text style={styles.commentTitle}>Dernier Commentaire:</Text>
          <Text style={styles.comment}>{item.comment || 'Aucun commentaire.'}</Text>

          {/* Historique des Commentaires */}
          {item.commentHistory && item.commentHistory.length > 0 && (
            <View style={styles.historyContainer}>
              <Text style={styles.historyTitle}>Historique des Commentaires :</Text>
              {item.commentHistory.map((historyItem, index) => (
                <View key={index} style={styles.historyItem}>
                  <Text style={styles.historyText}>
                    - <Text style={{ fontWeight: 'bold' }}>{historyItem.comment}</Text>{' '}
                    (modifié le{' '}
                    <Text style={{ fontWeight: '400' }}>
                      {formatDate(historyItem.date)}
                    </Text>
                    )
                  </Text>
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>
      </Swipeable>
    );
  };

  // Affichage de chargement ou d'erreur
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement du Journal des suivis...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header avec Titre et Icône de Filtre */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>
          {filter === 'tout'
            ? 'Toutes les entrées'
            : filter === 'en_panne'
            ? 'Entrées en Panne'
            : 'Entrées Fonctionnelles'}
        </Text>
        <TouchableOpacity onPress={openModal} style={styles.filterIcon}>
          <MaterialIcons name="filter-alt" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Liste des Entrées du Journal */}
      <FlatList
        data={journalEntries}
        renderItem={renderJournalItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />

      {/* Modal pour Filtre et Tri */}
      {isFilterModalVisible && (
        <Modal transparent={true} visible={isFilterModalVisible} animationType="none">
          <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
            <Animated.View
              style={[
                styles.modalContainer,
                { transform: [{ translateY: translateYAnim }] },
              ]}
            >
              <Text style={styles.modalTitle}>Filtrer les entrées</Text>

              {/* Options de Filtrage */}
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setFilter('en_panne');
                  closeModal();
                }}
              >
                <Text style={styles.modalText}>En Panne</Text>
                {filter === 'en_panne' && (
                  <MaterialIcons name="check" size={24} color="#3498db" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setFilter('fonctionnelle');
                  closeModal();
                }}
              >
                <Text style={styles.modalText}>Fonctionnelle</Text>
                {filter === 'fonctionnelle' && (
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
                <Text style={styles.modalText}>Toutes les entrées</Text>
                {filter === 'tout' && (
                  <MaterialIcons name="check" size={24} color="#3498db" />
                )}
              </TouchableOpacity>

              {/* Séparateur */}
              <View style={styles.modalSeparator} />

              {/* Options de Tri */}
              <Text style={styles.modalTitle}>Trier les entrées</Text>
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

              {/* Bouton Fermer */}
              <TouchableOpacity onPress={closeModal} style={styles.modalCloseButton}>
                <Text style={styles.modalCloseText}>Fermer</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </Modal>
      )}

      {/* Modal pour Afficher l'Image en Plein Écran */}
      {isImageModalVisible && selectedImage && (
        <Modal transparent={true} visible={isImageModalVisible} animationType="fade">
          <View style={styles.imageModalOverlay}>
            <TouchableOpacity style={styles.imageModalClose} onPress={closeImageModal}>
              <MaterialIcons name="close" size={30} color="#fff" />
            </TouchableOpacity>
            <View style={styles.imageModalContent}>
              <Image source={{ uri: selectedImage }} style={styles.fullscreenImage} />
              {selectedComment ? (
                <Text style={styles.fullscreenComment}>{selectedComment}</Text>
              ) : null}
            </View>
          </View>
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
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
  loadingText: {
    fontSize: 16,
    color: '#555555',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
  },
  listContainer: {
    paddingVertical: 10,
  },
  journalItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 10,
    marginBottom: 15,
    padding: 15,
    // Ombres
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    maxWidth: '70%', // Limite la largeur du titre pour éviter le débordement
  },
  date: {
    fontSize: 12,
    color: '#a0a0a0',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statusWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000', // Label en noir
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  addressContainer: {
    marginBottom: 10,
  },
  addressTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  addressText: {
    fontSize: 14,
    color: '#555555',
  },
  commentTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 5,
  },
  comment: {
    fontSize: 14,
    color: '#555555',
    marginBottom: 10,
  },
  historyContainer: {
    marginBottom: 15,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#444444',
    marginBottom: 5,
  },
  historyItem: {
    marginBottom: 5,
  },
  historyText: {
    fontSize: 13,
    color: '#666666',
  },
  photoSlider: {
    paddingVertical: 10,
  },
  photo: {
    width: 100,
    height: 100,
    marginRight: 10,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#cccccc',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    height: '100%',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
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
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalClose: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
  },
  imageModalContent: {
    width: '90%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '100%',
    height: '70%',
    resizeMode: 'contain',
    borderRadius: 12,
  },
  fullscreenComment: {
    marginTop: 20,
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
});
