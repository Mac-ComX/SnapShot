// Styles/DetailsStyle.js

import { StyleSheet, Dimensions } from 'react-native';

const DetailsStyle = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 100, // Pour éviter que le contenu ne soit caché derrière le footer
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f7f8fa',
  },
  
  largePhoto: {
    width: '100%',
    height: 500,
    borderRadius: 15,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  deleteBadge: {
    position: 'absolute',
    top: 10,        // Distance du haut de l'image
    right: 10,      // Distance du côté droit
    backgroundColor: 'rgba(255, 0, 0, 0.8)', // Fond rouge semi-transparent
    borderRadius: 20,
    padding: 8,
    zIndex: 10,     // Assurer que le badge soit superposé sur l'image
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#34495e',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  textContainer: {
    flex: 1,
    marginLeft: 10,
  },
  Prebold: {
    fontWeight: '600',
  },
  metadata: {
    fontSize: 16,
    color: '#34495e',
  },
  addressText: {
    flex: 1,
    flexWrap: 'wrap',
    flexShrink: 1,
    fontSize: 15,
    color: '#3498db', // Couleur bleue pour indiquer que c'est cliquable
    textDecorationLine: 'underline', // Souligner le texte
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498db',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  mapButtonText: {
    justifyContent: 'left',
    alignItems: 'left',
    color: '#fff',
    marginLeft: 5,
    fontSize: 14,
    fontWeight: 'bold',
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1abc9c',
    padding: 15,
    marginVertical: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  iconStyle: {
    marginRight: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footer: {
        backgroundColor: '#f7f8fa',
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
      },
  saveButton: {
    backgroundColor: '#e63946',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
  },
  additionalPhoto: {
    width: 100,
    height: 100,
    margin: 5,
    borderRadius: 10,
  },
  fullscreenModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: Dimensions.get('window').width * 0.9,
    height: Dimensions.get('window').height * 0.7,
    borderRadius: 10,
  },
  fullscreenModalClose: {
    position: 'absolute',
    top: 40,
    right: 20,
  },
  fullscreenModalContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenCommentContainer: {
    position: 'absolute',
    bottom: 50,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderRadius: 5,
  },
  fullscreenComment: {
    color: '#fff',
    fontSize: 16,
  },
  modalTopButtons: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  iconButton: {
    backgroundColor: 'rgba(27, 72, 78, 0.7)',
    padding: 10,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  transparentCommentContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.0)',
  },
  transparentCommentInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 40,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 0,
    color: '#fff',
  },
  saveIconInsideInput: {
    height:42,
    width:42,
    backgroundColor: '#1b484e',
    margin: 5,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  modalOverlayOption: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainerOption: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContentOption: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1b484e',
  },
  modalOption: {
    padding: 15,
    width: '100%',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
  },
  modalOptionStatut: {
    padding: 15,
    width: '100%',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalText: {
    fontSize: 16,
    color: '#34495e',
  },
  optionActive: {
    backgroundColor: '#e0f7fa',
    borderRadius: 10,
  },
  modalCloseButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#333',
  },
  commentSection: {
    flex: 1,
    marginLeft: 10,
  },
  commentText: {
    fontSize: 16,
    color: '#34495e',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#1abc9c',
    borderRadius: 40,
    padding: 10,
    fontSize: 16,
    color: '#34495e',
  },
  commentInputActive: {},
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  },
  menuButton: {
    position: 'absolute',
    top: 40,       // Distance du haut de la photo
    right: 30,     // Distance du côté droit
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fond semi-transparent pour le contraste
    borderRadius: 20,
    padding: 8,    // Taille de l'icône
    zIndex: 10,    // Assure que le bouton soit superposé sur la photo
  },
  mainImageButtons: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
  },
  editButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  deleteButtonMain: {
    backgroundColor: 'rgba(255, 0, 0, 0.6)',
    padding: 8,
    borderRadius: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', // Fond semi-transparent
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)', // Fond presque opaque pour plein écran
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DetailsStyle;
