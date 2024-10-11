import { StyleSheet } from 'react-native';

const DashboardStyle = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
  },
  loadingText: {
    color: '#555',
    marginTop: 10,
    fontSize: 16,
  },
  subTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
    marginTop: 30,
  },
  grid: {
    flexDirection: 'row',
  },
  horizontalScroll: {
    marginBottom: 20,
  },
  cardSmall: {
    borderRadius: 12,
    padding: 15,
    width: 150,
    height: 150,
    marginRight: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  kpiTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 8,
    textAlign: 'center',
  },
  kpiValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
  },
  panneCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginRight: 15,
    width: 160,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  panneImage: {
    width: 140,
    height: 140,
    borderRadius: 12,
    marginBottom: 10,
  },
  panneName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  panneStatus: {
    fontSize: 12,
    color: '#E74C3C',
    textAlign: 'center',
  },
  noDataText: {
    color: '#777',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 25,
  },
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
  chartStyle: {
    borderRadius: 16,
    marginVertical: 8,
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
  valuesContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  barValue: {
    fontSize: 12,
    color: '#333',
  },
});

const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  fillShadowGradient: '#3498DB',
  fillShadowGradientTo: '#2980B9',
  fillShadowGradientToOpacity: 1,
  color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
  labelColor: () => 'green',
  decimalPlaces: 0,
  style: {
    borderRadius: 16,
  },
  propsForBackgroundLines: {
    stroke: '#eee',
  },
};


export default DashboardStyle;