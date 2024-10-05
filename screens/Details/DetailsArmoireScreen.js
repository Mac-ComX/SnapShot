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
  Pressable, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform, 
  RefreshControl,
  TouchableWithoutFeedback,Keyboard
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

export default function DetailsArmoireScreen({ route }) {
  const { armoire } = route.params;
  const [capturedPhotoUri, setCapturedPhotoUri] = useState(null);
  const [additionalPhotos, setAdditionalPhotos] = useState([]);
  const [installationList, setInstallationList] = useState([]); // Liste des installations avec images
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
      
      // Après avoir récupéré les photos, récupérons la liste des installations
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
      
      // Créer un Set pour éviter les doublons
      const installationsSet = new Set();

      // Requête pour les installations où installationType != 'Armoire'
      const qType = query(
        installationsRef,
        where('installationType', '!=', 'Armoire')
      );
      const querySnapshotType = await getDocs(qType);
      querySnapshotType.forEach(doc => {
        const data = doc.data();
        // Assurez-vous que 'imageUri' existe dans vos documents
        if (data.imageUri && !data.installationName.startsWith('ARM')) {
          installationsSet.add(JSON.stringify({ installationName: data.installationName, imageUri: data.imageUri }));
        }
      });

      // Requête pour les installations correspondant à la valeur de "armoire" saisie par l'utilisateur
      if (armoire.armoire) {
        const qArmoire = query(
          installationsRef,
          where('armoire', '==', armoire.armoire)
        );
        const querySnapshotArmoire = await getDocs(qArmoire);
        querySnapshotArmoire.forEach(doc => {
          const data = doc.data();
          if (data.imageUri && !data.installationName.startsWith('ARM')) {
            installationsSet.add(JSON.stringify({ installationName: data.installationName, imageUri: data.imageUri }));
          }
        });
      }

      // Convertir le Set en Array d'objets
      const installations = Array.from(installationsSet).map(item => JSON.parse(item));
      
      // Trier les installations par nom
      const sortedInstallations = installations.sort((a, b) => a.installationName.localeCompare(b.installationName));
      
      setInstallationList(sortedInstallations);
      
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
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setIsMainImageFullScreen(true)}>
        
      <Text style={styles.title}>{armoire.armoire}</Text> 
        <PublicImage 
          storagePath={armoire.imageUri}
          style={styles.largePhoto}
        />
      </TouchableOpacity>
      <View style={styles.infoContainer}>
        <MaterialIcons name="location-on" size={24} color="#3498db" />
        <View style={styles.textContainer}>
          <Text style={styles.Prebold}>Adresse :</Text>
          <Text style={styles.metadata} numberOfLines={2} ellipsizeMode="tail">
            {armoire.address || "Non disponible"}
          </Text>
        </View>
      </View>
      <View style={styles.infoContainer}>
        <MaterialIcons name="calendar-today" size={24} color="#3498db" />
        <Text style={styles.metadata}>
          <Text style={styles.Prebold}> Date : </Text>{formatDate(armoire.createdAt)}
        </Text>
      </View>
      <View style={styles.infoContainer}>
        <MaterialIcons name="door-sliding" size={24} color="#1abc9c" />
        <Text style={styles.metadata}>
          <Text style={styles.Prebold}> Armoire : </Text>{armoire.armoire || "Non disponible"}
        </Text>
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
        <Text style={styles.buttonText}>Ajouter une photo</Text>
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
      <Text style={styles.title}>Liste des Installations :</Text>
      {loading ? (
        <Text>Chargement des installations...</Text>
      ) : installationList.length === 0 ? (
        <Text style={styles.noDataText}>Aucune installation trouvée.</Text>
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
          <View style={styles.card}>
            <PublicImage 
              storagePath={item.imageUri}
              style={styles.cardImage}
            />
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.installationName}</Text>
            </View>
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        contentContainerStyle={styles.listContainer}
      />
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
            <Image source={{ uri: armoire.imageUri }} style={styles.fullscreenImage} />
          </View>
        </View>
      </Modal>
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
    color: '#1b484e',
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
    width: 350,
    height: 150,
    marginBottom: 30,
    borderRadius: 10,
  },
  
  // Styles pour la liste des installations
  listContainer: {
    paddingVertical: 10,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3, // Augmenté pour une ombre plus prononcée
    shadowRadius: 10,    // Augmenté pour une ombre plus douce et étendue
    elevation: 5,        // Augmenté pour une ombre plus visible sur Android
    overflow: 'hidden',
  },
  cardImage: {
    width: 100,
    height: 100,
  },
  cardContent: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  noDataText: {
    textAlign: 'center',
    color: '#7f8c8d',
    fontSize: 16,
    marginTop: 20,
  },

  // Autres styles existants...
  fullscreenModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)', // Plus sombre pour mieux voir l'image
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain', // Pour ajuster l'image sans déformation
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
