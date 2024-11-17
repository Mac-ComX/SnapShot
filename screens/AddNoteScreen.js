// ./screens/AddNoteScreen.js

import { MaterialIcons } from '@expo/vector-icons';
import { addDoc, collection } from 'firebase/firestore';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback
} from 'react-native';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { db } from '../services/firebase';

export default function AddNoteScreen({ navigation }) {
  const editor = useRef(); // Référence à l'éditeur de texte riche
  const [title, setTitle] = useState(''); // Titre de la note
  const [content, setContent] = useState(''); // Contenu de la note
  const [isSaving, setIsSaving] = useState(false); // Indicateur de sauvegarde

  // Fonction pour sauvegarder la note
  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un titre et du contenu');
      return;
    }
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'notes'), {
        title: title.trim(),
        content: content.trim(),
        createdAt: new Date(),
      });
      Alert.alert('Succès', 'Note enregistrée avec succès', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'enregistrer la note');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >

          {/* Barre d'outils de l'éditeur pour les actions (gras, italique, etc.) */}
          <RichToolbar
            editor={editor}
            actions={[
              actions.setBold,
              actions.setItalic,
              actions.insertBulletsList,
              actions.insertOrderedList,
              actions.undo,
              actions.redo,
            ]}
            iconTint="#000"
            selectedIconTint="#2095F2"
            style={styles.richToolbar}
          />

          {/* Input pour le titre de la note */}
          <TextInput
            style={styles.input}
            placeholder="Titre de la note"
            value={title}
            onChangeText={setTitle}
            returnKeyType="done"
          />

          {/* Éditeur de texte riche */}
          <RichEditor
            ref={editor}
            placeholder="Commencez à écrire votre note..."
            onChange={(text) => setContent(text)} // Récupère le contenu de l'éditeur
            style={styles.richEditor}
            initialHeight={300}
            androidHardwareAccelerationDisabled={false} // Assurez-vous que l'accélération matérielle est activée
            // Ajouter un attribut pour fermer le clavier lorsque l'éditeur perd le focus
            onBlur={Keyboard.dismiss}
          />

          {/* Bouton pour sauvegarder la note */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons name="save" size={24} color="#fff" />
                <Text style={styles.saveButtonText}>Sauvegarder</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1, // Utiliser flexGrow pour ScrollView
    padding: 20,
    paddingTop: 0,
    backgroundColor: '#f2f4f6',
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  richEditor: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#fff',
    minHeight: 300,
  },
  richToolbar: {
    backgroundColor: '#f2f4f6',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    marginVertical: 10,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#3498db',
    borderRadius: 10,
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
