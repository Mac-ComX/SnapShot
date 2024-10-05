import React, { useState } from 'react';
import { View, Image, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { addDoc, collection } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { db } from '../../services/firebase';

export default function CameraMaintScreen({ route }) {
  const { capturedPhotoUri, photo } = route.params;
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const savePhoto = async () => {
    try {
      setLoading(true);
      const installationName = photo.installationName;

      // 1. Sauvegarde locale de l'image
      const localUri = `${FileSystem.documentDirectory}${installationName}_maintenance.jpg`;
      await FileSystem.copyAsync({
        from: capturedPhotoUri,
        to: localUri,
      });

      // 2. Upload de l'image vers Firebase Storage
      const response = await fetch(capturedPhotoUri);
      const blob = await response.blob();
      const storage = getStorage();
      const storageRef = ref(storage, `photos-maintenance/${installationName}-${Date.now()}.jpg`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      // 3. Enregistrement dans Firestore
      await addDoc(collection(db, 'decorations', photo.installationID, 'photos-maintenance'), {
        imageUri: downloadURL,
        localImageUri: localUri,
        createdAt: new Date().toLocaleString(),
      });

      Alert.alert('Succès', 'Photo de maintenance sauvegardée avec succès !');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder la photo de maintenance.');
    } finally {
      setLoading(false);
    }
  };

  const retakePhoto = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Affichage de l'image capturée */}
      <Image source={{ uri: capturedPhotoUri }} style={styles.photo} />

      {/* Bouton pour enregistrer la photo */}
      <TouchableOpacity style={styles.iconButton} onPress={savePhoto}>
        <MaterialIcons name="save" size={40} color="green" />
      </TouchableOpacity>

      {/* Bouton pour reprendre une nouvelle photo */}
      <TouchableOpacity style={styles.iconButton} onPress={retakePhoto}>
        <MaterialIcons name="refresh" size={40} color="red" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  photo: {
    width: '100%',
    height: 400,
    borderRadius: 15,
    marginBottom: 20,
  },
  iconButton: {
    margin: 15,
  },
});
