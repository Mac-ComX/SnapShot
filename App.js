import 'react-native-get-random-values';
import * as React from 'react';
import 'react-native-gesture-handler';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';

import DrawerNavigator from './src/navigation/DrawerNavigator';

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <DrawerNavigator />
    </NavigationContainer>
  );
}
