// components/AddPhotoModal.js

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, StyleSheet, Image, Alert, TouchableWithoutFeedback } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const AddPhotoModal = ({ visible, onClose, capturedPhotoUri, onCaptureNewPhoto, comment, setComment, onSavePhoto }) => {
  const [localComment, setLocalComment] = useState(comment);

  const handleSave = () => {
    onSavePhoto();
  };

  return (
    <Modal transparent={true} visible={visible} animationType="slide">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ajouter une photo de maintenance</Text>
            {capturedPhotoUri ? (
              <Image source={{ uri: capturedPhotoUri }} style={styles.previewImage} />
            ) : null}
            <TextInput
              style={styles.commentInput}
              value={localComment}
              onChangeText={setLocalComment}
              placeholder="Ajouter un commentaire (optionnel)"
              placeholderTextColor="#7f8c8d"
              multiline
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <MaterialIcons name="save" size={24} color="#fff" />
              <Text style={styles.saveButtonText}>Sauvegarder</Text>
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
    width: '90%',
    alignItems:'center',
  },
  modalTitle: {
    fontSize:18,
    fontWeight:'bold',
    marginBottom:10,
    textAlign:'center',
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius:10,
    marginBottom:10,
  },
  commentInput: {
    width: '100%',
    height: 80,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius:8,
    padding:10,
    marginBottom:10,
    textAlignVertical: 'top',
  },
  saveButton: {
    flexDirection:'row',
    alignItems:'center',
    backgroundColor:'#3498db',
    padding:10,
    borderRadius:8,
    marginBottom:10,
    width: '100%',
    justifyContent:'center',
  },
  saveButtonText: {
    color:'#fff',
    marginLeft:10,
    fontSize:16,
  },
  modalCloseButton: {
    marginTop:10,
  },
  modalCloseText: {
    color:'blue',
    fontSize:16,
  },
});

export default AddPhotoModal;
