// src/navigation/JournalStack.js

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import JournalScreen from '../../screens/JournalScreen';

const Stack = createStackNavigator();

export default function JournalStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="JournalScreen" 
        component={JournalScreen} 
        options={{ title: 'Journal des Modifications', headerShown: false }}  
      />
    </Stack.Navigator>
  );
}
