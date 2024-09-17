// screens/ListeVillesScreen.js
import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import useFirestoreData from '../hooks/useFirestoreData';  // Import du hook personnalisé
import { useNavigation } from '@react-navigation/native';

export default function ListeVillesScreen() {
  const { data: villes, loading, error } = useFirestoreData('decorations', [], true);  // Utilisation du hook
  const navigation = useNavigation();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Chargement des villes...</Text>
      </View>
    );
  }

  if (error) {
    Alert.alert('Erreur', 'Impossible de récupérer les villes.');
    return null;
  }

  // Utiliser un Set pour avoir des villes uniques
  const uniqueVilles = [...new Set(villes.map(item => item.ville))];  // Éliminer les doublons de villes

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sélectionnez une ville :</Text>
      <FlatList
        data={uniqueVilles}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.cityButton} 
            onPress={() => navigation.navigate('ListeRuesScreen', { ville: item })}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  cityButton: {
    padding: 15,
    backgroundColor: '#1e90ff',
    marginVertical: 10,
    borderRadius: 10,
  },
  cityText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
});
