// ./screens/NotesListScreen.js

import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  RefreshControl,
} from 'react-native';
import { collection, onSnapshot, deleteDoc, doc, orderBy, query } from 'firebase/firestore';
import { db } from '../services/firebase';
import { MaterialIcons } from '@expo/vector-icons';
import NoteStyle from '../Styles/NoteStyle';
import { Swipeable } from 'react-native-gesture-handler';

// Memoized NoteItem component to prevent unnecessary re-renders
const NoteItem = memo(({ item, navigation, deleteNote }) => {
  const renderLeftActions = useCallback(
    (progress, dragX) => {
      const scale = dragX.interpolate({
        inputRange: [0, 100],
        outputRange: [0.5, 1],
        extrapolate: 'clamp',
      });

      const opacity = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      });

      return (
        <TouchableOpacity
          onPress={() => navigation.navigate('EditNote', { note: item })}
          activeOpacity={0.6}
        >
          <Animated.View
            style={[
              NoteStyle.editButtonContainer,
              {
                transform: [{ scale }],
                opacity,
              },
            ]}
          >
            <MaterialIcons name="edit" size={24} color="#fff" />
            <Text style={NoteStyle.editButtonText}>Modifier</Text>
          </Animated.View>
        </TouchableOpacity>
      );
    },
    [navigation, item]
  );

  const renderRightActions = useCallback(
    (progress, dragX) => {
      const scale = dragX.interpolate({
        inputRange: [-100, 0],
        outputRange: [1, 0.5],
        extrapolate: 'clamp',
      });

      const opacity = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      });

      return (
        <TouchableOpacity onPress={() => deleteNote(item.id)} activeOpacity={0.6}>
          <Animated.View
            style={[
              NoteStyle.deleteButtonContainer,
              {
                transform: [{ scale }],
                opacity,
              },
            ]}
          >
            <MaterialIcons name="delete" size={24} color="#fff" />
            <Text style={NoteStyle.deleteButtonText}>Supprimer</Text>
          </Animated.View>
        </TouchableOpacity>
      );
    },
    [deleteNote, item.id]
  );

  return (
    <View style={NoteStyle.itemContainer}>
      <View style={NoteStyle.swipeableContainer}>
        <Swipeable
          renderLeftActions={renderLeftActions}
          renderRightActions={renderRightActions}
          overshootLeft={false}
          overshootRight={false}
          friction={3} // Augmenter légèrement la friction pour une meilleure fluidité
        >
          <TouchableOpacity onPress={() => navigation.navigate('EditNote', { note: item })}>
            <View style={NoteStyle.card}>
              <Text style={NoteStyle.noteTitle} numberOfLines={1} ellipsizeMode="tail">
                {item.title}
              </Text>
              <Text numberOfLines={2} style={NoteStyle.noteContent}>
                {item.content.replace(/<[^>]+>/g, '')}
              </Text>
              {item.createdAt && (
                <Text style={NoteStyle.noteDate}>
                  {new Date(item.createdAt.seconds * 1000).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </Swipeable>
      </View>
    </View>
  );
});

export default function NotesListScreen({ navigation }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch notes from Firestore
  useEffect(() => {
    const notesCollection = collection(db, 'notes');
    const notesQuery = query(notesCollection, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      notesQuery,
      (snapshot) => {
        const notesList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setNotes(notesList);
        setLoading(false);
      },
      (error) => {
        Alert.alert('Erreur', 'Impossible de charger les notes');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Refresh notes
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    const notesCollection = collection(db, 'notes');
    const notesQuery = query(notesCollection, orderBy('createdAt', 'desc'));
    onSnapshot(
      notesQuery,
      (snapshot) => {
        const notesList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setNotes(notesList);
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        Alert.alert('Erreur', 'Impossible de charger les notes');
        setLoading(false);
        setRefreshing(false);
      }
    );
  }, []);

  // Delete a note
  const deleteNote = useCallback(async (id) => {
    Alert.alert(
      'Confirmation',
      'Êtes-vous sûr de vouloir supprimer cette note ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'notes', id));
              Alert.alert('Succès', 'Note supprimée avec succès');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer la note');
            }
          },
        },
      ],
      { cancelable: true }
    );
  }, []);

  // Render item using memoized NoteItem component
  const renderItem = useCallback(
    ({ item }) => <NoteItem item={item} navigation={navigation} deleteNote={deleteNote} />,
    [navigation, deleteNote]
  );

  // Key extractor
  const keyExtractor = useCallback((item) => item.id, []);

  if (loading) {
    return (
      <View style={NoteStyle.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <View style={NoteStyle.container}>
      {notes.length === 0 ? (
        <View style={NoteStyle.emptyContainer}>
          <Text style={NoteStyle.emptyText}>Aucune note disponible. Ajoutez-en une !</Text>
        </View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      <TouchableOpacity
        style={NoteStyle.addButton}
        onPress={() => navigation.navigate('AddNote')}
      >
        <MaterialIcons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
