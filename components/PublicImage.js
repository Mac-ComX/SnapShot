import React, { useState, useEffect, useCallback } from 'react';
import { ActivityIndicator, View, Image as RNImage, Text, TouchableOpacity, Alert } from 'react-native';
import { Image } from 'expo-image'; 
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

// Constantes
const CACHE_DIR = FileSystem.cacheDirectory + 'images/';
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50 Mo
const CACHE_EXPIRATION_TIME = 24 * 60 * 60 * 1000; // Cache expire après 24h
const LRU_CACHE_SIZE = 100; // Nombre d'éléments dans le cache LRU

// Cache LRU optimisé avec une Map
let imageCache = new Map();

const getCacheFilePath = (key, fileExtension = 'jpg') => `${CACHE_DIR}${encodeURIComponent(key)}.${fileExtension}`;

// Gestion du cache (taille et nettoyage)
const manageCache = async () => {
  try {
    const cacheInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (cacheInfo.exists) {
      const files = await FileSystem.readDirectoryAsync(CACHE_DIR);
      const fileStats = await Promise.all(
        files.map(async (file) => {
          const fileUri = `${CACHE_DIR}${file}`;
          const fileInfo = await FileSystem.getInfoAsync(fileUri);
          return { file, fileInfo };
        })
      );

      const totalSize = fileStats.reduce((sum, { fileInfo }) => sum + (fileInfo.size || 0), 0);

      // Si le cache dépasse la taille maximale, nettoyer
      if (totalSize > MAX_CACHE_SIZE) {
        const now = Date.now();
        const filesToDelete = fileStats
          .sort((a, b) => {
            const ageA = now - a.fileInfo.modificationTime;
            const ageB = now - b.fileInfo.modificationTime;
            const sizeA = a.fileInfo.size;
            const sizeB = b.fileInfo.size;
            return (ageA + sizeA) - (ageB + sizeB); 
          })
          .slice(0, files.length - LRU_CACHE_SIZE); 

        // Suppression des fichiers
        await Promise.all(
          filesToDelete.map(({ file }) => FileSystem.deleteAsync(getCacheFilePath(file), { idempotent: true }))
        );
        
        // Nettoyer le cache LRU
        filesToDelete.forEach(({ file }) => imageCache.delete(file));
      }

      // Nettoyage explicite du cache LRU si le nombre d'éléments dépasse la limite
      if (imageCache.size > LRU_CACHE_SIZE) {
        const keysToRemove = [...imageCache.keys()].slice(0, imageCache.size - LRU_CACHE_SIZE);
        keysToRemove.forEach(key => imageCache.delete(key));
      }
    }
  } catch (error) {
    console.error('Erreur lors de la gestion du cache :', error);
  }
};

// Vérifier si une image est dans le cache
const getCachedImage = async (key, fileExtension) => {
  const cachedUri = imageCache.get(key);
  if (cachedUri) return cachedUri;

  const fileUri = getCacheFilePath(key, fileExtension);
  const fileInfo = await FileSystem.getInfoAsync(fileUri);
  if (fileInfo.exists && Date.now() - fileInfo.modificationTime < CACHE_EXPIRATION_TIME) {
    imageCache.set(key, fileUri);
    return fileUri;
  }
  return null;
};

// Télécharger, redimensionner et mettre en cache une image
const cacheImage = async (key, uri, resizeOptions, fileExtension = 'jpg', compression = 0.6) => {
  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: resizeOptions }],
      { compress: compression, format: fileExtension === 'png' ? ImageManipulator.SaveFormat.PNG : ImageManipulator.SaveFormat.JPEG }
    );
    const fileUri = getCacheFilePath(key, fileExtension);

    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    await FileSystem.copyAsync({ from: manipResult.uri, to: fileUri });

    // Suppression du fichier temporaire après le cache
    await FileSystem.deleteAsync(manipResult.uri, { idempotent: true });

    imageCache.set(key, fileUri); // Mise à jour du cache
    return fileUri;
  } catch (error) {
    console.error('Erreur lors du redimensionnement ou du cache de l\'image :', error);
    return null;
  }
};

// Réessayer un téléchargement avec un backoff exponentiel
const retryDownload = async (uri, retries = 5, delay = 1000) => {
  try {
    return await getDownloadURL(ref(getStorage(), uri));
  } catch (error) {
    if (retries <= 0) {
      throw new Error('Échec du téléchargement après plusieurs tentatives.');
    }
    const newDelay = delay * 2;
    console.warn(`Téléchargement échoué, nouvelle tentative dans ${newDelay / 1000}s... (${retries} restantes)`);
    await new Promise(resolve => setTimeout(resolve, newDelay));
    return retryDownload(uri, retries - 1, newDelay);
  }
};

// Affichage d'une alerte en cas d'échec de téléchargement prolongé
const showDownloadErrorAlert = () => {
  Alert.alert(
    "Erreur de téléchargement",
    "L'image n'a pas pu être téléchargée après plusieurs tentatives. Veuillez vérifier votre connexion ou réessayer plus tard.",
    [{ text: "OK" }]
  );
};

// Hook personnalisé pour gérer le cache des images
const useCachedImage = (storagePath, resizeWidth, resizeHeight, fileExtension = 'jpg', compression = 0.6) => {
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAndCacheImage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!storagePath) throw new Error('Le chemin de stockage est invalide.');

      // Vérification du cache
      const cachedUri = await getCachedImage(storagePath, fileExtension);
      if (cachedUri) {
        setImageUri(cachedUri);
        return;
      }

      const uri = storagePath.startsWith('http') ? storagePath : await retryDownload(storagePath);

      const resizeOptions = { width: resizeWidth, height: resizeHeight };
      const fileUri = await cacheImage(storagePath, uri, resizeOptions, fileExtension, compression);

      if (!fileUri) throw new Error('Erreur lors de la mise en cache de l\'image.');

      setImageUri(fileUri);
    } catch (err) {
      setError(err.message);
      setImageUri(null);
      showDownloadErrorAlert(); // Afficher l'alerte d'échec de téléchargement
    } finally {
      setLoading(false);
    }
  }, [storagePath, resizeWidth, resizeHeight, fileExtension, compression]);

  useEffect(() => {
    fetchAndCacheImage();
  }, [fetchAndCacheImage]);

  return { imageUri, loading, error, fetchAndCacheImage };
};

// Composant PublicImage
const PublicImage = ({ storagePath, style, resizeWidth = 500, resizeHeight, fileExtension = 'jpg', compression = 0.6 }) => {
  const { imageUri, loading, error, fetchAndCacheImage } = useCachedImage(storagePath, resizeWidth, resizeHeight, fileExtension, compression);

  if (loading) {
    return (
      <View style={[style, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="small" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[style, { justifyContent: 'center', alignItems: 'center' }]}>
        <RNImage source={require('../assets/logoUser.jpg')} style={style} />
        <Text style={{ color: 'red', marginTop: 8 }}>Erreur : {error}</Text>
        <TouchableOpacity onPress={fetchAndCacheImage}>
          <Text style={{ color: 'blue', marginTop: 8 }}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return imageUri ? (
    <Image source={{ uri: imageUri }} style={style} cachePolicy="disk" transition={1000} />
  ) : (
    <RNImage source={require('../assets/logoUser.jpg')} style={style} />
  );
};

export default React.memo(PublicImage);
