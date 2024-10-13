// components/PhotoSlider.js

import React from 'react';
import { View, Image, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Utiliser la bonne famille si nécessaire
import DetailsStyle from '../Styles/DetailsStyle';

const PhotoSlider = ({ mainImage, onViewImage }) => {
  const screenWidth = Dimensions.get('window').width;

  return (
    <View style={DetailsStyle.photoSliderContainer}>
      <TouchableOpacity onPress={() => onViewImage(mainImage)}>
        <Image source={{ uri: mainImage }} style={[DetailsStyle.largePhoto, { width: screenWidth * 0.9 }]} />
      </TouchableOpacity>
      {/* Exemple d'utilisation d'une icône pour le slider, si nécessaire */}
      {/* <MaterialCommunityIcons name="image-search-outline" size={24} color="#fff" style={DetailsStyle.sliderIcon} /> */}
    </View>
  );
};

export default PhotoSlider;
