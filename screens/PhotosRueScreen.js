// screens/PhotosRueScreen.js
import React, { useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import useFirestoreData from '../hooks/useFirestoreData';  // Import du hook personnalisé
import ImageModal from '../components/ImageModal/ImageModal';
import CustomButton from '../components/CustomButton/CustomButton';

export default function PhotosRueScreen({ route }) {
  const { rue } = route.params;
  const { data: photos, loading, error } = useFirestoreData('decorations', [{ field: 'rue', operator: '==', value: rue }]);
  
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const openPhotoModal = (photo) => {
    if (!photo.imageUri) {
      Alert.alert("Erreur", "L'URL de l'image est invalide ou manquante");
      return;
    }
    setSelectedPhoto(photo);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedPhoto(null);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => openPhotoModal(item)}>
      <View style={styles.photoContainer}>
        <Image 
          source={{ uri: item.imageUri }} 
          style={styles.photo} 
          onError={() => Alert.alert("Erreur", "Impossible de charger l'image")}
        />
        <Text style={styles.title}>{item.installationName || 'Titre indisponible'}</Text>
        <Text style={styles.comment}>{item.comment || 'Commentaire indisponible'}</Text>

        {/* Affichage des nouvelles métadonnées */}
        <Text style={styles.metadata}>Type d'installation : {item.installationType || 'Non spécifié'}</Text>
        <Text style={styles.metadata}>Statut : {item.installationStatus || 'Non spécifié'}</Text>
        <Text style={styles.metadata}>État de fonctionnement : {item.functionalityStatus || 'Non spécifié'}</Text>
        <Text style={styles.metadata}>Urgence de réparation : {item.repairUrgency || 'Non spécifié'}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Chargement des photos...</Text>
      </View>
    );
  }

  if (error) {
    Alert.alert('Erreur', 'Impossible de récupérer les photos.');
    return null;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={photos}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}  // Utiliser l'ID unique du document comme clé
        ListEmptyComponent={<Text style={styles.noPhotosText}>Aucune photo disponible pour cette rue.</Text>}
      />

      <ImageModal
        visible={modalVisible}
        onClose={closeModal}
        imageUri={selectedPhoto?.imageUri}
        title={selectedPhoto?.installationName}
        description={selectedPhoto?.comment}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoContainer: {
    marginBottom: 20,
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  comment: {
    fontSize: 14,
    color: '#666',
  },
  metadata: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
  },
  noPhotosText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
});
