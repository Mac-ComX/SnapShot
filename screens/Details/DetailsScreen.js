import React, { useState, useEffect, useRef, useReducer } from 'react';
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
  UIManager, 
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Animated,
  Easing
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, Entypo, FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';  
import * as ImageManipulator from 'expo-image-manipulator';
import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
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
  arrayUnion, 
  arrayRemove 
} from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { db } from '../../services/firebase';
import PublicImage from '../../components/PublicImage'; // Assurez-vous que ce composant est bien importé
import DetailsStyle from '../../Styles/DetailsStyle';

/**
 * Fonction pour formater la date
 */
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

/**
 * Reducer pour gérer les états des photos
 */
const initialPhotoState = {
  additionalPhotos: [],
  loading: true,
  error: null,
  isUploading: false,
};

function photoReducer(state, action) {
  switch (action.type) {
    case 'FETCH_PHOTOS_REQUEST':
      return { ...state, loading: true, error: null };
    case 'FETCH_PHOTOS_SUCCESS':
      return { ...state, loading: false, additionalPhotos: action.payload };
    case 'FETCH_PHOTOS_FAILURE':
      return { ...state, loading: false, error: action.payload };
    case 'UPLOAD_PHOTO_REQUEST':
      return { ...state, isUploading: true, error: null };
    case 'UPLOAD_PHOTO_SUCCESS':
      return { 
        ...state, 
        isUploading: false, 
        additionalPhotos: [...state.additionalPhotos, action.payload] 
      };
    case 'UPLOAD_PHOTO_FAILURE':
      return { ...state, isUploading: false, error: action.payload };
    case 'DELETE_PHOTO_SUCCESS':
      return { 
        ...state, 
        additionalPhotos: state.additionalPhotos.filter(uri => uri !== action.payload) 
      };
    default:
      return state;
  }
}

export default function DetailsScreen({ route }) {
  const { photo } = route.params;
  const navigation = useNavigation();

  /** 
   * États 
   */
  // Reducer pour la gestion des photos
  const [photoState, dispatch] = useReducer(photoReducer, initialPhotoState);

  // Autres états
  const [selectedImage, setSelectedImage] = useState(photo.imageUri);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState(null);
  const [visibleImage, setVisibleImage] = useState(photo.imageUri);
  const [selectedAdditionalPhoto, setSelectedAdditionalPhoto] = useState(null);

  // UI et Modaux
  const [modalVisible, setModalVisible] = useState(false);
  const [isAdditionalPhotoModalVisible, setIsAdditionalPhotoModalVisible] = useState(false);
  const [isMainImageFullScreen, setIsMainImageFullScreen] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); // Pour l'indicateur de suppression

  // Commentaires et États
  const [comment, setComment] = useState(photo.comment || '');
  const [commentAdditional, setCommentAdditional] = useState('');
  const [status, setStatus] = useState(photo.installationStatus || 'Installée');
  const [etat, setEtat] = useState(photo.functionalityStatus || 'Fonctionnelle');
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [isEditingEtat, setIsEditingEtat] = useState(false);
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [isModified, setIsModified] = useState(false);
  const [error, setError] = useState(null);

  /** 
   * Références 
   */
  const scrollViewRef = useRef();
  const commentInputRef = useRef();
  const commentAdditionalInputRef = useRef();

  /**
   * Hooks
   */
  useEffect(() => {
    fetchAdditionalPhotos();
  }, [photo.installationID]);

  /**
   * Fonctions Utilitaires
   */

  /**
   * Convertir une URI en Blob
   */
  const uriToBlob = async (uri) => {
    const response = await fetch(uri);
    if (!response.ok) throw new Error("Erreur lors de la récupération de la photo.");
    const blob = await response.blob();
    return blob;
  };

  /**
   * Redimensionner et compresser une image
   */
  const resizeImage = async (uri) => {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );
      console.log('Image redimensionnée et compressée :', manipResult.uri);
      return manipResult.uri;
    } catch (error) {
      console.error('Erreur lors du redimensionnement de l\'image :', error);
      throw error;
    }
  };

  /**
   * Récupérer les photos additionnelles depuis Firestore
   */
  const fetchAdditionalPhotos = async () => {
    dispatch({ type: 'FETCH_PHOTOS_REQUEST' });
    try {
      const collectionRef = collection(doc(db, 'decorations', photo.installationID), 'photos-additionnelles');
      const querySnapshot = await getDocs(collectionRef);
      const photos = querySnapshot.docs.map((doc) => doc.data());
      dispatch({ type: 'FETCH_PHOTOS_SUCCESS', payload: photos });
    } catch (err) {
      dispatch({ type: 'FETCH_PHOTOS_FAILURE', payload: 'Erreur lors de la récupération des photos' });
      console.error('Erreur lors de la récupération des photos :', err);
    }
  };

  /**
   * Rafraîchir les photos additionnelles
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAdditionalPhotos();
    setRefreshing(false);
  };

  /**
 * Capturer une nouvelle photo principale supplémentaire avec la caméra et l'uploader dans le tableau imageUris
 */
