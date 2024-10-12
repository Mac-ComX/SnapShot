import React, { useState, useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_DURATION = 60 * 60 * 1000; // 1 heure en millisecondes

const getCachedUrl = async (key) => {
  try {
    const cachedData = await AsyncStorage.getItem(key);
    if (cachedData) {
      const { url, timestamp } = JSON.parse(cachedData);
      const now = new Date().getTime();
      if (now - timestamp < CACHE_DURATION) {
        return url;
      }
    }
    return null;
  } catch (error) {
    return null;
  }
};

const cacheUrl = async (key, value) => {
  try {
    const dataToCache = {
      url: value,
      timestamp: new Date().getTime(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(dataToCache));
  } catch (error) {
    // Gérer l'erreur si nécessaire
  }
};

const PublicImage = ({ storagePath, style }) => {
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPublicImageUrl = async () => {
      try {
        if (!storagePath) {
          throw new Error('Le chemin de stockage est manquant.');
        }

        const cachedUrl = await getCachedUrl(storagePath);

        if (cachedUrl) {
          setImageUri(cachedUrl);
          setLoading(false);
        } else {
          let url;
          if (storagePath.startsWith('http')) {
            url = storagePath;
          } else {
            const storage = getStorage();
            const storageRef = ref(storage, storagePath);
            url = await getDownloadURL(storageRef);
          }

          setImageUri(url);
          await cacheUrl(storagePath, url);
          setLoading(false);
        }
      } catch (error) {
        setError(true);
        setLoading(false);
      }
    };

    fetchPublicImageUrl();
  }, [storagePath]);

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  if (error) {
    return (
      <Image
        source={{ uri: 'https://via.placeholder.com/150?text=Erreur+de+chargement' }}
        style={style}
        cachePolicy="disk"
        transition={1000}
      />
    );
  }

  return (
    <Image
      source={{ uri: imageUri }}
      style={style}
      cachePolicy="disk"
      transition={1000}
    />
  );
};

export default PublicImage;
