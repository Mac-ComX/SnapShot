import React, { useState } from 'react';
import { View, Image, Button, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { db, storage } from '../../services/firebase';  // Assure-toi d'importer correctement Firebase
import { collection, addDoc } from 'firebase/firestore';  // Pour Firestore
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';  // Pour Firebase Storage

export default function PreviewAddiScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { imageUri, mainPhotoId } = route.params;  // Récupérer l'URI de l'image et l'ID principal (mainPhotoId)

  const [uploading, setUploading] = useState(false);

  const savePhoto = async () => {
    try {
      setUploading(true);  // Indiquer que l'upload est en cours

      if (!imageUri) {
        throw new Error("Aucune photo à enregistrer");
      }

      // 1. Convertir l'image en Blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // 2. Créer une référence unique dans Firebase Storage
      const photoRef = ref(storage, `photos-additionnelles/${Date.now()}.jpg`);

      // 3. Upload du Blob dans Firebase Storage avec métadonnées
      const metadata = {
        contentType: 'image/jpeg',  // Spécifie le type MIME de l'image
      };
      const snapshot = await uploadBytes(photoRef, blob, metadata);

      // 4. Obtenir l'URL de téléchargement de la photo uploadée
      const downloadURL = await getDownloadURL(snapshot.ref);

      // 5. Enregistrer l'URL de la photo dans Firestore
      await addDoc(collection(db, 'photos-additionnelles'), {
        mainPhotoId: mainPhotoId,  // Référence à la photo principale
        imageUri: downloadURL,  // URL de l'image
        createdAt: new Date().toLocaleString(),
      });

      // 6. Message de succès
      Alert.alert("Succès", "Photo enregistrée avec succès !");
      navigation.goBack();  // Retour à l'écran précédent après l'enregistrement
    } catch (error) {
      console.error("Erreur lors de l'enregistrement :", error);
      Alert.alert('Erreur', 'Impossible d\'enregistrer la photo additionnelle.');
    } finally {
      setUploading(false);  // Réinitialise l'état d'upload
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {/* Affichage de l'image capturée */}
      {imageUri && (
        <Image source={{ uri: imageUri }} style={{ width: 300, height: 300 }} />
      )}
      {/* Bouton pour enregistrer la photo */}
      <Button title="Enregistrer la photo" onPress={savePhoto} disabled={uploading} />
    </View>
  );
}
