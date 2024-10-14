import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  Image,
  FlatList, 
  TouchableOpacity, 
  Modal, 
  Alert, 
  Pressable, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform, 
  RefreshControl,
  TouchableWithoutFeedback, Keyboard
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
import PublicImage from '../../components/PublicImage';
import DetailsArmoireStyle from '../../Styles/DetailsArmoireStyle';

export default function DetailsArmoireScreen({ route }) {
  const { armoire } = route.params;
  const [capturedPhotoUri, setCapturedPhotoUri] = useState(null);
  const [additionalPhotos, setAdditionalPhotos] = useState([]);
  const [installationList, setInstallationList] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [comment, setComment] = useState(armoire.comment || '');
  const [commentAdditional, setCommentAdditional] = useState('');
  const [status, setStatus] = useState(armoire.installationStatus || 'Installée');
  const [etat, setEtat] = useState(armoire.functionalityStatus || 'Fonctionnelle');
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

  const [isAdditionalPhotoModalVisible, setIsAdditionalPhotoModalVisible] = useState(false);
  const [selectedAdditionalPhoto, setSelectedAdditionalPhoto] = useState(null);
  const [isMainImageFullScreen, setIsMainImageFullScreen] = useState(false);

  useEffect(() => {
    fetchAdditionalPhotos();
  }, [armoire.installationID]);

  const fetchAdditionalPhotos = async () => {
    try {
      const collectionRef = collection(doc(db, 'decorations', armoire.installationID), 'photos-additionnelles');
      const querySnapshot = await getDocs(collectionRef);
      const photos = querySnapshot.docs.map((doc) => doc.data());
      setAdditionalPhotos(photos);
      
      await fetchInstallationList();
      setLoading(false);
    } catch (err) {
      setError('Erreur lors de la récupération des photos');
      setLoading(false);
    }
  };

  const fetchInstallationList = async () => {
    try {
      const installationsRef = collection(db, 'decorations');
      
      const q = query(
        installationsRef,
        where('armoire', '==', armoire.armoire)  // Filtrer les installations par armoire
      );
      const querySnapshot = await getDocs(q);
      const installations = querySnapshot.docs
        .map(doc => doc.data())
        .filter(installation => !installation.installationID.startsWith('ARM'))  // Filtrer les installations dont l'ID ne commence pas par "ARM"
        .sort((a, b) => a.installationName.localeCompare(b.installationName)); // Tri par nom

      
      setInstallationList(installations);

    } catch (err) {
      console.log(err);
      setError('Erreur lors de la récupération de la liste des installations');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAdditionalPhotos();
    setRefreshing(false);
  };

  const saveUpdates = async () => {
    try {
      const installationDoc = doc(db, 'decorations', armoire.id);
      const docSnapshot = await getDoc(installationDoc);

      if (!docSnapshot.exists()) {
        Alert.alert('Erreur', 'Le document n\'existe pas.');
        return;
      }

      const oldComment = docSnapshot.data().comment || '';
      let oldCommentHistory = docSnapshot.data().commentHistory || [];

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

      const q = query(collection(db, 'journalsMaint'), where('installationID', '==', armoire.installationID));
      const querySnapshot = await getDocs(q);

      const installationData = docSnapshot.data();
      const address = installationData.address || 'Non disponible';

      if (!querySnapshot.empty) {
        const existingDoc = querySnapshot.docs[0];
        await updateDoc(existingDoc.ref, {
          status: status,
          etat: etat,
          comment: comment,
          modificationDate: serverTimestamp(),
          photos: arrayUnion(armoire.imageUri, ...additionalPhotos.map(p => p.imageUri)),
          commentHistory: oldCommentHistory,
          address: address,
        });
      } else {
        await addDoc(collection(db, 'journalsMaint'), {
          installationID: armoire.installationID,
          installationName: armoire.installationName,
          status: status,
          etat: etat,
          comment: comment,
          modificationDate: serverTimestamp(),
          photos: [armoire.imageUri, ...additionalPhotos.map(p => p.imageUri)],
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
      const installationName = armoire.installationName;
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

      await addDoc(collection(db, 'decorations', armoire.installationID, 'photos-additionnelles'), {
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

  const renderHeader = () => (
    <View style={DetailsArmoireStyle.container}>
      <TouchableOpacity onPress={() => setIsMainImageFullScreen(true)}>
        <Text style={DetailsArmoireStyle.title}>{armoire.armoire}</Text> 
        <PublicImage 
          storagePath={armoire.imageUri}
          style={DetailsArmoireStyle.largePhoto}
        />
      </TouchableOpacity>
      <View style={DetailsArmoireStyle.infoContainer}>
        <MaterialIcons name="location-on" size={24} color="#3498db" />
        <View style={DetailsArmoireStyle.textContainer}>
          <Text style={DetailsArmoireStyle.Prebold}>Adresse :</Text>
          <Text style={DetailsArmoireStyle.metadata} numberOfLines={2} ellipsizeMode="tail">
            {armoire.address || "Non disponible"}
          </Text>
        </View>
      </View>
      <View style={DetailsArmoireStyle.infoContainer}>
        <MaterialIcons name="calendar-today" size={24} color="#3498db" />
        <Text style={DetailsArmoireStyle.metadata}>
          <Text style={DetailsArmoireStyle.Prebold}> Date : </Text>{formatDate(armoire.createdAt)}
        </Text>
      </View>
      <View style={DetailsArmoireStyle.infoContainer}>
        <MaterialIcons name="door-sliding" size={24} color="#1abc9c" />
        <Text style={DetailsArmoireStyle.metadata}>
          <Text style={DetailsArmoireStyle.Prebold}> Armoire : </Text>{armoire.armoire || "Non disponible"}
        </Text>
      </View>
      <View style={DetailsArmoireStyle.infoContainer}>
        <MaterialCommunityIcons name="comment-text" size={24} color="#34495e" />
        <View style={DetailsArmoireStyle.commentSection}>
          <Text style={DetailsArmoireStyle.Prebold}> Information : </Text>
          {isEditingComment ? (
            <View style={DetailsArmoireStyle.commentInputContainer}>
              <TextInput
                ref={commentInputRef}
                style={[DetailsArmoireStyle.commentInput, DetailsArmoireStyle.commentInputActive]}
                value={comment}
                onChangeText={handleCommentChange}
                placeholder="Modifier le commentaire"
                placeholderTextColor="#7f8c8d"
                multiline
              />
            </View>
          ) : (
            <TouchableOpacity onPress={() => setIsEditingComment(true)}>
              <Text style={DetailsArmoireStyle.commentText}>{comment}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <TouchableOpacity style={DetailsArmoireStyle.button} onPress={openCamera}>
        <MaterialIcons name="camera-alt" size={24} color="#fff" style={DetailsArmoireStyle.iconStyle} />
        <Text style={DetailsArmoireStyle.buttonText}>Ajouter une photo</Text>
      </TouchableOpacity>
      <Text style={DetailsArmoireStyle.title}>Photos Additionnelles :</Text>
      {loading ? (
        <Text>Chargement des photos...</Text>
      ) : additionalPhotos.length === 0 ? (
        <Text style={DetailsArmoireStyle.noDataText}>Aucune photo additionnelle disponible.</Text>
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
                style={DetailsArmoireStyle.additionalPhoto}
              />
            </TouchableOpacity>
          )}
          scrollEnabled={false}
        />
      )}
      <Text style={DetailsArmoireStyle.title}>Liste des Installations :</Text>
      {loading ? (
        <Text>Chargement des installations...</Text>
      ) : installationList.length === 0 ? (
        <Text style={DetailsArmoireStyle.noDataText}>Aucune installation trouvée.</Text>
      ) : null}
    </View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 80}
    >
      <FlatList
        ListHeaderComponent={renderHeader}
        data={installationList}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={DetailsArmoireStyle.groupContainer}>
            <View style={DetailsArmoireStyle.card} key={item.id}>
              <PublicImage 
                storagePath={item.imageUri}
                style={DetailsArmoireStyle.cardImage}
              />
              <View style={DetailsArmoireStyle.cardContent}>
                <Text style={DetailsArmoireStyle.cardTitle}>{item.installationName}</Text>
                <Text style={DetailsArmoireStyle.cardText}>{item.numeroRue} {item.rue}</Text>
              </View>
            </View>
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        contentContainerStyle={DetailsArmoireStyle.listContainer}
      />
      {error && <Text style={DetailsArmoireStyle.errorText}>{error}</Text>}
      {isAdditionalPhotoModalVisible && selectedAdditionalPhoto && (
        <Modal transparent={true} visible={isAdditionalPhotoModalVisible} animationType="fade">
          <View style={DetailsArmoireStyle.fullscreenModalOverlay}>
            <TouchableOpacity style={DetailsArmoireStyle.fullscreenModalClose} onPress={() => setIsAdditionalPhotoModalVisible(false)}>
              <MaterialIcons name="close" size={30} color="#fff" />
            </TouchableOpacity>
            <View style={DetailsArmoireStyle.fullscreenModalContent}>
              <Image source={{ uri: selectedAdditionalPhoto.imageUri }} style={DetailsArmoireStyle.fullscreenImage} />
              {selectedAdditionalPhoto.comment ? (
                <View style={DetailsArmoireStyle.fullscreenCommentContainer}>
                  <Text style={DetailsArmoireStyle.fullscreenComment}>{selectedAdditionalPhoto.comment}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </Modal>
      )}
      <Modal transparent={true} visible={isMainImageFullScreen} animationType="fade">
        <View style={DetailsArmoireStyle.fullscreenModalOverlay}>
          <TouchableOpacity style={DetailsArmoireStyle.fullscreenModalClose} onPress={() => setIsMainImageFullScreen(false)}>
            <MaterialIcons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          <View style={DetailsArmoireStyle.fullscreenModalContent}>
            <Image source={{ uri: armoire.imageUri }} style={DetailsArmoireStyle.fullscreenImage} />
          </View>
        </View>
      </Modal>
      {isModified && (
        <View style={DetailsArmoireStyle.footer}>
          <TouchableOpacity style={DetailsArmoireStyle.saveButton} onPress={saveUpdates}>
            <Text style={DetailsArmoireStyle.buttonText}>Sauvegarder</Text>
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
            <View style={DetailsArmoireStyle.modalOverlay}>
              {capturedPhotoUri && (
                <Image source={{ uri: capturedPhotoUri }} style={DetailsArmoireStyle.fullscreenImage} />
              )}
              <View style={DetailsArmoireStyle.modalTopButtons}>
                <Pressable style={DetailsArmoireStyle.iconButton} onPress={() => setModalVisible(false)}>
                  <MaterialIcons name="close" size={34} color="white" />
                </Pressable>
                <Pressable style={DetailsArmoireStyle.iconButton} onPress={openCamera}>
                  <Entypo name="forward" size={34} color="white" />
                </Pressable>
              </View>
              <View style={DetailsArmoireStyle.transparentCommentContainer}>
                <TextInput
                  ref={commentAdditionalInputRef}
                  style={DetailsArmoireStyle.transparentCommentInput}
                  placeholder="Ajouter un commentaire"
                  placeholderTextColor="rgba(255, 255, 255, 0.7)"
                  value={commentAdditional}
                  onChangeText={setCommentAdditional}
                  multiline
                />
                <Pressable style={DetailsArmoireStyle.saveIconInsideInput} onPress={saveAndUploadPhoto}>
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
