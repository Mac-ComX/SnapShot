import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Modal, Button, FlatList, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { addDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function DetailsScreen({ route }) {
  const { photo } = route.params;

  const navigation = useNavigation();
  const [capturedPhotoUri, setCapturedPhotoUri] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [additionalPhotos, setAdditionalPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdditionalPhotos = async () => {
      try {
        const collectionRef = collection(db, 'decorations', photo.installationID, 'photos-additionnelles');
        const querySnapshot = await getDocs(collectionRef);

        const photos = querySnapshot.docs.map((doc) => doc.data().imageUri);
        const validPhotos = photos.filter(uri => uri !== undefined && uri !== null);

        setAdditionalPhotos(validPhotos);
        setLoading(false);
      } catch (err) {
        setError('Erreur lors de la récupération des photos');
        setLoading(false);
      }
    };

    fetchAdditionalPhotos();
  }, [photo.installationID]);

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission refusée', 'Vous devez autoriser l\'accès à la caméra.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync();
    if (!result.canceled) {
      setCapturedPhotoUri(result.assets[0].uri);
      setModalVisible(true);
    }
  };

  const saveAdditionalPhoto = async () => {
    try {
      if (!capturedPhotoUri) {
        throw new Error("Aucune photo à enregistrer");
      }

      const collectionRef = collection(db, 'decorations', photo.installationID, 'photos-additionnelles');
      await addDoc(collectionRef, {
        imageUri: capturedPhotoUri,
        createdAt: new Date().toLocaleString(),
      });

      setModalVisible(false);
      Alert.alert('Succès', 'Photo additionnelle enregistrée avec succès !');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'enregistrer la photo additionnelle.');
    }
  };

  const copyFileToTemp = async (fileUri) => {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);

    if (!fileInfo.exists) {
      return null;
    }

    const fileName = `tempImage-${Date.now()}.jpg`;
    const destinationUri = FileSystem.documentDirectory + fileName;

    await FileSystem.copyAsync({
      from: fileUri,
      to: destinationUri,
    });

    return destinationUri;
  };

  const renderPhotoItem = async ({ item }) => {
    const accessibleUri = await copyFileToTemp(item);

    if (!accessibleUri) {
      return null;
    }

    return (
      <Image source={{ uri: accessibleUri }} style={styles.gridPhoto} />
    );
  };

  return (
    <FlatList
      ListHeaderComponent={
        <View style={styles.container}>
          <Image source={{ uri: photo.imageUri }} style={styles.largePhoto} />
          <Text style={styles.title}>{photo.installationName}</Text>
          <Text style={styles.metadata}>Type : {photo.installationType}</Text>
          <Text style={styles.metadata}>Statut : {photo.installationStatus}</Text>

          <TouchableOpacity style={styles.addPhotoButton} onPress={openCamera}>
            <Text style={styles.addPhotoButtonText}>Prendre une photo additionnelle</Text>
          </TouchableOpacity>

          <Modal visible={modalVisible} animationType="slide" transparent={false}>
            <View style={styles.modalContainer}>
              {capturedPhotoUri && (
                <Image source={{ uri: capturedPhotoUri }} style={styles.previewPhoto} />
              )}
              <Button title="Enregistrer la photo" onPress={saveAdditionalPhoto} />
              <Button title="Reprendre une photo" onPress={openCamera} />
              <Button title="Annuler" onPress={() => setModalVisible(false)} />
            </View>
          </Modal>
        </View>
      }
      data={additionalPhotos}
      renderItem={renderPhotoItem}
      keyExtractor={(item, index) => index.toString()}
      numColumns={2}
      style={styles.photoGallery}
      ListEmptyComponent={<Text>Chargement des photos additionnelles...</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  largePhoto: {
    width: '100%',
    height: 450,
    borderRadius: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  metadata: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  addPhotoButton: {
    marginTop: 20,
    backgroundColor: '#1b484e',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
  },
  addPhotoButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewPhoto: {
    width: '100%',
    height: 300,
    marginBottom: 20,
  },
  photoGallery: {
    marginTop: 20,
    width: '100%',
  },
  gridPhoto: {
    width: 150,
    height: 150,
    margin: '1%',
    borderRadius: 10,
    backgroundColor: '#ccc',
  },
});
