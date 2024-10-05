import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as FileSystem from 'expo-file-system';
import { addDoc, collection } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { db } from '../services/firebase';

export default function PreviewMaintScreen({ route }) {
  const { capturedPhotoUri, photo } = route.params;
  const navigation = useNavigation();

  const savePhoto = async () => {
    try {
      const installationName = photo.installationName;

      // Sauvegarde locale de la photo
      const localUri = `${FileSystem.documentDirectory}${installationName}_maintenance.jpg`;
      await FileSystem.copyAsync({
        from: capturedPhotoUri,
        to: localUri,
      });

      // Conversion de l'image en blob et sauvegarde sur Firebase Storage
      const response = await fetch(capturedPhotoUri);
      const blob = await response.blob();
      const storage = getStorage();
      const photoRef = ref(storage, `photos-maintenance/${installationName}-${Date.now()}.jpg`);
      await uploadBytes(photoRef, blob);
      const downloadURL = await getDownloadURL(photoRef);

      // Enregistrement des informations dans Firestore
      await addDoc(collection(db, 'decorations', photo.installationID, 'photos-maintenance'), {
        imageUri: downloadURL,
        localImageUri: localUri,
        createdAt: new Date().toLocaleString(),
      });

      Alert.alert('Succès', 'Photo de maintenance enregistrée avec succès !');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'enregistrer la photo.');
    }
  };

  const retakePhoto = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: capturedPhotoUri }} style={styles.photo} />

      <TouchableOpacity style={styles.iconButton} onPress={savePhoto}>
        <MaterialIcons name="save" size={40} color="green" />
      </TouchableOpacity>

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
