// screens/DetailsScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Modal, 
  Alert, 
  ScrollView, 
  Pressable, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform, 
  RefreshControl,
  findNodeHandle,
  UIManager
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, Entypo, FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';  
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'; 
import { 
  addDoc, 
  collection, 
  getDocs, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  getDoc, 
  query, 
  where, 
  arrayUnion 
} from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { db } from '../../services/firebase';
import { Keyboard, TouchableWithoutFeedback } from 'react-native';
import PublicImage from '../../components/PublicImage';

export default function DetailsScreen({ route }) {
  const { photo } = route.params;
  const [capturedPhotoUri, setCapturedPhotoUri] = useState(null);
  const [additionalPhotos, setAdditionalPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [comment, setComment] = useState(photo.comment || '');
  const [commentAdditional, setCommentAdditional] = useState('');
  const [status, setStatus] = useState(photo.installationStatus || 'Installée');
  const [etat, setEtat] = useState(photo.functionalityStatus || 'Fonctionnelle');
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [isEditingEtat, setIsEditingEtat] = useState(false);
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [isModified, setIsModified] = useState(false);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false); 
  const scrollViewRef = useRef();
  const commentInputRef = useRef();
  const commentAdditionalInputRef = useRef();
  const navigation = useNavigation();

  // Variables d'état pour les modaux
  const [isAdditionalPhotoModalVisible, setIsAdditionalPhotoModalVisible] = useState(false);
  const [selectedAdditionalPhoto, setSelectedAdditionalPhoto] = useState(null);
  const [isMainImageFullScreen, setIsMainImageFullScreen] = useState(false);

  useEffect(() => {
    console.log('Photo data:', photo); // Pour débogage
    fetchAdditionalPhotos();
  }, [photo.installationID]);

  const fetchAdditionalPhotos = async () => {
    try {
      const collectionRef = collection(doc(db, 'decorations', photo.installationID), 'photos-additionnelles');
      const querySnapshot = await getDocs(collectionRef);
      const photos = querySnapshot.docs.map((doc) => doc.data());
      setAdditionalPhotos(photos);
      setLoading(false);
    } catch (err) {
      setError('Erreur lors de la récupération des photos');
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAdditionalPhotos();
    setRefreshing(false);
  };

  // Fonction pour obtenir l'adresse correctement
  const getAddress = () => {
    const { address } = photo;
    return address && address.trim() !== "" ? address : "Adresse non disponible";
  };

  const saveUpdates = async () => {
    try {
      const installationDoc = doc(db, 'decorations', photo.id);
      const docSnapshot = await getDoc(installationDoc);

      if (!docSnapshot.exists()) {
        Alert.alert('Erreur', 'Le document n\'existe pas.');
        return;
      }

      const oldComment = docSnapshot.data().comment || '';
      let oldCommentHistory = docSnapshot.data().commentHistory || [];

      // Modification pour éviter les doublons de commentaires
      if (oldComment && oldComment !== comment) {
        oldCommentHistory = [...oldCommentHistory, {
          comment: oldComment,
          date: new Date().toISOString(),
        }];
      }

      const updatedAddress = getAddress(); // Utilisation de la fonction getAddress

      await updateDoc(installationDoc, {
        installationStatus: status, 
        functionalityStatus: etat,
        comment: comment,
        commentHistory: oldCommentHistory,
        address: updatedAddress, // Mise à jour de l'adresse
      });

      const q = query(collection(db, 'journalsMaint'), where('installationID', '==', photo.installationID));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const existingDoc = querySnapshot.docs[0];
        await updateDoc(existingDoc.ref, {
          status: status,
          etat: etat,
          comment: comment,
          modificationDate: serverTimestamp(),
          photos: arrayUnion(photo.imageUri, ...additionalPhotos.map(p => p.imageUri)),
          commentHistory: oldCommentHistory,
          address: updatedAddress, // Mise à jour de l'adresse
        });
      } else {
        await addDoc(collection(db, 'journalsMaint'), {
          installationID: photo.installationID,
          installationName: photo.installationName,
          status: status,
          etat: etat,
          comment: comment,
          modificationDate: serverTimestamp(),
          photos: [photo.imageUri, ...additionalPhotos.map(p => p.imageUri)],
          commentHistory: oldCommentHistory,
          address: updatedAddress, // Mise à jour de l'adresse
        });
      }
      
      Alert.alert('Succès', 'Modifications sauvegardées avec succès !');
      setIsEditingStatus(false);
      setIsEditingEtat(false);
      setIsEditingComment(false);
      setIsModified(false);
    } catch (error) {
      Alert.alert('Erreur', `Impossible de sauvegarder les modifications : ${error.message}`);
    }
  };

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    setIsModified(true); 
  };

  const handleEtatChange = (newEtat) => {
    setEtat(newEtat);
    setIsModified(true); 
  };

  const handleCommentChange = (newComment) => {
    setComment(newComment);
    setIsModified(true); 
  };

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission refusée', 'Vous devez autoriser l\'accès à la caméra.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync();
    if (!result.canceled) {
      setCapturedPhotoUri(result.assets[0].uri);
      setModalVisible(true);
    }
  };

  const saveAndUploadPhoto = async () => {
    if (isUploading) return;

    try {
      setIsUploading(true);
      const installationName = photo.installationName;
      const localUri = `${FileSystem.documentDirectory}${installationName}_photo.jpg`;
      await FileSystem.copyAsync({
        from: capturedPhotoUri,
        to: localUri,
      });

      const response = await fetch(capturedPhotoUri);
      const blob = await response.blob();
      const storage = getStorage();
      const storageRef = ref(storage, `photos-additionnelles/${installationName}-${Date.now()}.jpg`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      await addDoc(collection(db, 'decorations', photo.installationID, 'photos-additionnelles'), {
        imageUri: downloadURL,
        localImageUri: localUri,
        comment: commentAdditional,
        createdAt: serverTimestamp(), // Utiliser serverTimestamp pour une meilleure précision
      });

      Alert.alert('Succès', 'Photo sauvegardée et téléversée avec succès !');
      setModalVisible(false);
      fetchAdditionalPhotos(); 
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder et téléverser la photo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCommentFocus = () => {
    const scrollResponder = scrollViewRef.current.getScrollResponder();
    const nodeHandle = findNodeHandle(commentInputRef.current);
    if (nodeHandle) {
      UIManager.measureLayout(
        nodeHandle,
        findNodeHandle(scrollViewRef.current),
        () => {},
        (x, y, width, height) => {
          scrollResponder.scrollResponderScrollNativeHandleToKeyboard(
            nodeHandle,
            100,
            true
          );
        }
      );
    }
  };

  // Fonction pour gérer le clic sur l'adresse
  const handleAddressPress = () => {
    const { latitude, longitude } = photo;
    if (latitude && longitude) {
      navigation.navigate('MapScreen', {
        targetLatitude: latitude,
        targetLongitude: longitude,
        targetPhotoId: photo.id,
      });
    } else {
      Alert.alert('Erreur', 'Coordonnées géographiques non disponibles pour cette adresse.');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 80}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        <View style={styles.container}>
          <TouchableOpacity onPress={() => setIsMainImageFullScreen(true)}>
            <PublicImage 
              storagePath={photo.imageUri}
              style={styles.largePhoto}
            />
          </TouchableOpacity>
          <Text style={styles.title}>{photo.installationName}</Text> 
          <View style={styles.infoContainer}>
            <MaterialIcons name="location-on" size={24} color="#3498db" />
            <View style={styles.textContainer}>
              <Text style={styles.Prebold}>Adresse :</Text>
              <Text style={styles.metadata} numberOfLines={2} ellipsizeMode="tail">
                {photo.address || "Non disponible"}
              </Text>
              {/* Bouton "Voir sur la carte !" avec icône */}
              <TouchableOpacity style={styles.mapButton} onPress={handleAddressPress}>
                <MaterialIcons name="map" size={20} color="#fff" />
                <Text style={styles.mapButtonText}>Voir sur la carte !</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.infoContainer}>
            <MaterialIcons name="calendar-today" size={24} color="#3498db" />
            <Text style={styles.metadata}>
              <Text style={styles.Prebold}> Date : </Text>{formatDate(photo.createdAt)}
            </Text>
          </View>
          <View style={styles.infoContainer}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={24} color="#f1c40f" />
            <Text style={styles.metadata}>
              <Text style={styles.Prebold}> Type : </Text>{photo.installationType || "Non disponible"}
            </Text>
          </View>
          <View style={styles.infoContainer}>
            <MaterialIcons name="door-sliding" size={24} color="#1abc9c" />
            <Text style={styles.metadata}>
              <Text style={styles.Prebold}> Armoire : </Text>{photo.armoire || "Non disponible"}
            </Text>
          </View>
          <View style={styles.infoContainer}>
            <MaterialIcons name="verified" size={24} color={status === 'Installée' ? '#2ecc71' : '#e74c3c'} />
            <Text style={styles.Prebold}> Statut : </Text>
            <TouchableOpacity onPress={() => setIsEditingStatus(true)}>
              <Text style={{ color: status === 'Installée' || status === 'Fonctionnelle' ? '#2ecc71' : '#e74c3c' }}>
                {status}
              </Text>
            </TouchableOpacity>
            <Modal visible={isEditingStatus} transparent={true} animationType="fade">
              <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Changer le statut</Text>
                    <TouchableOpacity
                      style={[styles.modalOption, status === 'Installée' && styles.optionActive]}
                      onPress={() => { handleStatusChange('Installée'); setIsEditingStatus(false); }}
                    >
                      <Text style={styles.modalText}>Installée</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalOption, status === 'Non installée' && styles.optionActive]}
                      onPress={() => { handleStatusChange('Non installée'); setIsEditingStatus(false); }}
                    >
                      <Text style={styles.modalText}>Non installée</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setIsEditingStatus(false)} style={styles.modalCloseButton}>
                      <Text style={styles.modalCloseText}>Annuler</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          </View>
          <View style={styles.infoContainer}>
            <MaterialIcons name="report-problem" size={24} color={etat === 'Fonctionnelle' ? '#2ecc71' : '#e74c3c'} />
            <Text style={styles.Prebold}> État : </Text>
            <TouchableOpacity onPress={() => setIsEditingEtat(true)}>
              <Text style={{ color: etat === 'Fonctionnelle' ? '#2ecc71' : '#e74c3c' }}>
                {etat}
              </Text>
            </TouchableOpacity>
            <Modal visible={isEditingEtat} transparent={true} animationType="fade">
              <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Changer l'état</Text>
                    <TouchableOpacity
                      style={[styles.modalOption, etat === 'Fonctionnelle' && styles.optionActive]}
                      onPress={() => { handleEtatChange('Fonctionnelle'); setIsEditingEtat(false); }}
                    >
                      <Text style={styles.modalText}>Fonctionnelle</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalOption, etat === 'En panne' && styles.optionActive]}
                      onPress={() => { handleEtatChange('En panne'); setIsEditingEtat(false); }}
                    >
                      <Text style={styles.modalText}>En panne</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setIsEditingEtat(false)} style={styles.modalCloseButton}>
                      <Text style={styles.modalCloseText}>Annuler</Text>
                    </TouchableOpacity> 
                  </View>
                </View>
              </View>
            </Modal>
          </View>
          <View style={styles.infoContainer}>
            <MaterialCommunityIcons name="comment-text" size={24} color="#34495e" />
            <View style={styles.commentSection}>
              <Text style={styles.Prebold}> Information : </Text>
              {isEditingComment ? (
                <View style={styles.commentInputContainer}>
                  <TextInput
                    ref={commentInputRef}
                    style={[styles.commentInput, styles.commentInputActive]}
                    value={comment}
                    onChangeText={handleCommentChange}
                    placeholder="Modifier le commentaire"
                    placeholderTextColor="#7f8c8d"
                    multiline
                    onFocus={handleCommentFocus}
                  />
                </View>
              ) : (
                <TouchableOpacity onPress={() => setIsEditingComment(true)}>
                  <Text style={styles.commentText}>{comment}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <TouchableOpacity style={styles.button} onPress={openCamera}>
            <MaterialIcons name="camera-alt" size={24} color="#fff" style={styles.iconStyle} />
            <Text style={styles.buttonText}>Ajouter une photo de maintenance</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Photos Additionnelles :</Text>
          {loading ? (
            <Text>Chargement des photos...</Text>
          ) : (
            <FlatList
              data={additionalPhotos}
              keyExtractor={(item, index) => index.toString()}
              numColumns={3}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => {
                  setSelectedAdditionalPhoto(item);
                  setIsAdditionalPhotoModalVisible(true);
                }}>
                  <PublicImage 
                    storagePath={item.imageUri}
                    style={styles.additionalPhoto}
                  />
                </TouchableOpacity>
              )}
              scrollEnabled={false}
            />
          )}
          {error && <Text style={styles.errorText}>{error}</Text>}
          {isAdditionalPhotoModalVisible && selectedAdditionalPhoto && (
            <Modal transparent={true} visible={isAdditionalPhotoModalVisible} animationType="fade">
              <View style={styles.fullscreenModalOverlay}>
                <TouchableOpacity style={styles.fullscreenModalClose} onPress={() => setIsAdditionalPhotoModalVisible(false)}>
                  <MaterialIcons name="close" size={30} color="#fff" />
                </TouchableOpacity>
                <View style={styles.fullscreenModalContent}>
                  <Image source={{ uri: selectedAdditionalPhoto.imageUri }} style={styles.fullscreenImage} />
                  {selectedAdditionalPhoto.comment ? (
                    <View style={styles.fullscreenCommentContainer}>
                      <Text style={styles.fullscreenComment}>{selectedAdditionalPhoto.comment}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </Modal>
          )}
          <Modal transparent={true} visible={isMainImageFullScreen} animationType="fade">
            <View style={styles.fullscreenModalOverlay}>
              <TouchableOpacity style={styles.fullscreenModalClose} onPress={() => setIsMainImageFullScreen(false)}>
                <MaterialIcons name="close" size={30} color="#fff" />
              </TouchableOpacity>
              <View style={styles.fullscreenModalContent}>
                <Image source={{ uri: photo.imageUri }} style={styles.fullscreenImage} />
              </View>
            </View>
          </Modal>
        </View>
      </ScrollView>
      {isModified && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveButton} onPress={saveUpdates}>
            <Text style={styles.buttonText}>Sauvegarder</Text>
          </TouchableOpacity>
        </View>
      )}
      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              {capturedPhotoUri && (
                <Image source={{ uri: capturedPhotoUri }} style={styles.fullscreenImage} />
              )}
              <View style={styles.modalTopButtons}>
                <Pressable style={styles.iconButton} onPress={() => setModalVisible(false)}>
                  <MaterialIcons name="close" size={34} color="white" />
                </Pressable>
                <Pressable style={styles.iconButton} onPress={openCamera}>
                  <Entypo name="forward" size={34} color="white" />
                </Pressable>
              </View>
              <View style={styles.transparentCommentContainer}>
                <TextInput
                  ref={commentAdditionalInputRef}
                  style={styles.transparentCommentInput}
                  placeholder="Ajouter un commentaire"
                  placeholderTextColor="rgba(255, 255, 255, 0.7)"
                  value={commentAdditional}
                  onChangeText={setCommentAdditional}
                  multiline
                />
                <Pressable style={styles.saveIconInsideInput} onPress={saveAndUploadPhoto}>
                  <FontAwesome name="send" size={18} color="#fff" /> 
                </Pressable>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const formatDate = (dateInput) => {
  if (!dateInput) return "Date non disponible";

  let date;

  // Vérifier si dateInput est un objet Firestore Timestamp
  if (dateInput.seconds) {
    date = new Date(dateInput.seconds * 1000 + dateInput.nanoseconds / 1000000);
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else if (typeof dateInput === 'string') {
    date = new Date(dateInput);
  } else {
    return "Date invalide";
  }

  if (isNaN(date)) return "Date invalide";

  const options = { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    hour: '2-digit', 
    minute: '2-digit' 
  };
  return date.toLocaleDateString('fr-FR', options);
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f7f8fa',
  },
  largePhoto: {
    width: '100%',
    height: 450,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#34495e',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  textContainer: {
    flex: 1,
    marginLeft: 10,
  },
  Prebold: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 5,
  },
  metadata: {
    flex: 1,
    flexWrap: 'wrap',
    flexShrink: 1,
    fontSize: 15,
    color: '#34495e',
  },
  addressText: {
    flex: 1,
    flexWrap: 'wrap',
    flexShrink: 1,
    fontSize: 15,
    color: '#3498db', // Couleur bleue pour indiquer que c'est cliquable
    textDecorationLine: 'underline', // Souligner le texte
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498db',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignSelf: 'center',
    left:-6,
    marginTop: 5,
  },
  mapButtonText: {
    justifyContent: 'left',
    alignItems: 'left',
    color: '#fff',
    marginLeft: 5,
    fontSize: 14,
    fontWeight: 'bold',
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1abc9c',
    padding: 15,
    marginVertical: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  iconStyle: {
    marginRight: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footer: {
    backgroundColor: '#f7f8fa',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: '#e63946',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
  },
  additionalPhoto: {
    width: 100,
    height: 100,
    margin: 5,
    borderRadius: 10,
  },
  fullscreenModalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  fullscreenImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    resizeMode: 'cover',
  },
  fullscreenModalClose: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
  },
  fullscreenModalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenCommentContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 10,
  },
  fullscreenComment: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  modalTopButtons: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  iconButton: {
    backgroundColor: 'rgba(27, 72, 78, 0.7)',
    padding: 10,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  transparentCommentContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.0)',
  },
  transparentCommentInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 40,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 0,
    color: '#fff',
  },
  saveIconInsideInput: {
    height:42,
    width:42,
    backgroundColor: '#1b484e',
    margin: 5,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1b484e',
  },
  modalOption: {
    padding: 15,
    width: '100%',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalText: {
    fontSize: 16,
    color: '#34495e',
  },
  optionActive: {
    backgroundColor: '#e0f7fa',
    borderRadius: 10,
  },
  modalCloseButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#333',
  },
  commentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 15,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  commentSection: {
    flex: 1,
    marginLeft: 10,
  },
  commentText: {
    fontSize: 16,
    color: '#34495e',
  },
  commentInputContainer: {
    borderWidth: 1,
    borderColor: '#1abc9c',
    borderRadius: 40,
    padding: 2,
  },
  commentInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 40,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    color: '#34495e',
  },
  commentInputActive: {},
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  },
});
