import React, { useState, useEffect } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Définir la durée de validité du cache (par exemple, 1 heure)
const CACHE_DURATION = 60 * 60 * 1000; // 1 heure en millisecondes

// Fonction pour récupérer une valeur depuis AsyncStorage avec timestamp
const getCachedUrl = async (key) => {
  try {
    console.log(`[Cache] Tentative de récupération de l'URL depuis le cache pour le key: ${key}`);
    const cachedData = await AsyncStorage.getItem(key);
    if (cachedData) {
      const { url, timestamp } = JSON.parse(cachedData);
      const now = new Date().getTime();
      if (now - timestamp < CACHE_DURATION) {
        console.log(`[Cache] URL valide trouvée dans le cache pour le key: ${key}`);
        return url;
      } else {
        console.log(`[Cache] URL expirée dans le cache pour le key: ${key}`);
        return null;
      }
    } else {
      console.log(`[Cache] Aucune URL trouvée dans le cache pour le key: ${key}`);
      return null;
    }
  } catch (error) {
    console.error(`[Cache] Erreur lors de la récupération depuis AsyncStorage pour le key: ${key}`, error);
    return null;
  }
};

// Fonction pour sauvegarder une valeur dans AsyncStorage avec timestamp
const cacheUrl = async (key, value) => {
  try {
    console.log(`[Cache] Sauvegarde de l'URL dans le cache pour le key: ${key}`);
    const dataToCache = {
      url: value,
      timestamp: new Date().getTime(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(dataToCache));
    console.log(`[Cache] URL sauvegardée avec succès dans le cache pour le key: ${key}`);
  } catch (error) {
    console.error(`[Cache] Erreur lors de la sauvegarde dans AsyncStorage pour le key: ${key}`, error);
  }
};

const PublicImage = ({ storagePath, style }) => {
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPublicImageUrl = async () => {
      console.log(`[PublicImage] Début du fetchPublicImageUrl pour storagePath: ${storagePath}`);
      try {
        if (!storagePath) {
          throw new Error('Le chemin de stockage est manquant.');
        }

        // Étape 1: Tenter de récupérer l'URL depuis le cache
        console.log(`[PublicImage] Tente de récupérer l'URL depuis le cache pour storagePath: ${storagePath}`);
        const cachedUrl = await getCachedUrl(storagePath);

        if (cachedUrl) {
          // URL trouvée dans le cache et valide
          console.log(`[PublicImage] URL récupérée depuis le cache: ${cachedUrl}`);
          setImageUri(cachedUrl);
          setLoading(false);
        } else {
          // URL non trouvée ou expirée dans le cache, besoin de la récupérer de Firebase
          console.log(`[PublicImage] URL non trouvée ou expirée dans le cache. Vérification si storagePath est une URL publique.`);

          let url;
          if (storagePath.startsWith('http') || storagePath.startsWith('https')) {
            // storagePath est une URL publique
            console.log(`[PublicImage] storagePath est une URL publique: ${storagePath}`);
            url = storagePath;
          } else {
            // storagePath n'est pas une URL publique, récupérer l'URL via Firebase Storage
            console.log(`[PublicImage] storagePath n'est pas une URL publique. Récupération de l'URL via Firebase Storage.`);
            const storage = getStorage();
            const storageRef = ref(storage, storagePath);
            console.log(`[PublicImage] Récupération de l'URL de téléchargement depuis Firebase Storage pour storagePath: ${storagePath}`);
            url = await getDownloadURL(storageRef);
            console.log(`[PublicImage] URL de téléchargement récupérée: ${url}`);
          }

          setImageUri(url);
          console.log(`[PublicImage] Sauvegarde de l'URL dans le cache.`);
          await cacheUrl(storagePath, url);  // Sauvegarde de l'URL dans AsyncStorage avec timestamp
          setLoading(false);
          console.log(`[PublicImage] ImageUri mise à jour et chargement terminé pour storagePath: ${storagePath}`);
        }
      } catch (error) {
        console.error(`[PublicImage] Erreur lors de la récupération de l'URL publique pour storagePath: ${storagePath}`, error);
        setError(true);
        setLoading(false);
      }
    };

    fetchPublicImageUrl();
  }, [storagePath]);

  if (loading) {
    console.log(`[PublicImage] Chargement de l'image en cours pour storagePath: ${storagePath}`);
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  if (error) {
    console.log(`[PublicImage] Erreur de chargement de l'image pour storagePath: ${storagePath}`);
    return (
      <Image
        source={{ uri: 'https://via.placeholder.com/150?text=Erreur+de+chargement' }} // Placeholder via URL publique en cas d'erreur
        style={style}
        cachePolicy="disk"
        transition={1000}
      />
    );
  }

  console.log(`[PublicImage] Affichage de l'image avec imageUri: ${imageUri}`);
  return (
    <Image
      source={{ uri: imageUri }}
      style={style}
      cachePolicy="disk" // Permet de stocker l'image sur le disque
      transition={1000} // Transition lors du chargement de l'image
    />
  );
};

export default PublicImage;

