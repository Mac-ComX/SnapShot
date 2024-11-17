import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Swipeable } from 'react-native-gesture-handler';
import PublicImage from '../components/PublicImage'; // Assurez-vous d'avoir ce composant dans votre projet
import ArmoireStyle from '../Styles/ArmoireStyle'; // Importation des styles externes
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
    } catch (error) {O
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

    const parseDate = (dateString) => {
      if (!dateString) return null;
      const [datePart, timePart] = dateString.split(', ');
      const [day, month, year] = datePart.split('/');
      const [hour, minute] = timePart.split(':');
      const date = new Date(year, month - 1, day, hour, minute);
      return date;
    };

    return (
      <View style={ArmoireStyle.itemContainer}>
        <Swipeable ref={swipeableRef} overshootRight={false} friction={2} containerStyle={ArmoireStyle.swipeableContainer}>
          <TouchableOpacity onPress={() => openArmoireDetails(item)}>
            <View style={ArmoireStyle.card}>
              <PublicImage storagePath={item.imageUri} style={ArmoireStyle.photo} />
              <View style={ArmoireStyle.textContainer}>
                <Text style={ArmoireStyle.title}>{item.armoire || 'Nom indisponible'}</Text>
                <Text style={ArmoireStyle.status}>{item.numeroRue || 'Statut non spécifié'} {item.rue || 'Statut non spécifié'}, {item.ville || 'Statut non spécifié'}</Text>
                <Text style={ArmoireStyle.date}>{formatDate(item.createdAt)}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </Swipeable>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={ArmoireStyle.loadingContainer}>
        <Text>Chargement des armoires...</Text>
      </View>
    );
  }

  return (
    <View style={ArmoireStyle.container}>
      <FlatList
        data={armoires}
        renderItem={renderArmoireItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={ArmoireStyle.noItemsText}>Aucune armoire disponible.</Text>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </View>
  );
}
