// utils.js

export const getInstallationTypeAbbreviation = (installationType) => {
    const typeMap = {
      'Motif Candélabre': 'MCD',
      'Motif Traversée': 'MTR',
      'Guirlande Traversée': 'GTR',
      'Guirlande Arbre': 'GAR',
      'Structure': 'STC',
      'Armoire': 'ARM',
    };
    return typeMap[installationType] || 'UNK';
  };
  
  export const getVilleAbbreviation = (city) => {
    const cityMap = {
      'roubaix': 'RBX',
      "villeneuve-d'ascq": 'VDA',
      'sainghin-en-weppes': 'SEW',
      'don': 'DON',
    };
    const normalizedCity = city.toLowerCase();
    return cityMap[normalizedCity] || normalizedCity?.slice(0, 3).toUpperCase() || 'UNK';
  };
  
  export const normalizeAndSimplifyRue = (rue) => {
    const excludedWords = [
      'rue',
      'avenue',
      'boulevard',
      'place',
      'impasse',
      'chemin',
      'allée',
      'le',
      'la',
      'les',
      'de',
      'du',
      'des',
      "l'",
    ];
    return rue
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .split(' ')
      .filter((word) => !excludedWords.includes(word))
      .join('');
  };
  