const captureNewPhotoWithCamera = async () => {
  try {
    // Demander la permission d'accéder à la caméra
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission refusée', 'Vous devez autoriser l\'accès à la caméra.');
      return;
    }

    // Ouvrir la caméra pour capturer une nouvelle image
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    // Si l'utilisateur ne l'a pas annulée
    if (!result.canceled) {
      const { uri } = result.assets[0];
      const resizedUri = await resizeImage(uri);

      // Uploader la nouvelle image principale dans le tableau imageUris
      await uploadPhotoToImageUris(resizedUri);
    }
  } catch (error) {
    console.error('Erreur lors de la capture de la photo :', error);
    Alert.alert('Erreur', 'Impossible de capturer la photo.');
  }
};

/**
 * Uploader une photo et l'ajouter dans le tableau imageUris de Firebase
 */
const uploadPhotoToImageUris = async (localUri) => {
  try {
    const blob = await uriToBlob(localUri);
    const installationName = photo.installationName;
    const photoId = photo.id;

    // Générer un nom pour la nouvelle photo
    const photoName = `${installationName}-supplémentaire-${Date.now()}.jpg`;
    const storage = getStorage();
    const storageRef = ref(storage, `photos/${photoName}`);

    // Uploader la photo sur Firebase Storage
    const uploadTask = uploadBytesResumable(storageRef, blob);

    uploadTask.on('state_changed', 
      (snapshot) => {
        // Progrès du téléversement (optionnel)
      }, 
      (error) => {
        console.error('Erreur durant l\'upload de la photo principale supplémentaire :', error);
        Alert.alert('Erreur', `Erreur durant l'upload : ${error.message}`);
      }, 
      async () => {
        // Récupérer l'URL de téléchargement après l'upload
        const downloadURL = await getDownloadURL(storageRef);

        // Mettre à jour Firestore pour ajouter la nouvelle URL au tableau imageUris
        await updateDoc(doc(db, 'decorations', photoId), {
          imageUris: arrayUnion(downloadURL), // Ajouter la nouvelle URL dans le tableau imageUris
        });

        console.log('Firestore mis à jour avec la nouvelle URL dans imageUris');
        Alert.alert('Succès', 'Photo principale supplémentaire ajoutée avec succès !');
      }
    );
  } catch (error) {
    console.error('Erreur lors de l\'upload de la photo :', error);
    Alert.alert('Erreur', `Impossible d'uploader la photo : ${error.message}`);
  }
};


  /**
   * Capturer une nouvelle photo principal supplémentaire avec la caméra et uploader
   */
  // const captureNewPhotoWithCamera = async () => {
  //   try {
  //     const permission = await ImagePicker.requestCameraPermissionsAsync();
  //     if (!permission.granted) {
  //       Alert.alert('Permission refusée', 'Vous devez autoriser l\'accès à la caméra.');
  //       return;
  //     }

  //     const result = await ImagePicker.launchCameraAsync({
  //       mediaTypes: ImagePicker.MediaTypeOptions.Images,
  //       allowsEditing: true,
  //       quality: 1,
  //     });

  //     if (!result.canceled) {
  //       const { uri } = result.assets[0];
  //       const resizedUri = await resizeImage(uri);
  //       await uploadAdditionalPhotoToFirebase(resizedUri);
  //     }
  //   } catch (error) {
  //     console.error('Erreur lors de la capture de la photo :', error);
  //     Alert.alert('Erreur', 'Impossible de capturer la photo.');
  //   }
  // };

  /**
   * Uploader une photo additionnelle sur Firebase
   */
  const uploadAdditionalPhotoToFirebase = async (localUri) => {
    if (photoState.isUploading) {
      Alert.alert('Upload en cours', 'Veuillez attendre que l\'upload précédent soit terminé.');
      return;
    }

    dispatch({ type: 'UPLOAD_PHOTO_REQUEST' });

    try {
      const blob = await uriToBlob(localUri);
      const installationName = photo.installationName;
      const photoId = photo.id;

      if (!installationName || !photoId) {
        throw new Error("Installation Name ou Photo ID est manquant.");
      }

      const photoName = `${installationName}-additionnel-${Date.now()}.jpg`;
      const storage = getStorage();
      const storageRef = ref(storage, `photos-additionnelles/${photoName}`);

      const uploadTask = uploadBytesResumable(storageRef, blob);

      uploadTask.on('state_changed',
        (snapshot) => {
          // Vous pouvez gérer le progrès ici si nécessaire
        }, 
        (error) => {
          console.error('Erreur durant l\'upload additionnel :', error);
          Alert.alert('Erreur', `Erreur durant l'upload additionnel : ${error.message}`);
          dispatch({ type: 'UPLOAD_PHOTO_FAILURE', payload: error.message });
        }, 
        async () => {
          const downloadURL = await getDownloadURL(storageRef);
          console.log('URL de téléchargement additionnelle obtenue :', downloadURL);

          await addDoc(collection(db, 'decorations', photo.installationID, 'photos-additionnelles'), {
            imageUri: downloadURL,
            localImageUri: localUri,
            comment: commentAdditional,
            createdAt: serverTimestamp(),
          });

          dispatch({ type: 'UPLOAD_PHOTO_SUCCESS', payload: downloadURL });
          Alert.alert('Succès', 'Photo sauvegardée et téléversée avec succès !');
          setModalVisible(false);
        }
      );
    } catch (error) {
      console.error('Erreur lors de l\'upload de la photo additionnelle :', error);
      Alert.alert('Erreur', `Impossible d'uploader la photo additionnelle : ${error.message}`);
      dispatch({ type: 'UPLOAD_PHOTO_FAILURE', payload: error.message });
    }
  };

  /**
   * Remplacer l'image principale avec une nouvelle photo principal
   */
  const replaceMainImage = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission refusée', 'Vous devez autoriser l\'accès à la caméra.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        const { uri } = result.assets[0];
        const resizedUri = await resizeImage(uri);

        // Optionnel : ajouter l'ancienne image principale aux photos additionnelles
        // if (selectedImage !== photo.imageUri) {
        //   await uploadAdditionalPhotoToFirebase(selectedImage);
        // }

        // Uploader la nouvelle image principale
        await uploadMainImageToFirebase(resizedUri);
      }
    } catch (error) {
      console.error('Erreur lors du remplacement de l\'image principale :', error);
      Alert.alert('Erreur', 'Impossible de remplacer l\'image principale.');
    }
  };

  /**
   * Uploader la nouvelle image principale sur Firebase et mettre à jour Firestore
   */
  const uploadMainImageToFirebase = async (localUri) => {
    if (photoState.isUploading) {
      Alert.alert('Upload en cours', 'Veuillez attendre que l\'upload précédent soit terminé.');
      return;
    }

    dispatch({ type: 'UPLOAD_PHOTO_REQUEST' });

    try {
      const blob = await uriToBlob(localUri);
      const installationName = photo.installationName;
      const photoId = photo.id;

      if (!installationName || !photoId) {
        throw new Error("Installation Name ou Photo ID est manquant.");
      }

      const photoName = `${installationName}-principal-${Date.now()}.jpg`;
      const storage = getStorage();
      const storageRef = ref(storage, `photos/${photoName}`);

      const uploadTask = uploadBytesResumable(storageRef, blob);

      uploadTask.on('state_changed',
        (snapshot) => {
          // Vous pouvez gérer le progrès ici si nécessaire
        }, 
        (error) => {
          console.error('Erreur durant l\'upload principal :', error);
          Alert.alert('Erreur', `Erreur durant l'upload principal : ${error.message}`);
          dispatch({ type: 'UPLOAD_PHOTO_FAILURE', payload: error.message });
        }, 
        async () => {
          const downloadURL = await getDownloadURL(storageRef);
          console.log('URL de téléchargement principale obtenue :', downloadURL);

          // Mettre à jour l'image principale dans Firestore
          await updateDoc(doc(db, 'decorations', photoId), {
            imageUri: downloadURL,
          });
          console.log('Firestore mis à jour avec la nouvelle URL de l\'image principale');

          setSelectedImage(downloadURL);
          setVisibleImage(downloadURL);
          dispatch({ type: 'UPLOAD_PHOTO_SUCCESS', payload: downloadURL });
          Alert.alert('Succès', 'Image principale remplacée avec succès !');
        }
      );
    } catch (error) {
      console.error('Erreur lors de l\'upload de la nouvelle image principale :', error);
      Alert.alert('Erreur', `Impossible d'uploader la nouvelle image principale : ${error.message}`);
      dispatch({ type: 'UPLOAD_PHOTO_FAILURE', payload: error.message });
    }
  };

  /**
   * Supprimer une photo additionnelle
   */
  const deletePhoto = async () => {
    setIsDeleting(true);
    try {
      const storage = getStorage();
      const imageRef = ref(storage, selectedImage);

      await deleteObject(imageRef);
      console.log('Image supprimée de Firebase Storage');

      await updateDoc(doc(db, 'decorations', photo.id), {
        imageUris: arrayRemove(selectedImage),
      });
      console.log('Firestore mis à jour pour supprimer l\'URI de l\'image');

      dispatch({ type: 'DELETE_PHOTO_SUCCESS', payload: selectedImage });
      setSelectedImage(photo.imageUri);
      setVisibleImage(photo.imageUri);

      Alert.alert('Succès', 'Photo supprimée avec succès');
    } catch (error) {
      Alert.alert('Erreur', `Impossible de supprimer la photo : ${error.message}`);
      console.error('Erreur lors de la suppression de la photo :', error);
    }

    setIsDeleting(false);
    closeMenu();
  };

  /**
   * Capturer une nouvelle photo additionnelle et ouvrir le modal
   */
  const captureNewPhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission refusée', 'Vous devez autoriser l\'accès à la caméra.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync();
      if (!result.canceled) {
        const { uri } = result.assets[0];
        const resizedUri = await resizeImage(uri);
        setCapturedPhotoUri(resizedUri);
        setModalVisible(true);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de capturer la photo.');
      console.error('Erreur lors de la capture de la photo :', error);
    }
  };

  /**
   * Sauvegarder et uploader une photo additionnelle
   */
  const saveAndUploadPhoto = async () => {
    if (photoState.isUploading) return;

    try {
      dispatch({ type: 'UPLOAD_PHOTO_REQUEST' });
      const installationName = photo.installationName;
      const localUri = `${FileSystem.documentDirectory}${installationName}_photo.jpg`;

      await FileSystem.copyAsync({
        from: capturedPhotoUri,
        to: localUri,
      });

      const resizedUri = await resizeImage(localUri);
      await uploadAdditionalPhotoToFirebase(resizedUri);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder et téléverser la photo.');
      console.error('Erreur lors de la sauvegarde et de l\'upload de la photo :', error);
      dispatch({ type: 'UPLOAD_PHOTO_FAILURE', payload: error.message });
    }
  };

  /**
   * Sauvegarder les mises à jour dans Firestore
   */
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

      // Ajouter à l'historique des commentaires si modifié
      if (oldComment && oldComment !== comment) {
        oldCommentHistory = [...oldCommentHistory, {
          comment: oldComment,
          date: new Date().toISOString(),
        }];
      }

      const updatedAddress = getAddress();

      await updateDoc(installationDoc, {
        installationStatus: status, 
        functionalityStatus: etat,
        comment: comment,
        commentHistory: oldCommentHistory,
        address: updatedAddress,
      });

      // Mettre à jour ou créer un document dans 'journalsMaint'
      const q = query(collection(db, 'journalsMaint'), where('installationID', '==', photo.installationID));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const existingDoc = querySnapshot.docs[0];
        await updateDoc(existingDoc.ref, {
          status: status,
          etat: etat,
          comment: comment,
          modificationDate: serverTimestamp(),
          photos: arrayUnion(photo.imageUri, ...photoState.additionalPhotos.map(p => p.imageUri)),
          commentHistory: oldCommentHistory,
          address: updatedAddress,
        });
      } else {
        await addDoc(collection(db, 'journalsMaint'), {
          installationID: photo.installationID,
          installationName: photo.installationName,
          status: status,
          etat: etat,
          comment: comment,
          modificationDate: serverTimestamp(),
          photos: [photo.imageUri, ...photoState.additionalPhotos.map(p => p.imageUri)],
          commentHistory: oldCommentHistory,
          address: updatedAddress,
        });
      }
      
      Alert.alert('Succès', 'Modifications sauvegardées avec succès !');
      setIsEditingStatus(false);
      setIsEditingEtat(false);
      setIsEditingComment(false);
      setIsModified(false);
    } catch (error) {
      Alert.alert('Erreur', `Impossible de sauvegarder les modifications : ${error.message}`);
      console.error('Erreur lors de la sauvegarde des modifications :', error);
    }
  };

  /**
   * Gestion des changements de statut et état
   */
  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    setIsModified(true); 
  };

  const handleEtatChange = (newEtat) => {
    setEtat(newEtat);
    setIsModified(true); 
  };

  /**
   * Gestion des changements de commentaire
   */
  const handleCommentChange = (newComment) => {
    setComment(newComment);
    setIsModified(true); 
  };

  /**
   * Gérer le focus sur le champ de commentaire
   */
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

  /**
   * Gérer le clic sur l'adresse pour ouvrir la carte
   */
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

  /**
   * Obtenir l'adresse correctement
   */
  const getAddress = () => {
    const { address } = photo;
    return address && address.trim() !== "" ? address : "Adresse non disponible";
  };

  /**
   * Fonctions pour ouvrir et fermer le menu
   */
  const openMenu = () => setIsMenuVisible(true);
  const closeMenu = () => setIsMenuVisible(false);

  /**
   * Rendu JSX
   */
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 80}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={DetailsStyle.scrollContainer}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        <View style={DetailsStyle.container}>

          {/* Slider d'images horizontal */}
          <FlatList
            data={photo.imageUris && photo.imageUris.length > 0 ? [photo.imageUri, ...photo.imageUris] : [photo.imageUri]} 
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => {
                setVisibleImage(item);
                setIsMainImageFullScreen(true);
              }}>
                <PublicImage storagePath={item} style={[DetailsStyle.largePhoto, { width: Dimensions.get('window').width * 0.9 }]} />
              </TouchableOpacity>
            )}
            keyExtractor={(item, index) => index.toString()}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            pagingEnabled={true}
            snapToAlignment="center"
          />

          {/* Icône des trois petits points pour ouvrir le menu */}
          <TouchableOpacity style={DetailsStyle.menuButton} onPress={openMenu}>
            <Entypo name="dots-three-horizontal" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Modal pour le menu */}
          <Modal 
            transparent={true} 
            visible={isMenuVisible} 
            animationType="fade"
            onRequestClose={closeMenu} // Pour gérer la fermeture avec le bouton retour Android
          >
            <TouchableWithoutFeedback onPress={closeMenu}>
              <View style={DetailsStyle.modalOverlayOption}>
                <TouchableWithoutFeedback>
                  <View style={DetailsStyle.modalContentOption}>
                    <Text style={DetailsStyle.modalTitle}>Options</Text>

                    {/* Option pour prendre une nouvelle photo additionnelle */}
                    <TouchableOpacity 
                      style={DetailsStyle.modalOption} 
                      onPress={captureNewPhotoWithCamera} 
                      disabled={photoState.isUploading}
                    >
                      <MaterialIcons name="camera-alt" size={24} color="#000" />
                      <Text style={DetailsStyle.modalText}>Prendre une nouvelle photo</Text>
                      {photoState.isUploading && <ActivityIndicator size="small" color="#000" style={{ marginLeft: 10 }} />}
                    </TouchableOpacity>

                    {/* Option pour remplacer l'image principale */}
                    <TouchableOpacity 
                      style={DetailsStyle.modalOption} 
                      onPress={replaceMainImage} 
                      disabled={photoState.isUploading}
                    >
                      <MaterialIcons name="photo-camera" size={24} color="#000" />
                      <Text style={DetailsStyle.modalText}>Remplacer l'image principale</Text>
                      {photoState.isUploading && <ActivityIndicator size="small" color="#000" style={{ marginLeft: 10 }} />}
                    </TouchableOpacity>

                    {/* Option pour supprimer la photo sélectionnée */}
                    <TouchableOpacity 
                      style={DetailsStyle.modalOption} 
                      onPress={deletePhoto} 
                      disabled={isDeleting}
                    >
                      <MaterialIcons name="delete" size={24} color="red" />
                      <Text style={DetailsStyle.modalText}>Supprimer la photo</Text>
                      {isDeleting && <ActivityIndicator size="small" color="red" style={{ marginLeft: 10 }} />}
                    </TouchableOpacity>

                    {/* Bouton pour fermer le menu */}
                    <TouchableOpacity style={DetailsStyle.modalCloseButton} onPress={closeMenu}>
                      <Text style={DetailsStyle.modalCloseText}>Fermer</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>

          {/* Informations de l'installation */}
          <Text style={DetailsStyle.title}>{photo.installationName}</Text> 

          {/* Adresse */}
          <View style={DetailsStyle.infoContainer}>
            <MaterialIcons name="location-on" size={24} color="#3498db" />
            <View style={DetailsStyle.textContainer}>
              <Text style={DetailsStyle.Prebold}>Adresse :</Text>
              <Text style={DetailsStyle.metadata} numberOfLines={2} ellipsizeMode="tail">
                {getAddress()}
              </Text>
              {/* Bouton "Voir sur la carte !" avec icône */}
              <TouchableOpacity style={DetailsStyle.mapButton} onPress={handleAddressPress}>
                <MaterialIcons name="map" size={20} color="#fff" />
                <Text style={DetailsStyle.mapButtonText}>Voir sur la carte !</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Date */}
          <View style={DetailsStyle.infoContainer}>
            <MaterialIcons name="calendar-today" size={24} color="#3498db" />
            <Text style={DetailsStyle.metadata}>
              <Text style={DetailsStyle.Prebold}> Date : </Text>{formatDate(photo.createdAt)}
            </Text>
          </View>

          {/* Type */}
          <View style={DetailsStyle.infoContainer}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={24} color="#f1c40f" />
            <Text style={DetailsStyle.metadata}>
              <Text style={DetailsStyle.Prebold}> Type : </Text>{photo.installationType || "Non disponible"}
            </Text>
          </View>

          {/* Armoire */}
          <View style={DetailsStyle.infoContainer}>
            <MaterialIcons name="door-sliding" size={24} color="#1abc9c" />
            <Text style={DetailsStyle.metadata}>
              <Text style={DetailsStyle.Prebold}> Armoire : </Text>{photo.armoire || "Non disponible"}
            </Text>
          </View>

          {/* Statut */}
          <View style={DetailsStyle.infoContainer}>
            <MaterialIcons name="verified" size={24} color={status === 'Installée' ? '#2ecc71' : '#e74c3c'} />
            <Text style={DetailsStyle.Prebold}> Statut : </Text>
            <TouchableOpacity onPress={() => setIsEditingStatus(true)}>
              <Text style={{ color: status === 'Installée' || status === 'Fonctionnelle' ? '#2ecc71' : '#e74c3c' }}>
                {status}
              </Text>
            </TouchableOpacity>

            {/* Modal pour changer le statut */}
            <Modal 
              visible={isEditingStatus} 
              transparent={true} 
              animationType="slide"
              onRequestClose={() => setIsEditingStatus(false)}
            >
              <TouchableWithoutFeedback onPress={() => setIsEditingStatus(false)}>
                <View style={DetailsStyle.modalOverlay}>
                  <TouchableWithoutFeedback>
                    <View style={DetailsStyle.modalContent}>
                      <Text style={DetailsStyle.modalTitle}>Changer le statut</Text>
                      <TouchableOpacity
                        style={[DetailsStyle.modalOptionStatut, status === 'Installée' && DetailsStyle.optionActive]}
                        onPress={() => { handleStatusChange('Installée'); setIsEditingStatus(false); }}
                      >
                        <Text style={DetailsStyle.modalText}>Installée</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[DetailsStyle.modalOptionStatut, status === 'Non installée' && DetailsStyle.optionActive]}
                        onPress={() => { handleStatusChange('Non installée'); setIsEditingStatus(false); }}
                      >
                        <Text style={DetailsStyle.modalText}>Non installée</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setIsEditingStatus(false)} style={DetailsStyle.modalCloseButton}>
                        <Text style={DetailsStyle.modalCloseText}>Annuler</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              </TouchableWithoutFeedback>
            </Modal>
          </View>

          {/* État */}
          <View style={DetailsStyle.infoContainer}>
            <MaterialIcons name="report-problem" size={24} color={etat === 'Fonctionnelle' ? '#2ecc71' : '#e74c3c'} />
            <Text style={DetailsStyle.Prebold}> État : </Text>
            <TouchableOpacity onPress={() => setIsEditingEtat(true)}>
              <Text style={{ color: etat === 'Fonctionnelle' ? '#2ecc71' : '#e74c3c' }}>
                {etat}
              </Text>
            </TouchableOpacity>

            {/* Modal pour changer l'état */}
            <Modal 
              visible={isEditingEtat} 
              transparent={true} 
              animationType="slide"
              onRequestClose={() => setIsEditingEtat(false)}
            >
              <TouchableWithoutFeedback onPress={() => setIsEditingEtat(false)}>
                <View style={DetailsStyle.modalOverlay}>
                  <TouchableWithoutFeedback>
                    <View style={DetailsStyle.modalContent}>
                      <Text style={DetailsStyle.modalTitle}>Changer l'état</Text>
                      <TouchableOpacity
                        style={[DetailsStyle.modalOption, etat === 'Fonctionnelle' && DetailsStyle.optionActive]}
                        onPress={() => { handleEtatChange('Fonctionnelle'); setIsEditingEtat(false); }}
                      >
                        <Text style={DetailsStyle.modalText}>Fonctionnelle</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[DetailsStyle.modalOption, etat === 'En panne' && DetailsStyle.optionActive]}
                        onPress={() => { handleEtatChange('En panne'); setIsEditingEtat(false); }}
                      >
                        <Text style={DetailsStyle.modalText}>En panne</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setIsEditingEtat(false)} style={DetailsStyle.modalCloseButton}>
                        <Text style={DetailsStyle.modalCloseText}>Annuler</Text>
                      </TouchableOpacity> 
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              </TouchableWithoutFeedback>
            </Modal>
          </View>

          {/* Commentaire */}
          <View style={DetailsStyle.infoContainer}>
            <MaterialCommunityIcons name="comment-text" size={24} color="#34495e" />
            <View style={DetailsStyle.commentSection}>
              <Text style={DetailsStyle.Prebold}> Information : </Text>
              {isEditingComment ? (
                <View style={DetailsStyle.commentInputContainer}>
                  <TextInput
                    ref={commentInputRef}
                    style={[DetailsStyle.commentInput, DetailsStyle.commentInputActive]}
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
                  <Text style={DetailsStyle.commentText}>{comment}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Bouton pour ajouter une photo Additionnelle */}
          <TouchableOpacity 
            style={DetailsStyle.button} 
            onPress={captureNewPhoto} 
            disabled={photoState.isUploading}
          >
            <MaterialIcons name="camera-alt" size={24} color="#fff" style={DetailsStyle.iconStyle} />
            <Text style={DetailsStyle.buttonText}>Ajouter une photo</Text>
            {photoState.isUploading && <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 10 }} />}
          </TouchableOpacity>

          {/* Photos Additionnelles */}
          <Text style={DetailsStyle.title}>Photos Additionnelles :</Text>
          {photoState.loading ? (
            <ActivityIndicator size="large" color="#1abc9c" style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={photoState.additionalPhotos}
              keyExtractor={(item, index) => index.toString()}
              numColumns={3}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => {
                  setSelectedAdditionalPhoto(item);
                  setIsAdditionalPhotoModalVisible(true);
                }}>
                  <PublicImage 
                    storagePath={item.imageUri}
                    style={DetailsStyle.additionalPhoto}
                  />
                </TouchableOpacity>
              )}
              scrollEnabled={false}
            />
          )}
          {photoState.error && <Text style={DetailsStyle.errorText}>{photoState.error}</Text>}

          {/* Modal pour afficher une photo additionnelle en plein écran */}
          {isAdditionalPhotoModalVisible && selectedAdditionalPhoto && (
            <Modal 
              transparent={true} 
              visible={isAdditionalPhotoModalVisible} 
              animationType="fade"
              onRequestClose={() => setIsAdditionalPhotoModalVisible(false)}
            >
              <TouchableWithoutFeedback onPress={() => setIsAdditionalPhotoModalVisible(false)}>
                <View style={DetailsStyle.fullscreenModalOverlay}>
                  <TouchableWithoutFeedback>
                    <View style={DetailsStyle.fullscreenModalContent}>
                      <TouchableOpacity style={DetailsStyle.fullscreenModalClose} onPress={() => setIsAdditionalPhotoModalVisible(false)}>
                        <MaterialIcons name="close" size={30} color="#fff" />
                      </TouchableOpacity>
                      <Image source={{ uri: selectedAdditionalPhoto.imageUri }} style={DetailsStyle.fullscreenImage} />
                      {selectedAdditionalPhoto.comment ? (
                        <View style={DetailsStyle.fullscreenCommentContainer}>
                          <Text style={DetailsStyle.fullscreenComment}>{selectedAdditionalPhoto.comment}</Text>
                        </View>
                      ) : null}
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              </TouchableWithoutFeedback>
            </Modal>
          )}

          {/* Modal pour afficher l'image principale en plein écran */}
          <Modal 
            transparent={true} 
            visible={isMainImageFullScreen} 
            animationType="fade"
            onRequestClose={() => setIsMainImageFullScreen(false)}
          >
            <TouchableWithoutFeedback onPress={() => setIsMainImageFullScreen(false)}>
              <View style={DetailsStyle.fullscreenModalOverlay}>
                <TouchableWithoutFeedback>
                  <View style={DetailsStyle.fullscreenModalContent}>
                    <TouchableOpacity style={DetailsStyle.fullscreenModalClose} onPress={() => setIsMainImageFullScreen(false)}>
                      <MaterialIcons name="close" size={30} color="#fff" />
                    </TouchableOpacity>
                    <Image source={{ uri: selectedImage }} style={DetailsStyle.fullscreenImage} />
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>

        </View>
      </ScrollView>

      {/* Bouton de sauvegarde des modifications */}
      {isModified && (
        <View style={DetailsStyle.footer}>
          <TouchableOpacity 
            style={DetailsStyle.saveButton} 
            onPress={saveUpdates} 
            disabled={photoState.isUploading}
          >
            <Text style={DetailsStyle.buttonText}>Sauvegarder</Text>
            {photoState.isUploading && <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 10 }} />}
          </TouchableOpacity>
        </View>
      )}

      {/* Modal pour ajouter une nouvelle photo de maintenance */}
      <Modal 
        visible={modalVisible} 
        animationType="slide" 
        transparent={false}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={DetailsStyle.modalOverlay}>
              {capturedPhotoUri && (
                <Image source={{ uri: capturedPhotoUri }} style={DetailsStyle.fullscreenImage} />
              )}
              <View style={DetailsStyle.modalTopButtons}>
                <Pressable style={DetailsStyle.iconButton} onPress={() => setModalVisible(false)}>
                  <MaterialIcons name="close" size={34} color="white" />
                </Pressable>
                <Pressable style={DetailsStyle.iconButton} onPress={captureNewPhoto}>
                  <Entypo name="forward" size={34} color="white" />
                </Pressable>
              </View>
              <View style={DetailsStyle.transparentCommentContainer}>
                <TextInput
                  ref={commentAdditionalInputRef}
                  style={DetailsStyle.transparentCommentInput}
                  placeholder="Ajouter un commentaire"
                  placeholderTextColor="rgba(255, 255, 255, 0.7)"
                  value={commentAdditional}
                  onChangeText={setCommentAdditional}
                  multiline
                />
                <Pressable 
                  style={DetailsStyle.saveIconInsideInput} 
                  onPress={saveAndUploadPhoto} 
                  disabled={photoState.isUploading}
                >
                  <FontAwesome name="send" size={18} color="#fff" /> 
                  {photoState.isUploading && <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 10 }} />}
                </Pressable>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}
