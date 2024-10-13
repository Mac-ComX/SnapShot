import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  Image,
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
import DetailsDebugStyle from '../../Styles/DetailsDebugStyle';

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

      await updateDoc(installationDoc, {
        installationStatus: status, 
        functionalityStatus: etat,
        comment: comment,
        commentHistory: oldCommentHistory,
      });

      const q = query(collection(db, 'journalsMaint'), where('installationID', '==', photo.installationID));
      const querySnapshot = await getDocs(q);

      // Récupérer l'adresse depuis le document de décorations
      const installationData = docSnapshot.data();
      const address = installationData.address || 'Non disponible';

      if (!querySnapshot.empty) {
        const existingDoc = querySnapshot.docs[0];
        await updateDoc(existingDoc.ref, {
          status: status,
          etat: etat,
          comment: comment,
          modificationDate: serverTimestamp(),
          photos: arrayUnion(photo.imageUri, ...additionalPhotos.map(p => p.imageUri)),
          commentHistory: oldCommentHistory,
          address: address,
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
          address: address,
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
        createdAt: new Date().toLocaleString(),
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

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 80}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={DetailsDebugStyle.scrollContainer}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        <View style={DetailsDebugStyle.container}>
          <TouchableOpacity onPress={() => setIsMainImageFullScreen(true)}>
            <PublicImage 
              storagePath={photo.imageUri}
              style={DetailsDebugStyle.largePhoto}
            />
          </TouchableOpacity>
          <Text style={DetailsDebugStyle.title}>{photo.installationName}</Text> 
          <View style={DetailsDebugStyle.infoContainer}>
            <MaterialIcons name="location-on" size={24} color="#3498db" />
            <View style={DetailsDebugStyle.textContainer}>
              <Text style={DetailsDebugStyle.Prebold}>Adresse :</Text>
              <Text style={DetailsDebugStyle.metadata} numberOfLines={2} ellipsizeMode="tail">
                {photo.address || "Non disponible"}
              </Text>
            </View>
          </View>
          <View style={DetailsDebugStyle.infoContainer}>
            <MaterialIcons name="calendar-today" size={24} color="#3498db" />
            <Text style={DetailsDebugStyle.metadata}>
              <Text style={DetailsDebugStyle.Prebold}> Date : </Text>{formatDate(photo.createdAt)}
            </Text>
          </View>
          <View style={DetailsDebugStyle.infoContainer}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={24} color="#f1c40f" />
            <Text style={DetailsDebugStyle.metadata}>
              <Text style={DetailsDebugStyle.Prebold}> Type : </Text>{photo.installationType || "Non disponible"}
            </Text>
          </View>
          <View style={DetailsDebugStyle.infoContainer}>
            <MaterialIcons name="door-sliding" size={24} color="#1abc9c" />
            <Text style={DetailsDebugStyle.metadata}>
              <Text style={DetailsDebugStyle.Prebold}> Armoire : </Text>{photo.armoire || "Non disponible"}
            </Text>
          </View>
          <View style={DetailsDebugStyle.infoContainer}>
            <MaterialIcons name="verified" size={24} color={status === 'Installée' ? '#2ecc71' : '#e74c3c'} />
            <Text style={DetailsDebugStyle.Prebold}> Statut : </Text>
            <TouchableOpacity onPress={() => setIsEditingStatus(true)}>
              <Text style={{ color: status === 'Installée' || status === 'Fonctionnelle' ? '#2ecc71' : '#e74c3c' }}>
                {status}
              </Text>
            </TouchableOpacity>
            <Modal visible={isEditingStatus} transparent={true} animationType="fade">
              <View style={DetailsDebugStyle.modalOverlay}>
                <View style={DetailsDebugStyle.modalContainer}>
                  <View style={DetailsDebugStyle.modalContent}>
                    <Text style={DetailsDebugStyle.modalTitle}>Changer le statut</Text>
                    <TouchableOpacity
                      style={[DetailsDebugStyle.modalOption, status === 'Installée' && DetailsDebugStyle.optionActive]}
                      onPress={() => { handleStatusChange('Installée'); setIsEditingStatus(false); }}
                    >
                      <Text style={DetailsDebugStyle.modalText}>Installée</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[DetailsDebugStyle.modalOption, status === 'Non installée' && DetailsDebugStyle.optionActive]}
                      onPress={() => { handleStatusChange('Non installée'); setIsEditingStatus(false); }}
                    >
                      <Text style={DetailsDebugStyle.modalText}>Non installée</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setIsEditingStatus(false)} style={DetailsDebugStyle.modalCloseButton}>
                      <Text style={DetailsDebugStyle.modalCloseText}>Annuler</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          </View>
          <View style={DetailsDebugStyle.infoContainer}>
            <MaterialIcons name="report-problem" size={24} color={etat === 'Fonctionnelle' ? '#2ecc71' : '#e74c3c'} />
            <Text style={DetailsDebugStyle.Prebold}> État : </Text>
            <TouchableOpacity onPress={() => setIsEditingEtat(true)}>
              <Text style={{ color: etat === 'Fonctionnelle' ? '#2ecc71' : '#e74c3c' }}>
                {etat}
              </Text>
            </TouchableOpacity>
            <Modal visible={isEditingEtat} transparent={true} animationType="fade">
              <View style={DetailsDebugStyle.modalOverlay}>
                <View style={DetailsDebugStyle.modalContainer}>
                  <View style={DetailsDebugStyle.modalContent}>
                    <Text style={DetailsDebugStyle.modalTitle}>Changer l'état</Text>
                    <TouchableOpacity
                      style={[DetailsDebugStyle.modalOption, etat === 'Fonctionnelle' && DetailsDebugStyle.optionActive]}
                      onPress={() => { handleEtatChange('Fonctionnelle'); setIsEditingEtat(false); }}
                    >
                      <Text style={DetailsDebugStyle.modalText}>Fonctionnelle</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[DetailsDebugStyle.modalOption, etat === 'En panne' && DetailsDebugStyle.optionActive]}
                      onPress={() => { handleEtatChange('En panne'); setIsEditingEtat(false); }}
                    >
                      <Text style={DetailsDebugStyle.modalText}>En panne</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setIsEditingEtat(false)} style={DetailsDebugStyle.modalCloseButton}>
                      <Text style={DetailsDebugStyle.modalCloseText}>Annuler</Text>
                    </TouchableOpacity> 
                  </View>
                </View>
              </View>
            </Modal>
          </View>
          <View style={DetailsDebugStyle.infoContainer}>
            <MaterialCommunityIcons name="comment-text" size={24} color="#34495e" />
            <View style={DetailsDebugStyle.commentSection}>
              <Text style={DetailsDebugStyle.Prebold}> Information : </Text>
              {isEditingComment ? (
                <View style={DetailsDebugStyle.commentInputContainer}>
                  <TextInput
                    ref={commentInputRef}
                    style={[DetailsDebugStyle.commentInput, DetailsDebugStyle.commentInputActive]}
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
                  <Text style={DetailsDebugStyle.commentText}>{comment}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <TouchableOpacity style={DetailsDebugStyle.button} onPress={openCamera}>
            <MaterialIcons name="camera-alt" size={24} color="#fff" style={DetailsDebugStyle.iconStyle} />
            <Text style={DetailsDebugStyle.buttonText}>Ajouter une photo de maintenance</Text>
          </TouchableOpacity>
          <Text style={DetailsDebugStyle.title}>Photos Additionnelles :</Text>
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
                    style={DetailsDebugStyle.additionalPhoto}
                  />
                </TouchableOpacity>
              )}
              scrollEnabled={false}
            />
          )}
          {error && <Text style={DetailsDebugStyle.errorText}>{error}</Text>}
          {isAdditionalPhotoModalVisible && selectedAdditionalPhoto && (
            <Modal transparent={true} visible={isAdditionalPhotoModalVisible} animationType="fade">
              <View style={DetailsDebugStyle.fullscreenModalOverlay}>
                <TouchableOpacity style={DetailsDebugStyle.fullscreenModalClose} onPress={() => setIsAdditionalPhotoModalVisible(false)}>
                  <MaterialIcons name="close" size={30} color="#fff" />
                </TouchableOpacity>
                <View style={DetailsDebugStyle.fullscreenModalContent}>
                  <Image source={{ uri: selectedAdditionalPhoto.imageUri }} style={DetailsDebugStyle.fullscreenImage} />
                  {selectedAdditionalPhoto.comment ? (
                    <View style={DetailsDebugStyle.fullscreenCommentContainer}>
                      <Text style={DetailsDebugStyle.fullscreenComment}>{selectedAdditionalPhoto.comment}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </Modal>
          )}
          <Modal transparent={true} visible={isMainImageFullScreen} animationType="fade">
            <View style={DetailsDebugStyle.fullscreenModalOverlay}>
              <TouchableOpacity style={DetailsDebugStyle.fullscreenModalClose} onPress={() => setIsMainImageFullScreen(false)}>
                <MaterialIcons name="close" size={30} color="#fff" />
              </TouchableOpacity>
              <View style={DetailsDebugStyle.fullscreenModalContent}>
                <Image source={{ uri: photo.imageUri }} style={DetailsDebugStyle.fullscreenImage} />
              </View>
            </View>
          </Modal>
        </View>
      </ScrollView>
      {isModified && (
        <View style={DetailsDebugStyle.footer}>
          <TouchableOpacity style={DetailsDebugStyle.saveButton} onPress={saveUpdates}>
            <Text style={DetailsDebugStyle.buttonText}>Sauvegarder</Text>
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
            <View style={DetailsDebugStyle.modalOverlay}>
              {capturedPhotoUri && (
                <Image source={{ uri: capturedPhotoUri }} style={DetailsDebugStyle.fullscreenImage} />
              )}
              <View style={DetailsDebugStyle.modalTopButtons}>
                <Pressable style={DetailsDebugStyle.iconButton} onPress={() => setModalVisible(false)}>
                  <MaterialIcons name="close" size={34} color="white" />
                </Pressable>
                <Pressable style={DetailsDebugStyle.iconButton} onPress={openCamera}>
                  <Entypo name="forward" size={34} color="white" />
                </Pressable>
              </View>
              <View style={DetailsDebugStyle.transparentCommentContainer}>
                <TextInput
                  ref={commentAdditionalInputRef}
                  style={DetailsDebugStyle.transparentCommentInput}
                  placeholder="Ajouter un commentaire"
                  placeholderTextColor="rgba(255, 255, 255, 0.7)"
                  value={commentAdditional}
                  onChangeText={setCommentAdditional}
                  multiline
                />
                <Pressable style={DetailsDebugStyle.saveIconInsideInput} onPress={saveAndUploadPhoto}>
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

const formatDate = (dateString) => {
  if (!dateString) return "Date non disponible";
  const [datePart, timePart] = dateString.split(', ');
  const [day, month, year] = datePart.split('/');
  const [hour, minute] = timePart.split(':');
  const date = new Date(year, month - 1, day, hour, minute);
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
