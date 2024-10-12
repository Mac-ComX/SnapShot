// screens/CameraSupplScreen.js

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image,
  TouchableOpacity, 
  StyleSheet, 
  TextInput, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'; 
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useNavigation, useRoute } from '@react-navigation/native';
import { db } from '../../services/firebase';

export default function CameraSupplScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { installationID, installationName } = route.params;

  const [hasPermission, setHasPermission] = useState(null);
  const [photoUri, setPhotoUri] = useState(null);
  const [comment, setComment] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Vous devez autoriser l\'accès à la caméra.');
        navigation.goBack();
      }
    })();
  }, []);

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ouvrir la caméra.');
    }
  };

  const uploadPhoto = async () => {
    if (!photoUri) {
      Alert.alert('Aucune photo', 'Veuillez prendre une photo avant de l\'uploader.');
      return;
    }

    try {
      setUploading(true);

      const response = await fetch(photoUri);
      const blob = await response.blob();
      const storage = getStorage();
      const storageRef = ref(storage, `photos-additionnelles/${installationName}-${Date.now()}.jpg`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      await addDoc(collection(db, 'decorations', installationID, 'photos-additionnelles'), {
        imageUri: downloadURL,
        comment: comment,
        createdAt: serverTimestamp(),
      });

      Alert.alert('Succès', 'Photo sauvegardée et téléversée avec succès !');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder et téléverser la photo.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.photo} />
      ) : (
        <View style={styles.placeholder}>
          <MaterialIcons name="camera-alt" size={100} color="#ccc" />
        </View>
      )}

      <TouchableOpacity style={styles.cameraButton} onPress={takePhoto}>
        <MaterialIcons name="camera-alt" size={30} color="#fff" />
        <Text style={styles.cameraButtonText}>Prendre une photo</Text>
      </TouchableOpacity>

      {photoUri && (
        <>
          <TextInput
            style={styles.commentInput}
            placeholder="Ajouter un commentaire"
            placeholderTextColor="#999"
            value={comment}
            onChangeText={setComment}
            multiline
          />

          <TouchableOpacity style={styles.uploadButton} onPress={uploadPhoto} disabled={uploading}>
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <FontAwesome name="send" size={20} color="#fff" />
            )}
            <Text style={styles.uploadButtonText}>Téléverser la photo</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelButtonText}>Annuler</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f7f8fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: '100%',
    height: 300,
    borderRadius: 15,
    marginBottom: 20,
    resizeMode: 'cover',
  },
  placeholder: {
    width: '100%',
    height: 300,
    borderRadius: 15,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1abc9c',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    width: '100%',
    justifyContent: 'center',
  },
  cameraButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
    fontWeight: 'bold',
  },
  commentInput: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#34495e',
    marginBottom: 20,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 12,
    width: '100%',
    justifyContent: 'center',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
    fontWeight: 'bold',
  },
  cancelButton: {
    marginTop: 20,
  },
  cancelButtonText: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
