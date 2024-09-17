import React, { useState, useEffect } from 'react';
import { View, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function CameraScreen() {
  const navigation = useNavigation();
  const [imageUri, setImageUri] = useState(null);

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission refusée", "Vous devez autoriser l'accès à la caméra.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync();
    if (!result.canceled) {
      const capturedImageUri = result.assets[0].uri;
      setImageUri(capturedImageUri);

      // Redirection vers l'écran PreviewScreen avec l'URI de l'image capturée
      navigation.navigate('PreviewScreen', {
        imageUri: capturedImageUri, // Envoi de l'URI de l'image capturée
      });
    }
  };

  useEffect(() => {
    openCamera();
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={openCamera} style={styles.cameraButton}>
        <Ionicons name="camera-outline" size={50} color="black" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 50,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});
