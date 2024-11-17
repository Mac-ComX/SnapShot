// src/navigation/NotesStack.js

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import NotesListScreen from '../../screens/NotesListScreen';
import AddNoteScreen from '../../screens/AddNoteScreen';
import EditNoteScreen from '../../screens/EditNoteScreen';

const Stack = createStackNavigator();

export default function NotesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="NotesList"
        component={NotesListScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="AddNote"
        component={AddNoteScreen} 
        options={{ title: 'Ajouter une note', headerBackTitle: 'Retour' }} 
      />
      <Stack.Screen 
        name="EditNote"
        component={EditNoteScreen} 
        options={{ 
          title: 'Modifier la note', headerBackTitle: 'Retour' 
        }} 
      />
    </Stack.Navigator>
  );
}
