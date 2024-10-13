// hooks/usePhotos.js

import { useState, useEffect } from 'react';
import { storage, db } from '../services/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid'; // Import correct
import 'react-native-get-random-values'; // Import nécessaire pour les UUIDs

const usePhotos = (installationID, initialImageUri, initialImagePath) => {
  const [selectedImage, setSelectedImage] = useState(initialImageUri);
  const [selectedImagePath, setSelectedImagePath] = useState(initialImagePath);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  // Fonction pour extraire l'année à partir de createdAt
  const extractYear = (createdAt) => {
    // Supposons que createdAt est au format "13/10/2024, 02:49:39"
    const dateParts = createdAt.split('/');
    if (dateParts.length === 3) {
      return dateParts[2].split(',')[0]; // "2024"
    }
    return 'UnknownYear';
  };

  // Fonction pour uploader une photo principale
  const uploadMainPhoto = async (uri) => {
    if (isUploading) {
      setError('Un upload est déjà en cours.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Conversion de l'URI en blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Récupérer le document pour extraire les champs nécessaires
      const installationDocRef = doc(db, 'decorations', installationID);
      const installationDocSnapshot = await getDoc(installationDocRef);

      let address = '';
      let ville = '';
      let rue = '';
      let createdAt = '';

      if (installationDocSnapshot.exists()) {
        const data = installationDocSnapshot.data();
        address = data.address || '';
        ville = data.ville || '';
        rue = data.rue || '';
        createdAt = data.createdAt || '';
      } else {
        // Si le document n'existe pas, vous pouvez choisir de le créer ou de lever une erreur
        // Ici, nous choisissons de créer le document avec les champs par défaut
        address = 'Adresse non définie';
        ville = 'Ville non définie';
        rue = 'Rue non définie';
        createdAt = new Date().toLocaleString(); // Exemple de valeur par défaut
        await setDoc(installationDocRef, {
          installationID: installationID,
          address: address,
          ville: ville,
          rue: rue,
          createdAt: createdAt,
          // Ajoutez ici d'autres champs par défaut si nécessaire
        });
      }

      const year = extractYear(createdAt);

      const imageId = uuidv4(); // Génération correcte de l'UUID
      // Construire le chemin de stockage en utilisant année, ville, rue
      const storagePath = `decorations/${installationID}/${year}/${ville}/${rue}/${imageId}.jpg`;
      const imageRef = ref(storage, storagePath);

      // Upload de la photo
      await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(imageRef);

      // Mise à jour de l'image principale dans Firestore
      await updateDoc(installationDocRef, {
        imageUri: downloadURL,
        imagePath: imageRef.fullPath,
        createdAt: new Date(), // Mettre à jour le champ si nécessaire
      });

      setSelectedImage(downloadURL);
      setSelectedImagePath(imageRef.fullPath);
      setIsUploading(false);
    } catch (err) {
      console.error('Erreur lors de l\'upload de la photo principale :', err);
      setError(`Impossible d'uploader la photo principale : ${err.message}`);
      setIsUploading(false);
    }
  };

  // Fonction pour supprimer l'image principale
  const deleteMainPhoto = async () => {
    try {
      if (!selectedImagePath) {
        setError('Aucune image principale à supprimer.');
        return;
      }

      const imageRef = ref(storage, selectedImagePath);
      await deleteObject(imageRef);

      const installationDocRef = doc(db, 'decorations', installationID);
      await updateDoc(installationDocRef, {
        imageUri: '',
        imagePath: '',
        createdAt: new Date(), // Mettre à jour si nécessaire
      });

      setSelectedImage('');
      setSelectedImagePath('');
    } catch (err) {
      console.error('Erreur lors de la suppression de la photo principale :', err);
      setError(`Impossible de supprimer la photo principale : ${err.message}`);
    }
  };

  // Fonction pour récupérer l'image principale
  const fetchMainPhoto = async () => {
    setLoading(true);
    setError(null);
    try {
      const installationDocRef = doc(db, 'decorations', installationID);
      const docSnapshot = await getDoc(installationDocRef);
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setSelectedImage(data.imageUri || '');
        setSelectedImagePath(data.imagePath || '');
      }
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors de la récupération de la photo principale :', err);
      setError(`Impossible de récupérer la photo principale : ${err.message}`);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMainPhoto();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    selectedImage,
    selectedImagePath,
    loading,
    isUploading,
    error,
    uploadMainPhoto,
    deleteMainPhoto,
    fetchMainPhoto,
    setSelectedImage,
    setSelectedImagePath,
  };
};

export default usePhotos;
