// src/navigation/GalerieStack.js

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import ListeAnneesScreen from '../../screens/Listes/ListeAnneesScreen';
import ListeVillesScreen from '../../screens/Listes/ListeVillesScreen';
import ListeRuesScreen from '../../screens/Listes/ListeRuesScreen';
import PhotosRueScreen from '../../screens/PhotosRueScreen';
import DetailsScreen from '../../screens/Details/DetailsScreen';

const Stack = createStackNavigator();

export default function GalerieStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ListeAnneesScreen" 
        component={ListeAnneesScreen} 
        options={{ headerShown: false}} 
      />
      <Stack.Screen 
        name="ListeVillesScreen" 
        component={ListeVillesScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="ListeRuesScreen" 
        component={ListeRuesScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="PhotosRueScreen" 
        component={PhotosRueScreen} 
        options={({ route }) => ({ 
          title: `Décoration ${route.params.rue}`, 
          headerBackTitle: 'Retour',  
          headerShown: false 
        })} 
      />
      <Stack.Screen 
        name="DetailsScreen" 
        component={DetailsScreen} 
        options={{ title: 'Détails de l\'installation', headerBackTitle: 'Retour'  }} 
      />
    </Stack.Navigator>
  );
}
