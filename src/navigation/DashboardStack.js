// src/navigation/DashboardStack.js

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import DashboardScreen from '../../screens/DashboardScreen';
import DetailsDebugScreen from '../../screens/Details/DetailsDebugScreen';

const Stack = createStackNavigator();

export default function DashboardStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="DashboardScreen" 
        component={DashboardScreen} 
        options={{ headerShown: false }}  
      />
      <Stack.Screen 
        name="DetailsDebugScreen" 
        component={DetailsDebugScreen} 
        options={{ title: 'Détails de la décoration', headerBackTitle: 'Retour' }}
      />
    </Stack.Navigator>
  );
}
