import * as React from 'react';
import 'react-native-gesture-handler';
import { View, Image, StyleSheet, StatusBar, Text, Animated, Easing } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import MapScreen from './screens/MapScreen';
import CameraScreen from './screens/previews/CameraScreen';
import PreviewScreen from './screens/previews/PreviewScreen';
import ListeAnneesScreen from './screens/Listes/ListeAnneesScreen'; 
import ListeVillesScreen from './screens/Listes/ListeVillesScreen'; 
import ListeRuesScreen from './screens/Listes/ListeRuesScreen'; 
import PhotosRueScreen from './screens/PhotosRueScreen'; 
import FormScreen from './screens/FormScreen'; 
import DetailsScreen from './screens/Details/DetailsScreen'; 
import CameraAddPhotoScreen from './screens/previews/CameraAddPhotoScreen';
import PreviewAddiScreen from './screens/previews/PreviewAddiScreen';
import PreviewMaintScreen from './screens/previews/PreviewMaintScreen';
import DetailsDebugScreen from './screens/Details/DetailsDebugScreen';
import DashboardScreen from './screens/DashboardScreen'; // Ajout du Dashboard
import MaintenanceScreen from './screens/MaintenanceScreen'; // Nouvelle page de Maintenance
import JournalScreen from './screens/JournalScreen'; // Ajout de l'écran Journal
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import ArmoireScreen from './screens/ArmoireScreen';
import DetailsArmoireScreen from './screens/Details/DetailsArmoireScreen';


const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

// Composant personnalisé pour le contenu du Drawer avec animation et logo
function CustomDrawerContent(props) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
      <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContent}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('./assets/logo.png')}  
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <DrawerItemList {...props} />

        <View style={styles.footerContainer}>
          <Svg width="12" height="12" viewBox="0 0 24 24">
            <Circle cx="12" cy="12" r="10" stroke="#666" strokeWidth="2" fill="none" />
            <SvgText
              x="12"
              y="16"
              fontSize="12"
              fontWeight="bold"
              fill="#666"
              textAnchor="middle"
            >
              C
            </SvgText>
          </Svg>
          <Text style={styles.footerText}>
            Version 1.5.0 Public by @Kmel
          </Text>
        </View>
      </DrawerContentScrollView>
    </Animated.View>
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
      />
    </Stack.Navigator>
  );
}

// Stack pour la galerie de photos
function GalerieStack() {
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
        options={({ route }) => ({ title: `Décoration ${route.params.rue}`, headerBackTitle: 'Retour',  headerShown: false})} 
      />
      <Stack.Screen 
        name="DetailsScreen" 
        component={DetailsScreen} 
        options={{ title: 'Détails de l\'installation', headerBackTitle: 'Retour'  }} 
      />
    </Stack.Navigator>
  );
}

// Stack pour la carte avec gestion des paramètres pour centrer sur un marker
// Stack pour la carte avec gestion des paramètres pour centrer sur un marker
function MapScreenStack() {
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
    </Stack.Navigator>
  );
}


// Stack pour le Dashboard
function DashboardStack() {
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

// Stack pour la Maintenance des décorations en panne
function MaintenanceStack() {
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

// Stack pour la Maintenance des décorations en panne
function ArmoireStack() {
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

// Stack pour le Journal des modifications
function JournalStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="JournalScreen" 
        component={JournalScreen} 
        options={{ title: 'Journal des Modifications', headerBackTitle: 'Retour' }}  
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
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          drawerStyle: { width: "54%", height: '120%' },
          drawerType: 'back',
          drawerActiveTintColor: '#66b08d',
          drawerInactiveTintColor: '#1b484e',
          drawerActiveBackgroundColor: '#e0f7fa', // Arrière-plan actif avec contraste doux
          overlayColor: 'rgba(0, 0, 0, 0.6)', // Effet d'ombrage moderne
        }}
      >
        <Drawer.Screen 
          name="Dashboard" 
          component={DashboardStack}  
          options={{ 
            title: 'Dashboard',
            drawerIcon: ({ color, size }) => (
              <Icon name="stats-chart" size={size} color={color} />
            ),
          }}
        />
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
          component={MapScreenStack}  
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
        <Drawer.Screen 
          name="Armoires" 
          component={ArmoireStack}  
          options={{ 
            title: 'Armoires',
            drawerIcon: ({ color, size }) => (
              <Icon name="browsers" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen 
          name="Maintenance" 
          component={MaintenanceStack}  
          options={{ 
            title: 'Maintenance',
            drawerIcon: ({ color, size }) => (
              <Icon name="construct" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen 
          name="Journal" 
          component={JournalStack}  
          options={{ 
            title: 'Journal',
            drawerIcon: ({ color, size }) => (
              <Icon name="document-text" size={size} color={color} />
            ),
          }}
        />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 0,
  },
  logo: {
    width: 170,
    height: 80,
  },
  footerContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 400,
    top: 200,
  },
  footerText: {
    fontSize: 10,
    color: '#888',
  },
});
