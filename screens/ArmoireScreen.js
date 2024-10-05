import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Animated, RefreshControl } from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Swipeable } from 'react-native-gesture-handler';
import PublicImage from '../components/PublicImage'; // Assurez-vous d'avoir ce composant dans votre projet
import { useNavigation } from '@react-navigation/native';

export default function ArmoireScreen() {
  const [armoires, setArmoires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  

  const fetchArmoires = async () => {
    try {
      const q = query(collection(db, 'decorations'), where('installationType', '==', 'Armoire'));
      const querySnapshot = await getDocs(q);
      const armoiresData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setArmoires(armoiresData);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de récupérer les armoires.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchArmoires();
  }, []);
  

  const onRefresh = () => {
    setRefreshing(true);
    fetchArmoires();
  };

  const openArmoireDetails = (armoire) => {
    navigation.navigate('DetailsArmoireScreen', { armoire });
  };

  const renderArmoireItem = ({ item }) => {
    return <ArmoireItem item={item} />;
  };

  const ArmoireItem = ({ item }) => {
    const swipeableRef = useRef(null);
    const formatDate = (dateString) => {
        if (!dateString) return 'Date non spécifiée';
        const date = parseDate(dateString);
        if (!date) return 'Date invalide';
        const options = {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          hour: '2-digit',
          minute: '2-digit',
        };
        return date.toLocaleDateString('fr-FR', options);
      };
      // Fonction pour parser la date à partir de la chaîne de caractères
  const parseDate = (dateString) => {
    if (!dateString) return null;
    const [datePart, timePart] = dateString.split(', ');
    const [day, month, year] = datePart.split('/');
    const [hour, minute] = timePart.split(':');
    const date = new Date(year, month - 1, day, hour, minute);
    return date;
  };

    return (
      <View style={styles.itemContainer}>
        <Swipeable ref={swipeableRef} overshootRight={false} friction={2} containerStyle={styles.swipeableContainer}>
          <TouchableOpacity onPress={() => openArmoireDetails(item)}>
            <View style={styles.card}>
              {/* Placeholder d'image ou une vraie image via Firebase si vous avez des images */}
              <PublicImage storagePath={item.imageUri} style={styles.photo} />
              <View style={styles.textContainer}>
                <Text style={styles.title}>{item.armoire || 'Nom indisponible'}</Text>
                <Text style={styles.status}>{item.numeroRue || 'Statut non spécifié'} {item.rue || 'Statut non spécifié'}, {item.ville || 'Statut non spécifié'}</Text>
                <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </Swipeable>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Chargement des armoires...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={armoires}
        renderItem={renderArmoireItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.noItemsText}>Aucune armoire disponible.</Text>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f4f6',
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContainer: {
    marginBottom: 15,
  },
  swipeableContainer: {
    overflow: 'hidden',
    borderRadius: 15,
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    overflow: 'hidden',
    borderRadius: 15,
  },
  photo: {
    width: 70,
    height: 70,
    borderRadius: 15,
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2c3e50',
  },
  status: {
    fontSize: 14,
    color: '#3498db',
    marginTop: 4,
  },
  noItemsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#95a5a6',
  },
});
