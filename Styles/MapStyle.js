import { StyleSheet } from 'react-native';

const MapStyle = StyleSheet.create({
  
    container: {
        flex: 1,
        justifyContent: 'center',
      },
      modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      },
      modalContentFiltre: {
        width: '80%',
        backgroundColor: '#fff',
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
        backgroundColor: '#ffffff',
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
        backgroundColor: '#f7f9fa',
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
        backgroundColor: '#fff',
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
        backgroundColor: '#66b08d',
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
        backgroundColor: '#66b08d',
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
        backgroundColor: '#66b08d',
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
        zIndex: 1000,
        elevation: 20,
        borderTopLeftRadius: 10, // Réduction du rayon des coins
        borderTopRightRadius: 10, // Réduction du rayon des coins
      },
      handleIndicator: {
        backgroundColor: '#ccc',
        width: 60,
        height: 5,
        borderRadius: 3,
        alignSelf: 'center',
        marginVertical: 10,
      },
      calloutContainer: {
        width: 250,
        padding: 10,
        backgroundColor: '#fff',
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
      
      // Nouveaux Styles pour la Barre de Recherche et les Résultats
      searchContainer: {
        flex: 1,
        paddingTop: 1,
        padding: 20,
        backgroundColor: '#fff',
        borderTopLeftRadius: 10, // Réduction du rayon des coins
        borderTopRightRadius: 10, // Réduction du rayon des coins
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
        backgroundColor: '#f1f1f1',
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
        borderRadius: 25, // Cercle parfait
        overflow: 'hidden',
        marginLeft: 10,
        backgroundColor: '#fff', // Optionnel : ajouter un fond blanc
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1, // Ajout de l'épaisseur du contour
        borderColor: '#ccc', // Couleur du contour noir
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
      noResultsText: {
        marginTop: 20,
        textAlign: 'center',
        fontSize: 16,
        color: '#7f8c8d',
      },
    });
    

export default MapStyle;
