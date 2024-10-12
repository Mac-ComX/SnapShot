import React, { useState } from 'react';
import { View, Image, Button, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';

export default function CameraPreview() {
  const [capturedPhotoUri, setCapturedPhotoUri] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const navigation = useNavigation();

  // Demander les permissions caméra à l'ouverture du composant
  React.useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Vous devez autoriser l\'accès à la caméra.');
      }
    })();
  }, []);

  // Ouvrir la caméra et capturer une photo
  const openCamera = async () => {
    if (!hasPermission) {
      Alert.alert('Permission refusée', 'Vous devez autoriser l\'accès à la caméra.');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      setCapturedPhotoUri(result.assets[0].uri);
    } else {
      Alert.alert('Action annulée');
    }
  };

  // Sauvegarder ou envoyer la photo capturée
  const savePhoto = () => {
    if (capturedPhotoUri) {
      // Passer l'URI de la photo capturée à l'écran précédent
      navigation.navigate('DetailsScreen', { capturedPhotoUri });
    } else {
      Alert.alert('Erreur', 'Aucune photo capturée');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button title="Ouvrir la caméra" onPress={openCamera} />

      {capturedPhotoUri && (
        <View style={{ marginTop: 20 }}>
          <Image
            source={{ uri: capturedPhotoUri }}
            style={{ width: 300, height: 400 }}
          />
          <Button title="Utiliser cette photo" onPress={savePhoto} />
        </View>
      )}
    </View>
  );
}
