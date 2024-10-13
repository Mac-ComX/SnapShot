import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
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
import JournalStyle from '../Styles/JournalStyle';

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
        <Animated.View style={[JournalStyle.deleteButton, { opacity }]}>
          <MaterialIcons name="delete" size={24} color="#fff" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  // Fonction pour afficher chaque entrée du journal
  const renderJournalItem = ({ item }) => {
    const statusColor = (item.status === 'Installée' || item.status === 'Fonctionnelle') ? '#4caf50' : '#FF5E00';
    const etatColor = (item.etat === 'Fonctionnelle') ? '#4caf50' : '#f44336';

    return (
      <Swipeable
        renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item.id)}
        overshootRight={false}
        friction={2}
      >
        <TouchableOpacity style={JournalStyle.journalItem} activeOpacity={0.8}>
          {/* Header avec Nom et Date */}
          <View style={JournalStyle.header}>
            <Text style={JournalStyle.title} numberOfLines={1}>
              {item.installationName || 'Nom indisponible'}
            </Text>
            <Text style={JournalStyle.date}>{formatDate(item.modificationDate)}</Text>
          </View>

          {/* Statuts */}
          <View style={JournalStyle.statusContainer}>
            <View style={JournalStyle.statusWrapper}>
              <Text style={JournalStyle.statusLabel}>Statut: </Text>
              <Text style={[JournalStyle.statusValue, { color: statusColor }]}>
                {item.status || 'Non spécifié'}
              </Text>
            </View>
            <View style={JournalStyle.statusWrapper}>
              <Text style={JournalStyle.statusLabel}>État: </Text>
              <Text style={[JournalStyle.statusValue, { color: etatColor }]}>
                {item.etat || 'Non spécifié'}
              </Text>
            </View>
          </View>

          {/* Adresse */}
          {item.address && (
            <View style={JournalStyle.addressContainer}>
              <Text style={JournalStyle.addressTitle}>Adresse:</Text>
              <Text style={JournalStyle.addressText}>{item.address}</Text>
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
                style={JournalStyle.photo}  // Style de l'image
              />
                </TouchableOpacity>
              )}
              keyExtractor={(photo, index) => index.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={JournalStyle.photoSlider}
            />
          )}

          {/* Dernier Commentaire */}
          <Text style={JournalStyle.commentTitle}>Dernier Commentaire:</Text>
          <Text style={JournalStyle.comment}>{item.comment || 'Aucun commentaire.'}</Text>

          {/* Historique des Commentaires */}
          {item.commentHistory && item.commentHistory.length > 0 && (
            <View style={JournalStyle.historyContainer}>
              <Text style={JournalStyle.historyTitle}>Historique des Commentaires :</Text>
              {item.commentHistory.map((historyItem, index) => (
                <View key={index} style={JournalStyle.historyItem}>
                  <Text style={JournalStyle.historyText}>
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
      <View style={JournalStyle.loadingContainer}>
        <Text style={JournalStyle.loadingText}>Chargement du Journal des suivis...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={JournalStyle.errorContainer}>
        <Text style={JournalStyle.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={JournalStyle.container}>
      {/* Header avec Titre et Icône de Filtre */}
      <View style={JournalStyle.headerContainer}>
        <Text style={JournalStyle.headerTitle}>
          {filter === 'tout'
            ? 'Toutes les entrées'
            : filter === 'en_panne'
            ? 'Entrées en Panne'
            : 'Entrées Fonctionnelles'}
        </Text>
        <TouchableOpacity onPress={openModal} style={JournalStyle.filterIcon}>
          <MaterialIcons name="filter-alt" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Liste des Entrées du Journal */}
      <FlatList
        data={journalEntries}
        renderItem={renderJournalItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={JournalStyle.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />

      {/* Modal pour Filtre et Tri */}
      {isFilterModalVisible && (
        <Modal transparent={true} visible={isFilterModalVisible} animationType="none">
          <Animated.View style={[JournalStyle.modalOverlay, { opacity: fadeAnim }]}>
            <Animated.View
              style={[
                JournalStyle.modalContainer,
                { transform: [{ translateY: translateYAnim }] },
              ]}
            >
              <Text style={JournalStyle.modalTitle}>Filtrer les entrées</Text>

              {/* Options de Filtrage */}
              <TouchableOpacity
                style={JournalStyle.modalOption}
                onPress={() => {
                  setFilter('en_panne');
                  closeModal();
                }}
              >
                <Text style={JournalStyle.modalText}>En Panne</Text>
                {filter === 'en_panne' && (
                  <MaterialIcons name="check" size={24} color="#3498db" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={JournalStyle.modalOption}
                onPress={() => {
                  setFilter('fonctionnelle');
                  closeModal();
                }}
              >
                <Text style={JournalStyle.modalText}>Fonctionnelle</Text>
                {filter === 'fonctionnelle' && (
                  <MaterialIcons name="check" size={24} color="#3498db" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={JournalStyle.modalOption}
                onPress={() => {
                  setFilter('tout');
                  closeModal();
                }}
              >
                <Text style={JournalStyle.modalText}>Toutes les entrées</Text>
                {filter === 'tout' && (
                  <MaterialIcons name="check" size={24} color="#3498db" />
                )}
              </TouchableOpacity>

              {/* Séparateur */}
              <View style={JournalStyle.modalSeparator} />

              {/* Options de Tri */}
              <Text style={JournalStyle.modalTitle}>Trier les entrées</Text>
              <TouchableOpacity
                style={JournalStyle.modalOption}
                onPress={() => {
                  setSortOrder('name');
                  closeModal();
                }}
              >
                <Text style={JournalStyle.modalText}>Par nom</Text>
                {sortOrder === 'name' && (
                  <MaterialIcons name="check" size={24} color="#3498db" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={JournalStyle.modalOption}
                onPress={() => {
                  setSortOrder('date_asc');
                  closeModal();
                }}
              >
                <Text style={JournalStyle.modalText}>Par date croissante</Text>
                {sortOrder === 'date_asc' && (
                  <MaterialIcons name="check" size={24} color="#3498db" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={JournalStyle.modalOption}
                onPress={() => {
                  setSortOrder('date_desc');
                  closeModal();
                }}
              >
                <Text style={JournalStyle.modalText}>Par date décroissante</Text>
                {sortOrder === 'date_desc' && (
                  <MaterialIcons name="check" size={24} color="#3498db" />
                )}
              </TouchableOpacity>

              {/* Bouton Fermer */}
              <TouchableOpacity onPress={closeModal} style={JournalStyle.modalCloseButton}>
                <Text style={JournalStyle.modalCloseText}>Fermer</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </Modal>
      )}

      {/* Modal pour Afficher l'Image en Plein Écran */}
      {isImageModalVisible && selectedImage && (
        <Modal transparent={true} visible={isImageModalVisible} animationType="fade">
          <View style={JournalStyle.imageModalOverlay}>
            <TouchableOpacity style={JournalStyle.imageModalClose} onPress={closeImageModal}>
              <MaterialIcons name="close" size={30} color="#fff" />
            </TouchableOpacity>
            <View style={JournalStyle.imageModalContent}>
              <Image source={{ uri: selectedImage }} style={JournalStyle.fullscreenImage} />
              {selectedComment ? (
                <Text style={JournalStyle.fullscreenComment}>{selectedComment}</Text>
              ) : null}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
