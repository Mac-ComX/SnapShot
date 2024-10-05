import React from 'react';
import Svg, { Circle } from 'react-native-svg';

const SvgCircle = ({ size = 24, innerColor = '#1b484e', outerColor = 'lightgray' }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Cercle gris (contour) */}
      <Circle cx="50" cy="50" r="40" fill={outerColor} />
      {/* Cercle bleu à l'intérieur */}
      <Circle cx="50" cy="50" r="30" fill={innerColor} />
    </Svg>
  );
};

export default SvgCircle;
