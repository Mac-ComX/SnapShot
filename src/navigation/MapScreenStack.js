import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import MapScreen from '../../screens/MapScreen';
import DetailsScreen from '../../screens/Details/DetailsScreen';
import DetailsDebugScreen from '../../screens/Details/DetailsDebugScreen';
import NotesListScreen from '../../screens/NotesListScreen';
import ArmoireScreen from '../../screens/ArmoireScreen';
import MaintenanceScreen from '../../screens/MaintenanceScreen';
import JournalScreen from '../../screens/JournalScreen';
import CameraScreen from '../../screens/previews/CameraScreen';
import PreviewScreen from '../../screens/previews/PreviewScreen';
import FormScreen from '../../screens/FormScreen';
import CameraAddPhotoScreen from '../../screens/previews/CameraAddPhotoScreen';
import PreviewAddiScreen from '../../screens/previews/PreviewAddiScreen';
import PreviewMaintScreen from '../../screens/previews/PreviewMaintScreen';
import DashboardScreen from '../../screens/DashboardScreen';
import AddNoteScreen from '../../screens/AddNoteScreen';
import EditNoteScreen from '../../screens/EditNoteScreen';
import DetailsArmoireScreen from '../../screens/Details/DetailsArmoireScreen';

const Stack = createStackNavigator();

export default function MapScreenStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MapScreen"
        component={MapScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DetailsScreen"
        component={DetailsScreen}
        options={{ title: 'Détails de l\'installation', headerBackTitle: 'Retour' }}
      />
      <Stack.Screen
        name="DetailsDebugScreen"
        component={DetailsDebugScreen}
        options={{ title: 'Détails de la décoration', headerBackTitle: 'Retour' }}
      />
      <Stack.Screen
        name="ArmoireScreen"
        component={ArmoireScreen}
        options={{ title: 'Liste d\'Armoires', headerBackTitle: 'Retour' }}
      />

      <Stack.Screen
        name="DetailsArmoireScreen"
        component={DetailsArmoireScreen}
        options={{ title: 'Détails de l\'Armoire', headerBackTitle: 'Retour' }}
      />
      <Stack.Screen
        name="JournalScreen"
        component={JournalScreen}
        options={{ title: 'Liste d\'Armoires', headerBackTitle: 'Retour' }}
      />
      <Stack.Screen
        name="MaintenanceScreen"
        component={MaintenanceScreen}
        options={{ title: 'Liste d\'Armoires', headerBackTitle: 'Retour' }}
      />
      <Stack.Screen
        name="CameraScreen"
        component={CameraScreen}
        options={{ headerShown: false, headerBackTitle: 'Retour' }}
      />
      <Stack.Screen
        name="PreviewScreen"
        component={PreviewScreen}
        options={{ headerShown: false, headerBackTitle: 'Retour' }}
      />
      <Stack.Screen
        name="FormScreen"
        component={FormScreen}
        options={{ title: 'Formulaire', headerBackTitle: 'Retour' }}
      />
      <Stack.Screen
        name="CameraAddPhotoScreen"
        component={CameraAddPhotoScreen}
        options={{ title: 'Ajouter une Photo Additionnelle', headerBackTitle: 'Retour' }}
      />
      <Stack.Screen
        name="PreviewAddiScreen"
        component={PreviewAddiScreen}
        options={{ title: 'Prévisualisation Additionnelle', headerBackTitle: 'Retour' }}
      />
      <Stack.Screen
        name="PreviewMaintScreen"
        component={PreviewMaintScreen}
        options={{ title: 'Prévisualisation Maintenance', headerBackTitle: 'Retour' }}
      />
      <Stack.Screen
        name="DashboardScreen"
        component={DashboardScreen}
        options={{ title: 'Dashbord', headerBackTitle: 'Retour' }}
      />
      <Stack.Screen
        name="NotesListScreen"
        component={NotesListScreen}
        options={{ title: 'Liste de Notes', headerBackTitle: 'Retour' }}
      />
      <Stack.Screen
        name="AddNote"
        component={AddNoteScreen}
        options={{ title: 'Ajouter une note' }}
      />
      <Stack.Screen
        name="EditNote"
        component={EditNoteScreen}
        options={{
          title: 'Modifier la note',
          headerBackTitle: 'Retour à la liste'
        }}
      />
    </Stack.Navigator>
  );
}
