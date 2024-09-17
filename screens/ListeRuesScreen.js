import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { collection, onSnapshot } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { db } from '../services/firebase';

export default function ListeRuesScreen({ route }) {
  const { ville } = route.params;  // Récupérer la ville depuis les paramètres de navigation
  const [rues, setRues] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  // Charger les rues de la ville sélectionnée
  useEffect(() => {
    const fetchRues = async () => {
      try {
        const unsubscribe = onSnapshot(collection(db, 'decorations'), (snapshot) => {
          const ruesSet = new Set();
          snapshot.forEach(doc => {
            const data = doc.data();
            if (data.ville === ville && data.rue) {
              ruesSet.add(data.rue);  // Ajouter la rue si elle appartient à la ville
            }
          });
          setRues(Array.from(ruesSet));  // Convertir en tableau pour supprimer les doublons
          setLoading(false);
        });
        return () => unsubscribe();
      } catch (error) {
        console.error('Erreur lors de la récupération des rues :', error);
        Alert.alert('Erreur', 'Impossible de récupérer les rues.');
        setLoading(false);
      }
    };
    fetchRues();
  }, [ville]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Chargement des rues...</Text>
      </View>
    );
  }

  if (rues.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>Aucune rue disponible pour {ville}.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sélectionnez une rue dans {ville} :</Text>
      <FlatList
        data={rues}
        keyExtractor={(item) => item}  // Utiliser le nom de la rue comme clé
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.streetButton} 
            onPress={() => navigation.navigate('PhotosRueScreen', { ville, rue: item })}  // Naviguer vers les photos de la rue
          >
            <Text style={styles.streetText}>{item}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  streetButton: {
    padding: 15,
    backgroundColor: '#ffa500',
    marginVertical: 10,
    borderRadius: 10,
  },
  streetText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
  noDataText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#333',
  },
});
