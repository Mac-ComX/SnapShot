import { createDrawerNavigator } from '@react-navigation/drawer';
import React from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import Icone from 'react-native-vector-icons/MaterialIcons';

// Import du composant CustomDrawerContent
import CustomDrawerContent from '../../components/CustomDrawerContent';

// Import des stacks pour chaque écran
import ArmoireStack from './ArmoireStack';
import CameraStack from './CameraStack';
import DashboardStack from './DashboardStack';
import GalerieStack from './GalerieStack';
import JournalStack from './JournalStack';
import MaintenanceStack from './MaintenanceStack';
import MapScreenStack from './MapScreenStack';
import NotesStack from './NotesStack';

const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="Carte"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerStyle: { width: "54%", height: '120%' },
        drawerType: 'back',
        drawerActiveTintColor: '#66b08d',
        drawerInactiveTintColor: '#1b484e',
        drawerActiveBackgroundColor: '#e0f7fa',
        overlayColor: 'rgba(0, 0, 0, 0.6)',
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
            <Icone name="door-sliding" size={25} color={color} />
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
      <Drawer.Screen 
        name="Notes" 
        component={NotesStack}  
        options={{ 
          title: 'Mes Notes',
          drawerIcon: ({ color, size }) => (
            <Icon name="create" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}
