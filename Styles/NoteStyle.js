// ./Styles/NoteStyle.js

import { StyleSheet } from 'react-native';

const NoteStyle = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f2f4f6',
  },
  itemContainer: {
    marginBottom: 15,
  },
  swipeableContainer: {
    overflow: 'hidden',
    borderRadius: 15,
    backgroundColor: '#f2f4f6', // Ajout d'une couleur de fond pour éviter les artefacts lors du glissement
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    flexDirection: 'column',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  noteContent: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  noteDate: {
    fontSize: 14,
    color: '#ff7f00',
  },
  deleteButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    width: 120,
    height: '100%',
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
    fontSize: 16,
  },
  editButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498db',
    justifyContent: 'center',
    width: 120,
    height: '100%',
    borderTopLeftRadius: 15,
    borderBottomLeftRadius: 15,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
    fontSize: 16,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#3498db',
    borderRadius: 50,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
  },
});

export default NoteStyle;
