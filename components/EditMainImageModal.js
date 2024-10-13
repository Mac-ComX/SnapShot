// components/EditMainImageModal.js

import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'; // Utiliser MaterialCommunityIcons

const EditMainImageModal = ({ visible, onClose, onTakePhoto, onPickImage }) => {
  return (
    <Modal transparent={true} visible={visible} animationType="slide">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Modifier l'image principale</Text>
            <TouchableOpacity style={styles.modalOption} onPress={onTakePhoto}>
              <MaterialCommunityIcons name="camera-alt" size={24} color="#000" />
              <Text style={styles.modalText}>Prendre une photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalOption} onPress={onPickImage}>
              <MaterialCommunityIcons name="photo-library" size={24} color="#000" />
              <Text style={styles.modalText}>Choisir depuis la galerie</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
              <Text style={styles.modalCloseText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex:1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent:'center',
    alignItems:'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding:20,
    borderRadius:10,
    width: '80%',
  },
  modalTitle: {
    fontSize:18,
    fontWeight:'bold',
    marginBottom:10,
    textAlign:'center',
  },
  modalOption: {
    flexDirection:'row',
    alignItems:'center',
    paddingVertical:10,
  },
  modalText: {
    marginLeft:10,
    fontSize:16,
  },
  modalCloseButton: {
    marginTop:10,
    alignSelf:'flex-end',
  },
  modalCloseText: {
    color:'blue',
    fontSize:16,
  },
});

export default EditMainImageModal;
