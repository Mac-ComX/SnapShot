import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import ArmoireScreen from '../../screens/ArmoireScreen';
import DetailsArmoireScreen from '../../screens/Details/DetailsArmoireScreen';

const Stack = createStackNavigator();

export default function ArmoireStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ArmoireScreen" 
        component={ArmoireScreen} 
        options={{ title: 'Liste des Armoires', headerShown: false }} 
      />
      <Stack.Screen 
        name="DetailsArmoireScreen" 
        component={DetailsArmoireScreen} 
        options={{ title: 'Détails de l\'Armoire', headerBackTitle: 'Retour' }} 
      />
    </Stack.Navigator>
  );
}
