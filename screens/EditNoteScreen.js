// ./screens/EditNoteScreen.js

import React, { useState, useRef } from 'react';
import { 
  View, 
  Alert, 
  StyleSheet, 
  ScrollView, 
  Dimensions, 
  Linking,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { MaterialIcons } from '@expo/vector-icons';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function EditNoteScreen({ route, navigation }) {
  const { note } = route.params; // Note passée en paramètre
  const [webViewHeight, setWebViewHeight] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const richText = useRef(); // Référence à l'éditeur de texte riche

  const { width } = Dimensions.get('window');
  const PDF_WIDTH = width - 40; // 20 padding de chaque côté

  const htmlContent = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0, minimum-scale=1.0, user-scalable=yes">
        <style>
          body {
            font-size: 18px;
            color: #333;
            padding: 20px;
            background-color: #fff;
            line-height: 1.6;
          }
          h1, h2 {
            color: #2c3e50;
          }
          a {
            color: #3498db;
          }
          p {
            margin-bottom: 10px;
          }
        </style>
        <script>
          function sendHeight() {
            const height = document.body.scrollHeight;
            window.ReactNativeWebView.postMessage(height);
          }
          window.onload = sendHeight;
          window.onresize = sendHeight;
        </script>
      </head>
      <body>
        <h2>${note.title}</h2>
        ${note.content}
      </body>
    </html>
  `;

  const handleWebViewMessage = (event) => {
    const height = Number(event.nativeEvent.data);
    if (height) {
      setWebViewHeight(height);
    }
  };

  const handleEditPress = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (title.trim() === '' || content.trim() === '') {
      Alert.alert('Erreur', 'Le titre et le contenu ne peuvent pas être vides.');
      return;
    }

    try {
      const noteRef = doc(db, 'notes', note.id);
      await updateDoc(noteRef, {
        title,
        content,
      });
      Alert.alert('Succès', 'Note mise à jour avec succès.');
      setIsEditing(false);
      navigation.goBack();
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la note:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour la note.');
    }
  };

  const handleCancelEdit = () => {
    setTitle(note.title);
    setContent(note.content);
    setIsEditing(false);
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
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Conteneur de style PDF */}
          <View style={styles.pdfContainer}>
            {!isEditing ? (
              <>
                {/* WebView pour afficher le contenu HTML en lecture seule */}
                <WebView
                  originWhitelist={['*']}
                  source={{ html: htmlContent }}
                  style={[styles.webview, { height: webViewHeight || 1000 }]} // Hauteur dynamique
                  onMessage={handleWebViewMessage}
                  onShouldStartLoadWithRequest={(event) => {
                    // Gérer les liens cliquables
                    if (event.url !== 'about:blank') {
                      Linking.openURL(event.url).catch(err => console.error("Couldn't load page", err));
                      return false;
                    }
                    return true;
                  }}
                  scalesPageToFit={true} // Activer le zoom
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  startInLoadingState={true}
                  renderLoading={() => (
                    <ActivityIndicator 
                      color="#3498db" 
                      size="large" 
                      style={styles.loadingIndicator} 
                    />
                  )}
                />
                {/* Bouton Modifier intégré */}
                <TouchableOpacity style={styles.editButton} onPress={handleEditPress}>
                  <MaterialIcons name="edit" size={24} color="#fff" />
                  <Text style={styles.editButtonText}>Modifier</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>

<RichToolbar
                  editor={richText}
                  actions={[
                    actions.fontSize,
                    actions.setBold,
                    actions.setItalic,
                    actions.insertBulletsList,
                    actions.insertOrderedList,
                    actions.setStrikethrough,
                  ]}
                  iconTint="#000"
                  selectedIconTint="#3498db"
                  style={styles.richToolbar}
                  onPressAddImage={() => { /* Si vous avez une fonctionnalité d'ajout d'image */ }}
                />

                {/* Champ de saisie pour le titre */}
                {/* <Text style={styles.editTitle}>Titre</Text> */}
                <TextInput
                  style={styles.titleInput}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Titre"
                  returnKeyType="done"
                  onBlur={Keyboard.dismiss}
                />

                {/* Éditeur de texte riche pour le contenu */}
                <Text style={styles.editTitle}>Contenu</Text>
                <RichEditor
                  ref={richText}
                  initialContentHTML={content}
                  placeholder="Commencez à écrire votre note..."
                  onChange={(text) => setContent(text)}
                  style={styles.richEditor}
                  editorInitializedCallback={() => {
                    richText.current?.registerToolbar(function (items) {
                      // Callback for toolbar items, if needed
                    });
                  }}
                  onBlur={Keyboard.dismiss}
                />                

                {/* Boutons Sauvegarder et Annuler */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <MaterialIcons name="save" size={24} color="#fff" />
                    <Text style={styles.saveButtonText}>Sauvegarder</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelButton} onPress={handleCancelEdit}>
                    <MaterialIcons name="cancel" size={24} color="#fff" />
                    <Text style={styles.cancelButtonText}>Annuler</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#f2f4f6',
    padding: 20,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f2f4f6',
  },
  container: {
    
    padding: 20,
    flexGrow: 1,
    alignItems: 'center',
  },
  pdfContainer: {
    width: Dimensions.get('window').width - 40, // 20 padding de chaque côté
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
    marginBottom: 20,
    position: 'relative', // Pour positionner les boutons
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingIndicator: {
    position: 'absolute',
    top: Dimensions.get('window').height / 2 - 20,
    left: Dimensions.get('window').width / 2 - 20,
  },
  editButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  editButtonText: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  editTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  titleInput: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginBottom: 10,
    paddingVertical: 5,
  },
  richEditor: {
    minHeight: 300,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  richToolbar: {
    backgroundColor: '#f2f4f6',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    marginVertical: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#27ae60',
    borderRadius: 10,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  saveButtonText: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  cancelButton: {
    flexDirection: 'row',
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  cancelButtonText: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: 'bold',
  },
});
