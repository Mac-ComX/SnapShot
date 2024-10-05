import React, { useState } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

export default function PreviewScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { imageUri: initialImageUri } = route.params;

  const [imageUri, setImageUri] = useState(initialImageUri);

  // Fonction pour prendre une nouvelle photo
  const takeNewPhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission refusée', 'Vous devez autoriser l\'accès à la caméra.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync();
    if (!result.canceled) {
      setImageUri(result.assets[0].uri); // Mise à jour de l'URI de la nouvelle photo
    }
  };

  const handleCancel = () => {
    navigation.goBack(); // Annule et revient à l'écran précédent
  };

  return (
    <View style={styles.container}>
      {/* Affiche l'image en plein écran */}
      <Image source={{ uri: imageUri }} style={styles.fullScreenImage} />

      {/* Icône pour annuler l'opération */}
      <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
        <Ionicons name="close-outline" size={40} color="#fff" />
      </TouchableOpacity>

      {/* Icône pour reprendre une nouvelle photo */}
      <TouchableOpacity style={styles.retakeButton} onPress={takeNewPhoto}>
        <Ionicons name="camera-outline" size={40} color="#fff" />
      </TouchableOpacity>

      {/* Icône pour ouvrir le formulaire dans une nouvelle page */}
      <TouchableOpacity
        style={styles.submitButton}
        onPress={() => navigation.navigate('FormScreen', { imageUri })}
      >
        <Ionicons name="checkmark-outline" size={40} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Couleur de fond noire
    position: 'relative', // Pour positionner les éléments flottants
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover', // L'image occupe tout l'espace disponible
  },
  cancelButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fond semi-transparent
    padding: 12,
    borderRadius: 30, // Bouton circulaire
  },
  retakeButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fond semi-transparent
    padding: 12,
    borderRadius: 30, // Bouton circulaire
  },
  submitButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center', // Centré horizontalement
    backgroundColor: '#1b484e', // Couleur pour valider la photo
    padding: 20,
    borderRadius: 40, // Bouton circulaire
    shadowColor: '#000', // Ombre pour plus de profondeur
    shadowOffset: { width: 0, height: 4 }, // Position de l'ombre
    shadowOpacity: 0.3, // Opacité de l'ombre
    shadowRadius: 4, // Rayon de l'ombre
    elevation: 8, // Élévation pour un effet de relief
  },
});
