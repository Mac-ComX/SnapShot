// src/components/CustomDrawerContent.js

import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Text, Animated, Easing } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';

export default function CustomDrawerContent(props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
            source={require('../assets/logo.png')}  
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <DrawerItemList {...props} />

        <View style={styles.footerContainer}>
          <Svg width="15" height="15" viewBox="0 0 24 24">
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
            Version 1.5.6 by @Kmel
          </Text>
        </View>
      </DrawerContentScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 6,
  },
  logo: {
    width: 180,
    height: 80,
  },
  footerContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'left',
    left: 8,
    marginBottom: 200,
    top: 6,
  },
  footerText: {
    fontSize: 10,
    color: '#888',
  },
});