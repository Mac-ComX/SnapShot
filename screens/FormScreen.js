import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, TextInput, Button, Alert, TouchableOpacity, Text, Modal, Dimensions, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../services/firebase';
import FormStyle from '../Styles/FormStyle';

const GOOGLE_API_KEY = 'AIzaSyAdPUePDEdtyX6tEH6c6JkQTrP6fsHPnoE'; // Replace with your Google API key

const { height } = Dimensions.get('window');

export default function FormScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const scrollViewRef = useRef();

  const [localImageUri, setLocalImageUri] = useState(null);
  const [installationName, setInstallationName] = useState('');
  const [installationType, setInstallationType] = useState('Motif Candélabre');
  const [installationStatus, setInstallationStatus] = useState('Installée');
  const [functionalityStatus, setFunctionalityStatus] = useState('Fonctionnelle');
  const [comment, setComment] = useState('Numéro d\'affaire: 5418L ');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [rue, setRue] = useState('');
  const [ville, setVille] = useState('');
  const [numeroRue, setNumeroRue] = useState('');
  const [armoire, setArmoire] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [showNumeroRueModal, setShowNumeroRueModal] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showFunctionalityPicker, setShowFunctionalityPicker] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      scrollViewRef.current?.scrollTo({ y: e.endCoordinates.height, animated: true });
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    });

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  useEffect(() => {
    if (route.params?.imageUri) {
      setLocalImageUri(route.params.imageUri);
    }
  }, [route.params]);

  const extractProperName = (address) => {
    const excludedWords = ['le', 'la', 'les', 'de', 'du', 'des', 'rue', 'avenue', 'boulevard', 'place', 'impasse', 'chemin', 'allée'];
    return address
      .split(' ')
      .filter((word) => !excludedWords.includes(word.toLowerCase()))
      .join('');
  };

  const getInstallationTypeAbbreviation = (installationType) => {
    const typeMap = {
      'Motif Candélabre': 'MCD',
      'Motif Traversée': 'MTR',
      'Guirlande Traversée': 'GTR',
      'Guirlande Arbre': 'GAR',
      'Structure': 'STC',
      'Armoire': 'ARM',
    };
    return typeMap[installationType] || 'UNK';
  };

  const getVilleAbbreviation = (city) => {
    const cityMap = {
      'roubaix': 'RBX',
      'villeneuve-d\'ascq': 'VDA',
      'sainghin-en-weppes': 'SEW',
      'don': 'DON',
    };
    const normalizedCity = city.toLowerCase();
    return cityMap[normalizedCity] || normalizedCity?.slice(0, 3).toUpperCase() || 'UNK';
  };

  const fetchAddressFromGoogle = async (lat, lon) => {
    try {
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${GOOGLE_API_KEY}`);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const addressComponents = data.results[0].address_components;
        const streetNumber = addressComponents.find(component => component.types.includes('street_number'))?.long_name || 'Inconnu';
        const street = addressComponents.find(component => component.types.includes('route'))?.long_name || 'Inconnu';
        const city = addressComponents.find(component => component.types.includes('locality'))?.long_name || 'Inconnu';
        const postalCode = addressComponents.find(component => component.types.includes('postal_code'))?.long_name || '';

        setNumeroRue(streetNumber);
        setRue(street);
        setVille(city);

        const completeAddress = `${streetNumber} ${street}, ${city} ${postalCode}`;
        setAddress(completeAddress);

        return completeAddress;
      } else {
        Alert.alert("Erreur", "Aucune adresse trouvée avec Google Maps API.");
        return 'Adresse inconnue';
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de récupérer l'adresse depuis Google.");
      return 'Adresse inconnue';
    }
  };

  const normalizeAndSimplifyRue = (rue) => {
    const excludedWords = ['rue', 'Avenue', 'avenue', 'boulevard', 'place', 'impasse', 'chemin', 'allée', 'le', 'la', 'les', 'de', 'du', 'des', 'l\''];
    
    return rue
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .split(' ')
      .filter(word => !excludedWords.includes(word))
      .join('');
  };

  const generateLocationAndName = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission refusée pour accéder à la localisation.');
        Alert.alert('Erreur', errorMsg);
        return;
      }

      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      setLatitude(coords.latitude);
      setLongitude(coords.longitude);

      if (!address || address === 'Adresse inconnue') {
        const completeAddress = await fetchAddressFromGoogle(coords.latitude, coords.longitude);
        setAddress(completeAddress);
      }

      const properRueName = normalizeAndSimplifyRue(rue);
      const installationTypeAbbreviation = getInstallationTypeAbbreviation(installationType);
      const villeAbbreviation = getVilleAbbreviation(ville);
      const date = new Date();
      const formattedDate = `${String(date.getDate()).padStart(2, '0')}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getFullYear()).slice(-2)}`;

      const installationsRef = collection(db, 'decorations');
      const q = query(installationsRef,
        where('installationType', '==', installationType),
        where('rue', '==', rue));

      const querySnapshot = await getDocs(q);
      const numberOfInstallations = querySnapshot.size + 1;

      const name = `${installationTypeAbbreviation}-${String(numberOfInstallations).padStart(2, '0')}-${properRueName}${villeAbbreviation}-${formattedDate}`;
      setInstallationName(name);

    } catch (error) {
      Alert.alert('Erreur', 'Echec lors de la récupération de la localisation ou de la génération du nom.');
    }
  };

  useEffect(() => {
    if (latitude && longitude && rue.trim() && ville.trim()) {
      generateLocationAndName();
    }
  }, [latitude, longitude, rue, ville]);

  const savePhoto = async () => {
    try {
      if (!localImageUri || !installationName || !address || !latitude || !longitude || !rue || !ville || !numeroRue || !armoire) {
        Alert.alert('Erreur', 'Veuillez remplir tous les champs nécessaires.');
        return;
      }

      const localUri = `${FileSystem.documentDirectory}${installationName}.jpg`;
      await FileSystem.copyAsync({
        from: localImageUri,
        to: localUri,
      });

      const response = await fetch(localImageUri);
      const blob = await response.blob();
      const photoRef = ref(storage, `photos/${installationName}-${Date.now()}.jpg`);
      await uploadBytes(photoRef, blob);
      const downloadURL = await getDownloadURL(photoRef);

      const installationID = `${installationName}-${latitude}-${longitude}`;

      // Check if the installationID already exists
      const installationsRef = collection(db, 'decorations');
      const q = query(installationsRef, where('installationID', '==', installationID));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        Alert.alert('Doublon', 'Une installation avec cet ID existe déjà.');
        return;
      }

      await addDoc(collection(db, 'decorations'), {
        installationID,
        imageUri: downloadURL,
        localImageUri: localUri,
        installationName,
        installationType,
        installationStatus,
        functionalityStatus,
        address,
        latitude,
        longitude,
        rue,
        numeroRue,
        ville,
        armoire,
        comment,
        createdAt: new Date().toLocaleString(),
      });

      Alert.alert('Succès', 'Photo et informations enregistrées avec succès !');
      navigation.popToTop();
    } catch (error) {
      console.error("Erreur d'enregistrement:", error);
      Alert.alert('Erreur', `Impossible d'enregistrer les informations: ${error.message}`);
    }
  };

  const handleNumeroRueUpdate = () => {
    const updatedAddress = address.replace('Inconnu', numeroRue);
    setAddress(updatedAddress);
    setShowNumeroRueModal(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView ref={scrollViewRef} contentContainerStyle={[FormStyle.formContainer, { minHeight: height }]}>
        <Text style={FormStyle.title}>Informations Techniques</Text>

        <TextInput style={FormStyle.input} placeholder="Nom de l'installation" value={installationName} editable={false} placeholderTextColor="#888" />

        <TextInput 
          style={FormStyle.input} 
          placeholder="Adresse complète" 
          value={address} 
          editable={true} 
          onChangeText={setAddress}
          placeholderTextColor="#888" 
        />

        <TouchableOpacity style={FormStyle.button} onPress={generateLocationAndName}>
          <Text style={FormStyle.buttonText}>Générer</Text>
        </TouchableOpacity>

        <Text style={FormStyle.pickerTitle}>Type de décorations</Text>
        <TouchableOpacity onPress={() => setShowTypePicker(!showTypePicker)} style={FormStyle.pickerButton}>
          <Text>{installationType}</Text>
        </TouchableOpacity>
        {showTypePicker && (
          <Picker selectedValue={installationType} onValueChange={(itemValue) => { setInstallationType(itemValue); setShowTypePicker(false); }}>
            <Picker.Item label="Motif Candélabre" value="Motif Candélabre" />
            <Picker.Item label="Motif Traversée" value="Motif Traversée" />
            <Picker.Item label="Guirlande Traversée" value="Guirlande Traversée" />
            <Picker.Item label="Guirlande Arbre" value="Guirlande Arbre" />
            <Picker.Item label="Structure" value="Structure" />
            <Picker.Item label="Armoire" value="Armoire" />
          </Picker>
        )}

        <Text style={FormStyle.pickerTitle}>Statut d'installation</Text>
        <TouchableOpacity onPress={() => setShowStatusPicker(!showStatusPicker)} style={FormStyle.pickerButton}>
          <Text>{installationStatus}</Text>
        </TouchableOpacity>
        {showStatusPicker && (
          <Picker selectedValue={installationStatus} onValueChange={(itemValue) => { setInstallationStatus(itemValue); setShowStatusPicker(false); }}>
            <Picker.Item label="Installée" value="Installée" />
            <Picker.Item label="Non installée" value="Non installée" />
          </Picker>
        )}

        <Text style={FormStyle.pickerTitle}>État de fonctionnement</Text>
        <TouchableOpacity onPress={() => setShowFunctionalityPicker(!showFunctionalityPicker)} style={FormStyle.pickerButton}>
          <Text>{functionalityStatus}</Text>
        </TouchableOpacity>
        {showFunctionalityPicker && (
          <Picker selectedValue={functionalityStatus} onValueChange={(itemValue) => { setFunctionalityStatus(itemValue); setShowFunctionalityPicker(false); }}>
            <Picker.Item label="Fonctionnelle" value="Fonctionnelle" />
            <Picker.Item label="En panne" value="En panne" />
          </Picker>
        )}

        <Text style={FormStyle.pickerTitle}>Armoire</Text>
        <TextInput style={FormStyle.input} placeholder="Numéro de l'armoire" value={armoire} onChangeText={setArmoire} placeholderTextColor="#888" />

        <TextInput style={[FormStyle.input, { height: 90 }]} placeholder="Ajouter un commentaire" placeholderTextColor="#888" value={comment} onChangeText={setComment} multiline />

        <TouchableOpacity style={[FormStyle.button, FormStyle.saveButton]} onPress={savePhoto}>
          <Text style={FormStyle.buttonText}>Enregistrer</Text>
        </TouchableOpacity>

        <Modal transparent={true} visible={showNumeroRueModal} onRequestClose={() => setShowNumeroRueModal(false)}>
          <View style={FormStyle.modalContainer}>
            <View style={FormStyle.modalContent}>
              <Text style={FormStyle.modalTitle}>Entrez le numéro de rue</Text>
              <TextInput style={FormStyle.input} placeholder="Numéro de rue" value={numeroRue} onChangeText={setNumeroRue} keyboardType="numeric" />
              <TouchableOpacity style={FormStyle.modalButton} onPress={handleNumeroRueUpdate}>
                <Text style={FormStyle.buttonText}>Valider</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
