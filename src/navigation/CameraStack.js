import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import CameraScreen from '../../screens/previews/CameraScreen';
import PreviewScreen from '../../screens/previews/PreviewScreen';
import FormScreen from '../../screens/FormScreen';
import CameraAddPhotoScreen from '../../screens/previews/CameraAddPhotoScreen';
import PreviewAddiScreen from '../../screens/previews/PreviewAddiScreen';
import PreviewMaintScreen from '../../screens/previews/PreviewMaintScreen';

const Stack = createStackNavigator();

export default function CameraStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="CameraScreen"
        component={CameraScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PreviewScreen"
        component={PreviewScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FormScreen"
        component={FormScreen}
        options={{ title: 'Formulaire', headerShown: false }}
      />
      <Stack.Screen
        name="CameraAddPhotoScreen"
        component={CameraAddPhotoScreen}
        options={{ title: 'Ajouter une Photo Additionnelle' }}
      />
      <Stack.Screen
        name="PreviewAddiScreen"
        component={PreviewAddiScreen}
        options={{ title: 'Prévisualisation Additionnelle' }}
      />
      <Stack.Screen
        name="PreviewMaintScreen"
        component={PreviewMaintScreen}
        options={{ title: 'Prévisualisation Maintenance' }}
      />
    </Stack.Navigator>
  );
}
