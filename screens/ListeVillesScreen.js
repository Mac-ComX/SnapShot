import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function ListeVillesScreen() {
  const [villes, setVilles] = useState([]);
  const [loading, setLoading] = useState(true);
  const route = useRoute();  // Pour accéder à l'année sélectionnée
  const { annee } = route.params;  // Récupérer l'année depuis les paramètres
  const navigation = useNavigation();

  useEffect(() => {
    const fetchVilles = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'decorations'));
        const villesForAnnee = querySnapshot.docs
          .filter((doc) => {
            const data = doc.data();
            const createdAt = data.createdAt;

            // Extraire l'année à partir de createdAt (comme dans ListeAnneesScreen)
            const [day, month, year] = createdAt.split(',')[0].split('/');
            const docYear = year;

            return docYear === annee.toString();  // Filtrer uniquement les documents de l'année sélectionnée
          })
          .map((doc) => doc.data().ville)
          .filter((ville, index, self) => ville && self.indexOf(ville) === index);  // Éliminer les doublons

        setVilles(villesForAnnee);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors de la récupération des villes :', error);
        Alert.alert('Erreur', 'Impossible de récupérer les villes.');
        setLoading(false);
      }
    };

    fetchVilles();
  }, [annee]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Chargement des villes...</Text>
      </View>
    );
  }

  if (villes.length === 0) {
    return (
      <View style={styles.noDataContainer}>
        <Text>Aucune ville disponible pour l'année {annee}.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sélectionnez une ville:</Text>
      <FlatList
        data={villes}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.cityButton}
            onPress={() => navigation.navigate('ListeRuesScreen', { ville: item, annee })}
          >
            <Text style={styles.cityText}>{item}</Text>
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
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  cityButton: {
    padding: 15,
    backgroundColor: '#1b484e',
    marginVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  cityText: {
    color: '#fff',
    fontSize: 18,
  },
});
