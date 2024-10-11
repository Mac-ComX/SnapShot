import { StyleSheet } from 'react-native';

const PhotosRueStyle = StyleSheet.create({
  
    container: {
        flex: 1,
        backgroundColor: '#f2f4f6',
        padding: 10,
      },
      header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        // Vous pouvez ajuster le padding ou la marge selon vos besoins
      },
      backButton: {
        padding: 10,
      },
      headerTextContainer: {
        flex: 1,
      },
      headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2c3e50',
        textAlign: 'center',
      },
      filterIcon: {
        backgroundColor: '#3498db',
        padding: 10,
        borderRadius: 50,
        marginLeft: 10,
        flexShrink: 0,
      },
      loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      },
      itemContainer: {
        marginBottom: 15,
      },
      swipeableContainer: {
        overflow: 'hidden',
        borderRadius: 15,
      },
      card: {
        backgroundColor: '#fff',
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 3,
        overflow: 'hidden',
        borderRadius: 15,
      },
      cardSwiped: {
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
      },
      photo: {
        width: 70,
        height: 70,
        borderRadius: 15,
        marginRight: 15,
      },
      textContainer: {
        flex: 1,
      },
      title: {
        fontSize: 17,
        fontWeight: '600',
        color: '#2c3e50',
      },
      status: {
        fontSize: 14,
        color: '#27ae60',
        marginTop: 4,
      },
      date: {
        fontSize: 12,
        color: '#7f8c8d',
        marginTop: 2,
      },
      noPhotosText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: '#95a5a6',
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
      deleteButton: {
        backgroundColor: '#e74c3c',
        justifyContent: 'center',
        alignItems: 'center',
        width: 90,
        height: '100%',
        borderTopRightRadius: 15,
        borderBottomRightRadius: 15,
      },
      deleteButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
      },
    });
    

export default PhotosRueStyle;
