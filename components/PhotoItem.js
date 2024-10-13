// components/PhotoItem.js

import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const PhotoItem = ({ photo, onDelete, onView }) => {
  return (
    <View style={styles.photoContainer}>
      <TouchableOpacity onPress={() => onView(photo.imageUri)}>
        <Image source={{ uri: photo.imageUri }} style={styles.photo} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => {
          Alert.alert(
            'Confirmation',
            'Êtes-vous sûr de vouloir supprimer cette photo ?',
            [
              { text: 'Annuler', style: 'cancel' },
              { text: 'Supprimer', style: 'destructive', onPress: () => onDelete(photo, false) },
            ],
            { cancelable: true }
          );
        }}
      >
        <MaterialIcons name="delete" size={24} color="red" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  photoContainer: {
    position: 'relative',
    marginBottom: 10,
    marginRight: 10,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  deleteButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 15,
    padding: 2,
  },
});

export default PhotoItem;
