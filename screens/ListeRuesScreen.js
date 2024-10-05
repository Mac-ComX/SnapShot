import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { db } from '../services/firebase';

export default function ListeRuesScreen({ route }) {
  const { ville } = route.params;  // Récupérer la ville depuis les paramètres de navigation
  const [rues, setRues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // État pour le rafraîchissement
  const navigation = useNavigation();

  // Fonction pour récupérer les données depuis Firestore
  const fetchRues = useCallback(async () => {
    try {
      setLoading(true); // Optionnel : vous pouvez laisser ou retirer cette ligne pour le spinner initial
      const decorationsQuery = query(
        collection(db, 'decorations'),
        where('ville', '==', ville),
        where('functionalityStatus', '==', 'Fonctionnelle')
      );
      const querySnapshot = await getDocs(decorationsQuery);
      const ruesSet = new Set();

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.rue) {
          ruesSet.add(data.rue);  // Ajouter la rue si elle est disponible et fonctionnelle
        }
      });

      const sortedRues = Array.from(ruesSet).sort();  // Convertir en tableau et trier par ordre alphabétique
      setRues(sortedRues);
    } catch (error) {
      console.error('Erreur lors de la récupération des rues :', error);
      Alert.alert('Erreur', 'Impossible de récupérer les rues.');
    } finally {
      setLoading(false); // Fin du chargement
      setRefreshing(false); // Fin du rafraîchissement
    }
  }, [ville]);

  // Charger les données au montage du composant
  useEffect(() => {
    fetchRues();
  }, [fetchRues]);

  // Fonction de rafraîchissement pour le pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true); // Déclenche le rafraîchissement
    fetchRues(); // Recharger les données
  }, [fetchRues]);

  if (loading && !refreshing) {
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
      <Text style={styles.title}>Sélectionnez une rue de {ville} :</Text>
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}  // Contrôler l'état de rafraîchissement
            onRefresh={onRefresh}    // Fonction pour rafraîchir la liste
          />
        }
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  streetButton: {
    padding: 15,
    backgroundColor: '#66b08d',
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
