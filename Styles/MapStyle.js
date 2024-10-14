// Styles/MapStyle.js
import { StyleSheet, Platform } from 'react-native';

const MapStyle = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'transparent', // Assurer que le conteneur est transparent
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent pour le fond du modal
  },
  modalContentFiltre: {
    width: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Blanc légèrement transparent
    borderRadius: 10, // Réduction du rayon des coins
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitleFiltre: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#34495e',
  },
  applyButton: {
    marginTop: 20,
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerImage: {
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#fff',
  },
  modalContent: {
    padding: 20,
    flexGrow: 1,
    backgroundColor: 'rgba(238, 238, 238, 0.9)', // Semi-transparent
    borderRadius: 10, // Réduction du rayon des coins
    margin: 0,
    zIndex: 1,
  },
  modalImage: {
    width: '100%',
    height: 400,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34495e',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalFullContent: {
    marginTop: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(247, 249, 250, 0.8)', // Semi-transparent
  },
  icon: {
    marginRight: 10,
  },
  modalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34495e',
  },
  modalMetadata: {
    fontSize: 16,
    color: '#7f8c8d',
    flex: 1,
  },
  noResultsText: {
    paddingTop: 20,
    textAlign: 'center',
    fontSize: 16,
    color: '#7f8c8d',
  },
  noPhotoText: {
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 16,
    color: '#7f8c8d',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 120,
    right: 15,
    backgroundColor: 'rgb(255, 255, 255)', // Blanc opaque
    borderRadius: 50,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
    zIndex: 10,
  },
  mapToggleButton: {
    position: 'absolute',
    top: 102,
    right: 7,
    backgroundColor: 'rgb(102, 176, 141)', // Vert-bleu opaque
    borderRadius: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  filterToggleButton: {
    position: 'absolute',
    top: 150,
    right: 7,
    backgroundColor: 'rgb(102, 176, 141)', // Vert-bleu opaque
    borderRadius: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  menuButton: {
    position: 'absolute',
    top: 55,
    left: 7,
    zIndex: 100,
    backgroundColor: 'rgb(102, 176, 141)', // Vert-bleu opaque
    borderRadius: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 8,
    marginTop: 20,
    alignSelf: 'center',
  },
  detailsIcon: {
    marginRight: 8,
  },
  detailsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSheet: {
    backgroundColor: 'transparent', // Transparent pour laisser place au BlurView
    // borderTopLeftRadius: 15, // Rayon des coins
    // borderTopRightRadius: 15, // Rayon des coins
    elevation: 20,
  },
  handle: {
    backgroundColor: 'rgba(238, 238, 238, 0.95)', // Gris clair translucide
    borderTopLeftRadius: 15, // Rayon des coins
    borderTopRightRadius: 15, // Rayon des coins
    elevation: 20,
  },
  handleIndicator: {
    backgroundColor: 'rgb(204, 204, 204)', // Gris moyen opaque
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginVertical: 5,
  },
  calloutContainer: {
    width: 250,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Semi-transparent
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  calloutImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 8,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#34495e',
    marginBottom: 8,
    textAlign: 'center',
  },
  calloutButtonsContainer: {
    width: '100%',
  },
  calloutButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calloutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498db',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  calloutButtonFullWidth: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e67e22',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    justifyContent: 'center',
    width: '100%',
  },
  calloutButtonText: {
    color: '#fff',
    marginLeft: 5,
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  // Styles pour la Barre de Recherche et les Résultats
  searchContainer: {
    flexGrow: 1,
    paddingTop: 1,
    padding: 20,
    backgroundColor: 'rgba(238,238,238, 0.9)', // Semi-transparent
    // borderTopLeftRadius: 10, // Réduction du rayon des coins
    // borderTopRightRadius: 10, // Réduction du rayon des coins
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  searchInputContainer: {
    flex: 1, // Prendre tout l'espace disponible
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E7E7E5', // Gris clair avec opacité
    borderRadius: 10, // Moins arrondi
    paddingHorizontal: 15,
    height: 38, // Réduction de la hauteur pour un champ plus mince
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#34495e',
  },
  logoContainer: {
    width: 38,
    height: 38,
    borderRadius: 19, // Cercle parfait
    overflow: 'hidden',
    marginLeft: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Fond blanc translucide
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1, // Ajout de l'épaisseur du contour
    borderColor: '#ccc', // Couleur du contour gris clair
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchResultImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  searchResultTextContainer: {
    flex: 1,
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34495e',
  },
  searchResultSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  horizontalImage: {
    marginTop: 5,
    width:100,   // Largeur de l'image
    height: 100,  // Hauteur de l'image
    marginRight: 3, // Espacement entre les images
    borderRadius: 10, // Optionnel : coins arrondis pour les images
  },
  sectionTitre: {
    marginTop: 20,
    fontSize: 18, // Augmentation de la taille pour un effet moderne
    fontWeight: '600', // Font-weight plus lourd pour un look moderne
    marginBottom: 10, // Plus d'espace en bas pour respirer
    color: '#333333', // Une couleur gris foncé plus douce, mais toujours visible
    letterSpacing: 0.5, // Espacement léger entre les lettres pour un style moderne
    textAlign: 'left', // Aligner le texte à gauche pour un look plus symétrique
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto', // Police moderne
  },
  recentSection: {
    marginTop: 20,
  },
  separator: {
    height: 2,
    width: '40%', // Ne pas couvrir toute la largeur
    backgroundColor: '#ccc',
    alignSelf: 'center',
    borderRadius: 1,
    marginVertical: 10,
  },
  
  // Styles pour le Card
  card: {
    backgroundColor: '#fff', // Blanc opaque
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  cardImagesContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  cardImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginRight: 10,
  },
  cardStreet: {
    fontSize: 16,
    color: '#7f8c8d',
  },

  // Styles pour le graphique
  cardLarge: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  pieChartContainer: {
    left: 50,
    top: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    padding: 20,
  },
  centerTextContainer: {
    left: 75,
    position: 'absolute',
    top: '46%',
    alignItems: 'center',
  },
  centerText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  centerLabel: {
    fontSize: 16,
    color: '#777',
  },
  legendContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 15,
    height: 15,
    marginRight: 10,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 14,
    color: '#555',
  },
});

export default MapStyle;
