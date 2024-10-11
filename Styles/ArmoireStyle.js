import { StyleSheet } from 'react-native';

const ArmoireStyle = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f4f6',
    padding: 10,
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
  },
  textContainer: {
    flex: 1,
    marginLeft: 15,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  status: {
    fontSize: 14,
    color: '#888',
  },
  date: {
    fontSize: 12,
    color: '#aaa',
  },
  photo: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  noItemsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  },
});

export default ArmoireStyle;
