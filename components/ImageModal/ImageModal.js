import React from 'react';
import { Modal, View, Image, Text, Button } from 'react-native';
import styles from './styles';

export default function ImageModal({ visible, onClose, imageUri, title, description }) {
  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Image source={{ uri: imageUri }} style={styles.modalImage} />
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalDescription}>{description}</Text>
          <Button title="Fermer" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}
