import * as React from 'react';
import 'react-native-gesture-handler';
import { View, Image, StyleSheet, StatusBar, Appearance } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import MapScreen from './screens/MapScreen';
import CameraScreen from './screens/CameraScreen';
import PreviewScreen from './screens/PreviewScreen';
import ListeVillesScreen from './screens/ListeVillesScreen';
import ListeRuesScreen from './screens/ListeRuesScreen';
import PhotosRueScreen from './screens/PhotosRueScreen';
import FormScreen from './screens/FormScreen'; // Assurez-vous que ce fichier existe


const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

// Composant personnalisé pour le contenu du Drawer avec le logo
function CustomDrawerContent(props) {
  return (
    <DrawerContentScrollView {...props}>
      {/* Ajout du logo ici */}
      <View style={styles.logoContainer}>
        <Image 
          source={require('./assets/logo.png')}  // Assurez-vous que le chemin du logo est correct
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      {/* Les éléments du menu Drawer */}
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}

// Stack pour la prise de photos et l'aperçu
function CameraStack() {
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
      {/* Ajout du nouvel écran de formulaire */}
      <Stack.Screen
        name="FormScreen"
        component={FormScreen}
        options={{ title: 'Formulaire', headerShown: true }}  // En-tête visible pour le formulaire
      />
    </Stack.Navigator>
  );
}

// Stack pour la galerie de photos
function GalerieStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ListeVillesScreen" 
        component={ListeVillesScreen} 
        options={{ title: 'Villes' }} 
      />
      <Stack.Screen 
        name="ListeRuesScreen" 
        component={ListeRuesScreen} 
        options={({ route }) => ({ title: `Rues de ${route.params.ville}` })} 
      />
      <Stack.Screen 
        name="PhotosRueScreen" 
        component={PhotosRueScreen} 
        options={({ route }) => ({ title: `Photos de ${route.params.rue}` })} 
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Drawer.Navigator
      
        initialRouteName="Carte"
        drawerContent={(props) => <CustomDrawerContent {...props} />}  // Utilisation du Drawer personnalisé
        screenOptions={{
          drawerStyle:{width: 180,},
          
          drawerActiveTintColor: '#66b08d',
          drawerInactiveTintColor: '#1b484e',
        }}
      >
        <Drawer.Screen 
          name="PrendrePhoto" 
          component={CameraStack}  
          options={{ 
            title: 'Photo',
            drawerIcon: ({ color, size }) => (
              <Icon name="camera" size={size} color={color} />
            ),
          }} 
        />
        <Drawer.Screen 
          name="Carte" 
          component={MapScreen}  
          options={{
            title: 'Carte',
            headerShown: false,
            drawerIcon: ({ color, size }) => (
              <Icon name="map" size={size} color={color} />
            ),
          }}  
        />
        <Drawer.Screen 
          name="Photos" 
          component={GalerieStack}  
          options={{ 
            title: 'Galerie',
            drawerIcon: ({ color, size }) => (
              <Icon name="images" size={size} color={color} />
            ),
          }}
        />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    width: 170,
    height: 80,  // Ajustez ces valeurs selon la taille de votre logo
  },
});
