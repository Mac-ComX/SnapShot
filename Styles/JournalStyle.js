import { StyleSheet } from 'react-native';

const JournalStyle = StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: '#f2f4f6',
          padding: 10,
        },
        headerContainer: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        },
        headerTitle: {
          fontSize: 22,
          fontWeight: 'bold',
          color: '#2c3e50',
          flexShrink: 1,
        },
        filterIcon: {
          backgroundColor: '#3498db',
          padding: 10,
          borderRadius: 50,
        },
        loadingContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
        loadingText: {
          fontSize: 16,
          color: '#555555',
        },
        errorContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        },
        errorText: {
          fontSize: 16,
          color: '#e74c3c',
          textAlign: 'center',
        },
        listContainer: {
          paddingVertical: 10,
        },
        journalItem: {
          backgroundColor: '#ffffff',
          borderRadius: 12,
          marginHorizontal: 10,
          marginBottom: 15,
          padding: 15,
          // Ombres
          shadowColor: '#000000',
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 5,
        },
        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        },
        title: {
          fontSize: 18,
          fontWeight: '600',
          color: '#1a1a1a',
          maxWidth: '70%', // Limite la largeur du titre pour éviter le débordement
        },
        date: {
          fontSize: 12,
          color: '#a0a0a0',
        },
        statusContainer: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 10,
        },
        statusWrapper: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        statusLabel: {
          fontSize: 14,
          fontWeight: '500',
          color: '#000', // Label en noir
        },
        statusValue: {
          fontSize: 14,
          fontWeight: '500',
        },
        addressContainer: {
          marginBottom: 10,
        },
        addressTitle: {
          fontSize: 14,
          fontWeight: '500',
          color: '#333333',
        },
        addressText: {
          fontSize: 14,
          color: '#555555',
        },
        commentTitle: {
          fontSize: 16,
          fontWeight: '500',
          color: '#333333',
          marginBottom: 5,
        },
        comment: {
          fontSize: 14,
          color: '#555555',
          marginBottom: 10,
        },
        historyContainer: {
          marginBottom: 15,
        },
        historyTitle: {
          fontSize: 15,
          fontWeight: '500',
          color: '#444444',
          marginBottom: 5,
        },
        historyItem: {
          marginBottom: 5,
        },
        historyText: {
          fontSize: 13,
          color: '#666666',
        },
        photoSlider: {
          paddingVertical: 10,
        },
        photo: {
          width: 100,
          height: 100,
          marginRight: 10,
          borderRadius: 8,
          borderWidth: 0.5,
          borderColor: '#cccccc',
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 5,
          elevation: 3,
        },
        deleteButton: {
          backgroundColor: '#e74c3c',
          justifyContent: 'center',
          alignItems: 'center',
          width: 60,
          height: '100%',
          borderTopRightRadius: 12,
          borderBottomRightRadius: 12,
        },
        deleteButtonText: {
          color: '#fff',
          fontWeight: 'bold',
          fontSize: 16,
        },
        modalOverlay: {
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
        modalContainer: {
          backgroundColor: '#fff',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: 20,
          paddingBottom: 30,
          elevation: 10,
        },
        modalTitle: {
          fontSize: 18,
          fontWeight: 'bold',
          marginVertical: 10,
          color: '#1b484e',
        },
        modalOption: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingVertical: 15,
          alignItems: 'center',
        },
        modalText: {
          fontSize: 16,
          color: '#34495e',
        },
        modalCloseButton: {
          marginTop: 20,
          paddingVertical: 15,
          backgroundColor: '#e74c3c',
          borderRadius: 10,
          alignItems: 'center',
        },
        modalCloseText: {
          fontSize: 16,
          color: '#fff',
        },
        modalSeparator: {
          width: '100%',
          height: 1,
          backgroundColor: '#ecf0f1',
          marginVertical: 15,
        },
        imageModalOverlay: {
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          justifyContent: 'center',
          alignItems: 'center',
        },
        imageModalClose: {
          position: 'absolute',
          top: 40,
          right: 20,
          zIndex: 1,
        },
        imageModalContent: {
          width: '90%',
          height: '80%',
          justifyContent: 'center',
          alignItems: 'center',
        },
        fullscreenImage: {
          width: '100%',
          height: '70%',
          resizeMode: 'contain',
          borderRadius: 12,
        },
        fullscreenComment: {
          marginTop: 20,
          fontSize: 16,
          color: '#fff',
          textAlign: 'center',
        },
      });
      
    

export default JournalStyle;
