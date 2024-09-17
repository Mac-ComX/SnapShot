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

  return (
    <View style={styles.container}>
      {/* Affiche l'image en plein écran */}
      <Image source={{ uri: imageUri }} style={styles.fullScreenImage} />

      {/* Icône pour ouvrir le formulaire dans une nouvelle page */}
      <TouchableOpacity
        style={styles.iconButton}
        onPress={() => navigation.navigate('FormScreen', { imageUri })}
      >
        <Ionicons name="create-outline" size={28} color="white" />
      </TouchableOpacity>

      {/* Icône pour reprendre une nouvelle photo */}
      <TouchableOpacity style={styles.cameraButton} onPress={takeNewPhoto}>
        <Ionicons name="camera-outline" size={40} color="white" />
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
    resizeMode: 'contain', // Redimensionne l'image pour qu'elle soit visible entièrement
  },
  iconButton: {
    position: 'absolute',
    top: 30,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Fond semi-transparent
    padding: 10,
    borderRadius: 50, // Bouton circulaire
  },
  cameraButton: {
    position: 'absolute',
    bottom: 50,
    right: 20,
    backgroundColor: '#1e90ff', // Couleur bleue pour le bouton de l'appareil photo
    padding: 15,
    borderRadius: 50, // Bouton circulaire
    shadowColor: '#000', // Ombre
    shadowOffset: { width: 0, height: 4 }, // Position de l'ombre
    shadowOpacity: 0.3, // Opacité de l'ombre
    shadowRadius: 4, // Rayon de l'ombre
    elevation: 8, // Élévation pour un effet de relief
  },
});
