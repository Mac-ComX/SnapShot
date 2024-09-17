import React, { useState } from 'react';
import { View, ScrollView, TextInput, Button, StyleSheet, Alert, TouchableOpacity, Text } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function FormScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { imageUri } = route.params;

  const [installationName, setInstallationName] = useState('');
  const [installationType, setInstallationType] = useState('Motif');
  const [installationStatus, setInstallationStatus] = useState('Installée');
  const [functionalityStatus, setFunctionalityStatus] = useState('Fonctionnelle');
  const [repairUrgency, setRepairUrgency] = useState('Non urgent');
  const [comment, setComment] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Gestion de l'affichage des pickers
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showFunctionalityPicker, setShowFunctionalityPicker] = useState(false);
  const [showUrgencyPicker, setShowUrgencyPicker] = useState(false);

  // Fonction pour obtenir la localisation et les coordonnées GPS
  const getLocationAndAddress = async () => {
    try {
      console.log("Demande de permissions...");
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission refusée pour accéder à la localisation.');
        Alert.alert('Erreur', errorMsg);
        return;
      }

      console.log("Permissions accordées, obtention de la localisation...");
      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,  // Précision GPS la plus élevée possible
      });

      setLatitude(coords.latitude);
      setLongitude(coords.longitude);

      console.log("Coordonnées GPS obtenues:", coords.latitude, coords.longitude);  // Log des coordonnées GPS

      // Récupérer l'adresse à partir des coordonnées GPS
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`);
      const data = await response.json();

      console.log("Données de géolocalisation obtenues:", data);  // Log des données d'adresse

      if (data && data.address) {
        const completeAddress = `${data.address.house_number || ''} ${data.address.road || ''}, ${data.address.city || data.address.town || data.address.village || 'Inconnu'}`;
        setAddress(completeAddress);  // Met à jour le champ adresse avec l'adresse complète
        console.log("Adresse détectée:", completeAddress);
      } else {
        Alert.alert('Erreur', 'Impossible d\'obtenir l\'adresse depuis les coordonnées GPS.');
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de la localisation:", error);  // Log de l'erreur
      Alert.alert('Erreur', 'Échec lors de la récupération de la localisation.');
    }
  };

  // Fonction pour enregistrer les informations dans Firestore
  const savePhoto = async () => {
    try {
      if (!imageUri || !installationName || !address || !latitude || !longitude) {
        Alert.alert('Erreur', 'Veuillez remplir tous les champs nécessaires.');
        return;
      }

      console.log("Enregistrement des données dans Firestore...");
      await addDoc(collection(db, 'decorations'), {
        imageUri,
        installationName,
        installationType,
        installationStatus,
        functionalityStatus,
        repairUrgency,
        address,
        latitude,
        longitude,
        comment,
        createdAt: new Date().toLocaleString(),
      });

      Alert.alert('Succès', 'Informations enregistrées avec succès !');
      console.log("Enregistrement réussi avec les coordonnées:", latitude, longitude);
      
      route.params.imageUri = null;
      navigation.popToTop();  // Retour à l'écran de la carte
    } catch (error) {
      console.error("Erreur lors de l'enregistrement dans Firestore:", error);
      Alert.alert('Erreur', 'Impossible d\'enregistrer les informations.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.formContainer}>
      <TextInput
        style={styles.input}
        placeholder="Nom de l'installation"
        value={installationName}
        onChangeText={setInstallationName}
        placeholderTextColor="#888"
      />

      <TextInput
        style={styles.input}
        placeholder="Adresse complète"
        value={address}
        editable={false}  // Non modifiable par l'utilisateur
        placeholderTextColor="#888"
      />

      <Button title="Obtenir l'adresse" onPress={getLocationAndAddress} />

      <Text style={styles.pickerTitle}>Type de décorations</Text>
      <TouchableOpacity onPress={() => setShowTypePicker(!showTypePicker)} style={styles.pickerButton}>
        <Text>{installationType}</Text>
      </TouchableOpacity>
      {showTypePicker && (
        <Picker
          selectedValue={installationType}
          onValueChange={(itemValue) => {
            setInstallationType(itemValue);
            setShowTypePicker(false);
          }}
        >
          <Picker.Item label="Motif Candélabre" value="Motif Candélabre" />
          <Picker.Item label="Motif Traversée" value="Motif Traversée" />
          <Picker.Item label="Guirlande Traversée" value="Guirlande Traversée" />
          <Picker.Item label="Guirlande Arbre" value="Guirlande Arbre" />
          <Picker.Item label="Structure" value="Structure" />
        </Picker>
      )}

      <Text style={styles.pickerTitle}>Statut d'installation</Text>
      <TouchableOpacity onPress={() => setShowStatusPicker(!showStatusPicker)} style={styles.pickerButton}>
        <Text>{installationStatus}</Text>
      </TouchableOpacity>
      {showStatusPicker && (
        <Picker
          selectedValue={installationStatus}
          onValueChange={(itemValue) => {
            setInstallationStatus(itemValue);
            setShowStatusPicker(false);
          }}
        >
          <Picker.Item label="Installée" value="Installée" />
          <Picker.Item label="Non installée" value="Non installée" />
        </Picker>
      )}

      <Text style={styles.pickerTitle}>État de fonctionnement</Text>
      <TouchableOpacity onPress={() => setShowFunctionalityPicker(!showFunctionalityPicker)} style={styles.pickerButton}>
        <Text>{functionalityStatus}</Text>
      </TouchableOpacity>
      {showFunctionalityPicker && (
        <Picker
          selectedValue={functionalityStatus}
          onValueChange={(itemValue) => {
            setFunctionalityStatus(itemValue);
            setShowFunctionalityPicker(false);
          }}
        >
          <Picker.Item label="Fonctionnelle" value="Fonctionnelle" />
          <Picker.Item label="En panne" value="En panne" />
          <Picker.Item label="Hors service" value="Hors service" />
        </Picker>
      )}

      <Text style={styles.pickerTitle}>Urgence de réparation</Text>
      <TouchableOpacity onPress={() => setShowUrgencyPicker(!showUrgencyPicker)} style={styles.pickerButton}>
        <Text>{repairUrgency}</Text>
      </TouchableOpacity>
      {showUrgencyPicker && (
        <Picker
          selectedValue={repairUrgency}
          onValueChange={(itemValue) => {
            setRepairUrgency(itemValue);
            setShowUrgencyPicker(false);
          }}
        >
          <Picker.Item label="Non urgent" value="Non urgent" />
          <Picker.Item label="Urgent" value="Urgent" />
        </Picker>
      )}

      <TextInput
        style={[styles.input, { height: 100 }]}
        placeholder="Ajouter un commentaire"
        placeholderTextColor="#888"
        value={comment}
        onChangeText={setComment}
        multiline
      />

      <Button title="Enregistrer" onPress={savePhoto} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    padding: 20,
    backgroundColor: '#f4f4f4',
    borderRadius: 10,
    width: '90%',
    alignSelf: 'center',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  pickerTitle: {
    marginBottom: 5,
    fontWeight: 'bold',
  },
});
