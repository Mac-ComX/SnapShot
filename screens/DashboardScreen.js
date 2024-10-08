import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import Svg, { G, Circle } from 'react-native-svg';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useNavigation } from '@react-navigation/native';
import PublicImage from '../components/PublicImage';

const screenWidth = Dimensions.get('window').width;
const radius = 90;
const strokeWidth = 40;
const center = radius + strokeWidth / 2;

const getValidDateFromCreatedAt = (createdAt) => {
  if (!createdAt) return null;

  if (createdAt.seconds) {
    return new Date(createdAt.seconds * 1000);
  }

  if (typeof createdAt === 'string') {
    const [datePart, timePart] = createdAt.split(', ');
    const [day, month, year] = datePart.split('/');
    const [hours, minutes] = timePart.split(':');
    return new Date(`${year}-${month}-${day}T${hours}:${minutes}:00`);
  }

  if (typeof createdAt === 'number') {
    return new Date(createdAt);
  }

  return new Date();
};

export default function DashboardScreen() {
  const [stats, setStats] = useState({
    totalPhotos: 0,
    photosByType: {},
    photosByDate: [],
    installationsByStatus: {},
    installationsByInstallationStatus: {},
    installationsBySpecificTypes: {
      MCD: 0,
      STU: 0,
      MTR: 0,
      GTR: 0,
      GAR: 0,
    },
    decorationsEnPanne: [],
    totalArmoires: 0,
    armoireData: null, // Données pour le graphique des armoires
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const navigation = useNavigation();

  const fetchData = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'decorations'));

      // Exclure les installations dont le nom commence par 'ARM'
      const installations = snapshot.docs.filter((doc) => {
        const data = doc.data();
        const installationName = data.installationName || '';
        return !installationName.startsWith('ARM');
      });

      // Calculer le total des photos en excluant les armoires et les installations commençant par 'ARM'
      const totalPhotos = installations.reduce((count, doc) => {
        const data = doc.data();
        return data.installationType !== 'Armoire' ? count + 1 : count;
      }, 0);

      // Calculer le nombre d'armoires
      const totalArmoires = snapshot.docs.reduce((count, doc) => {
        const data = doc.data();
        return data.installationType === 'Armoire' ? count + 1 : count;
      }, 0);

      const installationsBySpecificTypes = {
        MCD: 0,
        STU: 0,
        MTR: 0,
        GTR: 0,
        GAR: 0,
      };

      const decorationsEnPanne = [];

      const typeMap = {
        'Motif Candélabre': 'MCD',
        'Motif Traversée': 'MTR',
        'Guirlande Traversée': 'GTR',
        'Guirlande Arbre': 'GAR',
        Structure: 'STU',
      };

      // Calculer photosByType en excluant les installations de type 'Armoire'
      const photosByType = installations.reduce((acc, doc) => {
        const data = doc.data();
        const type = data.installationType;
        const status = data.functionalityStatus;

        if (type === 'Armoire') {
          // Exclure les installations de type 'Armoire'
          return acc;
        }

        if (status === 'En panne') {
          decorationsEnPanne.push({
            name: data.installationName || 'Nom non disponible',
            status,
            imageUri: data.imageUri || 'https://via.placeholder.com/150',
            installationID: doc.id,
            address: data.address || 'Adresse non disponible',
            createdAt: data.createdAt,
            installationType: data.installationType,
            armoire: data.armoire,
          });
        }

        if (typeMap[type]) {
          installationsBySpecificTypes[typeMap[type]] += 1;
        }
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      // Photos par date en excluant les installations de type 'Armoire'
      const photosByDate = installations
        .filter((doc) => doc.data().installationType !== 'Armoire')
        .map((doc) => {
          const data = doc.data();
          const validDate = getValidDateFromCreatedAt(data.createdAt);
          return validDate ? validDate.toLocaleDateString('fr-FR') : 'Date inconnue';
        });

      const groupedByDate = photosByDate.reduce((acc, date) => {
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      // Installations par statut en excluant les installations de type 'Armoire'
      const installationsByStatus = installations.reduce((acc, doc) => {
        const data = doc.data();
        const type = data.installationType;
        if (type !== 'Armoire') {
          const status = data.functionalityStatus;
          acc[status] = (acc[status] || 0) + 1;
        }
        return acc;
      }, {});

      const installationsByInstallationStatus = installations.reduce((acc, doc) => {
        const data = doc.data();
        const type = data.installationType;
        if (type !== 'Armoire') {
          const status = data.installationStatus;
          acc[status] = (acc[status] || 0) + 1;
        }
        return acc;
      }, {});

      // Regrouper les installations par armoire en excluant les installations de type 'Armoire'
      const installationsByArmoire = {};

      installations.forEach((doc) => {
        const data = doc.data();
        const type = data.installationType;
        if (type !== 'Armoire') {
          const armoire = data.armoire || 'Inconnu';

          if (!installationsByArmoire[armoire]) {
            installationsByArmoire[armoire] = 0;
          }
          installationsByArmoire[armoire] += 1;
        }
      });

      // Préparer les données pour le graphique des armoires
      const armoireLabels = [];
      const armoireCounts = [];

      Object.keys(installationsByArmoire).forEach((armoire) => {
        armoireLabels.push(armoire);
        armoireCounts.push(installationsByArmoire[armoire]);
      });

      const armoireData = {
        labels: armoireLabels,
        datasets: [
          {
            data: armoireCounts,
          },
        ],
      };

      setStats({
        totalPhotos,
        totalArmoires,
        photosByType,
        photosByDate: Object.keys(groupedByDate)
          .sort((a, b) => {
            const dateA = new Date(a.split('/').reverse().join('-'));
            const dateB = new Date(b.split('/').reverse().join('-'));
            return dateA - dateB;
          })
          .map((date) => ({
            date,
            count: groupedByDate[date],
          })),
        installationsByStatus,
        installationsByInstallationStatus,
        installationsBySpecificTypes,
        decorationsEnPanne,
        armoireData, // Ajouter les données du graphique des armoires
      });
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques :', error);
      Alert.alert('Erreur', 'Impossible de récupérer les statistiques.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#66b08d" />
        <Text style={styles.loadingText}>Chargement des données...</Text>
      </View>
    );
  }

  const pieChartData = Object.keys(stats.photosByType).map((type, index) => ({
    name: type,
    percentage: stats.photosByType[type],
    color: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'][index % 5],
  }));

  const totalPercentage = pieChartData.reduce((acc, item) => acc + item.percentage, 0);
  let startAngle = 0;

  const numberOfWorkDays = new Set(stats.photosByDate.map((data) => data.date)).size;

  // Formater les labels pour afficher seulement jour/mois
  const formattedDates = stats.photosByDate.map((data) => {
    const dateParts = data.date.split('/');
    return `${dateParts[0]}/${dateParts[1]}`;
  });

  const lineChartData = {
    labels: formattedDates,
    datasets: [
      {
        data: stats.photosByDate.map((data) => data.count),
        color: () => `rgba(75, 192, 192, 1)`, // Couleur des lignes
        strokeWidth: 2,
      },
    ],
  };

  const barChartData = {
    labels: formattedDates,
    datasets: [
      {
        data: stats.photosByDate.map((data) => data.count),
      },
    ],
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1b484e" />
      }
    >
      <Text style={styles.subTitle}>Indicateurs</Text>
      {/* Indicateurs */}
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalScroll}
      >
        <View style={styles.grid}>
          <View style={[styles.cardSmall, { backgroundColor: '#4BC0C0' }]}>
            <Text style={styles.kpiTitle}>Total des Décorations</Text>
            <Text style={styles.kpiValue}>{stats.totalPhotos}</Text>
          </View>

          <View style={[styles.cardSmall, { backgroundColor: '#FF6384' }]}>
            <Text style={styles.kpiTitle}>Jours Travaillés</Text>
            <Text style={styles.kpiValue}>{numberOfWorkDays}</Text>
          </View>

          <View style={[styles.cardSmall, { backgroundColor: '#36A2EB' }]}>
            <Text style={styles.kpiTitle}>Installations Fonctionnelles</Text>
            <Text style={styles.kpiValue}>
              {stats.installationsByStatus['Fonctionnelle'] || 0}
            </Text>
          </View>

          <View style={[styles.cardSmall, { backgroundColor: '#FFCE56' }]}>
            <Text style={styles.kpiTitle}>Installations en Panne</Text>
            <Text style={styles.kpiValue}>{stats.installationsByStatus['En panne'] || 0}</Text>
          </View>

          {/* Indicateur pour les armoires */}
          <View style={[styles.cardSmall, { backgroundColor: '#9966FF' }]}>
            <Text style={styles.kpiTitle}>Total des Armoires</Text>
            <Text style={styles.kpiValue}>{stats.totalArmoires}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Décorations en Panne */}
      <Text style={styles.subTitle}>Décorations en Panne</Text>
      {stats.decorationsEnPanne.length === 0 ? (
        <Text style={styles.noDataText}>Aucune décoration en panne.</Text>
      ) : (
        <FlatList
          data={stats.decorationsEnPanne}
          keyExtractor={(item, index) => index.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalScroll}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('DetailsDebugScreen', { photo: item });
              }}
            >
              <View style={styles.panneCard}>
                <PublicImage storagePath={item.imageUri} style={styles.panneImage} />
                <Text style={styles.panneName}>{item.name}</Text>
                <Text style={styles.panneStatus}>{item.status}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Répartition des Types d'Installations */}
      <View style={styles.cardLarge}>
        <Text style={styles.chartTitle}>Répartition des Types d'Installations</Text>
        <View style={styles.pieChartContainer}>
          <Svg width={screenWidth - 60} height={220}>
            <G rotation="-90" origin={`${center}, ${center}`}>
              {pieChartData.map((item, index) => {
                const percentage = item.percentage / totalPercentage;
                const strokeDasharray = `${2 * Math.PI * radius * percentage} ${
                  2 * Math.PI * radius
                }`;
                const strokeDashoffset = 2 * Math.PI * radius * startAngle;
                startAngle += percentage;

                return (
                  <Circle
                    key={index}
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={item.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={-strokeDashoffset}
                    fill="transparent"
                  />
                );
              })}
            </G>
          </Svg>
          <View style={styles.centerTextContainer}>
            <Text style={styles.centerText}>{stats.totalPhotos}</Text>
            <Text style={styles.centerLabel}>Décors</Text>
          </View>
        </View>

        <View style={styles.legendContainer}>
          {pieChartData.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: item.color }]} />
              <Text style={styles.legendLabel}>
                {item.name}: {item.percentage}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Graphiques */}
      <View style={styles.cardLarge}>
        <Text style={styles.chartTitle}>Décorations Capturées par Jour</Text>
        <ScrollView horizontal={true}>
          <View>
            <BarChart
              data={barChartData}
              width={Math.max(screenWidth - 30, formattedDates.length * 50)}
              height={300}
              chartConfig={chartConfig}
              verticalLabelRotation={45}
              fromZero={true}
              style={[styles.chartStyle, { marginLeft: -25}]} // Ajustement du marginLeft
              showValuesOnTopOfBars={true}
              xLabelsOffset={10} // Ajustement du xLabelsOffset
              yLabelsOffset={20}
              withVerticalLines={false} // Empêcher les lignes verticales de dépasser
            />
          </View>
        </ScrollView>
      </View>

      {/* Nouveau graphique des installations par armoire */}
      <View style={styles.cardLarge}>
        <Text style={styles.chartTitle}>Installations par Armoire</Text>
        {stats.armoireData && (
          <ScrollView horizontal={true}>
            <BarChart
              data={stats.armoireData}
              width={Math.max(screenWidth - 40, stats.armoireData.labels.length * 70)}
              height={600}
              chartConfig={chartConfig}
              verticalLabelRotation={45}
              fromZero={true}
              style={[styles.chartStyle, { marginLeft: -25,}]} 
              showValuesOnTopOfBars={true}
              xLabelsOffset={-10}
              yLabelsOffset={20}
            />
          </ScrollView>
        )}
      </View>

      <View style={styles.cardLarge}>
        <Text style={styles.chartTitle}>Évolution Quotidienne</Text>
        <ScrollView horizontal={true}>
          <LineChart
            data={lineChartData}
            width={Math.max(screenWidth - 40, formattedDates.length * 50)}
            height={260}
            chartConfig={chartConfig}
            bezier
            style={[styles.chartStyle, { marginLeft: -40 }]} 
            verticalLabelRotation={45}
          />
        </ScrollView>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
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
