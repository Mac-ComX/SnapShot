// src/navigation/MaintenanceStack.js

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import MaintenanceScreen from '../../screens/MaintenanceScreen';
import FormScreen from '../../screens/FormScreen'; // Vérifiez ce chemin
import DetailsDebugScreen from '../../screens/Details/DetailsDebugScreen';

const Stack = createStackNavigator();

export default function MaintenanceStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="MaintenanceScreen" 
        component={MaintenanceScreen} 
        options={{ title: 'Maintenance & Réparations', headerShown: false }} 
      />
      <Stack.Screen
        name="FormScreen"
        component={FormScreen}
        options={{ title: 'Formulaire de Maintenance', headerShown: false }}  
      />
      <Stack.Screen 
        name="DetailsDebugScreen" 
        component={DetailsDebugScreen} 
        options={{ title: 'Détails de la décoration', headerBackTitle: 'Retour' }} 
      />
    </Stack.Navigator>
  );
}
