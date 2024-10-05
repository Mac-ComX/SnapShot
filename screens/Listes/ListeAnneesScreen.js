import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';

export default function ListeAnneesScreen() {
  const [annees, setAnnees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  // Fonction pour extraire l'année à partir de createdAt
  const getYearFromCreatedAt = useCallback((createdAt) => {
    if (!createdAt) return null;

    if (typeof createdAt === 'string') {
      const [day, month, year] = createdAt.split(',')[0].split('/');
      const formattedDate = `${year}-${month}-${day}`;
      const date = new Date(formattedDate);
      return !isNaN(date) ? date.getFullYear() : null;
    }

    if (createdAt.seconds) {
      return new Date(createdAt.seconds * 1000).getFullYear();
    }

    return null;
  }, []);

  // Fonction pour récupérer les données de Firebase et extraire les années uniques
  const fetchAnnees = useCallback(async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'decorations'));
      const years = querySnapshot.docs
        .map((doc) => getYearFromCreatedAt(doc.data().createdAt))
        .filter((year) => year);
      setAnnees([...new Set(years)]);
    } catch (error) {
      console.error('Erreur lors de la récupération des années :', error);
      Alert.alert('Erreur', 'Impossible de récupérer les années.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getYearFromCreatedAt]);

  // Appeler fetchAnnees lors du montage du composant
  useEffect(() => {
    fetchAnnees();
  }, [fetchAnnees]);

  // Fonction pour gérer le rafraîchissement
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAnnees();
  }, [fetchAnnees]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Chargement des années...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {annees.length === 0 ? (
        <View style={styles.noDataContainer}>
          <Text>Aucune année disponible.</Text>
        </View>
        
      ) : (
        <>
          <Text style={styles.title}>Sélectionnez une année:</Text>
          <FlatList
            data={annees}
            keyExtractor={(item) => item.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.anneeButton}
                onPress={() => navigation.navigate('ListeVillesScreen', { annee: item })}
              >
                <Text style={styles.anneeText}>{item}</Text>
              </TouchableOpacity>
            )}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
        </>
      )}
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
  anneeButton: {
    padding: 15,
    backgroundColor: '#002439',
    marginVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  anneeText: {
    color: '#fff',
    fontSize: 18,
  },
});