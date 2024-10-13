import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
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
import DashboardStyle from '../Styles/DashboardStyle';

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
      <View style={DashboardStyle.loadingContainer}>
        <ActivityIndicator size="large" color="#66b08d" />
        <Text style={DashboardStyle.loadingText}>Chargement des données...</Text>
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
      style={DashboardStyle.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1b484e" />
      }
    >
      <Text style={DashboardStyle.subTitle}>Indicateurs</Text>
      {/* Indicateurs */}
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        style={DashboardStyle.horizontalScroll}
      >
        <View style={DashboardStyle.grid}>
          <View style={[DashboardStyle.cardSmall, { backgroundColor: '#4BC0C0' }]}>
            <Text style={DashboardStyle.kpiTitle}>Total des Décorations</Text>
            <Text style={DashboardStyle.kpiValue}>{stats.totalPhotos}</Text>
          </View>

          <View style={[DashboardStyle.cardSmall, { backgroundColor: '#FF6384' }]}>
            <Text style={DashboardStyle.kpiTitle}>Jours Travaillés</Text>
            <Text style={DashboardStyle.kpiValue}>{numberOfWorkDays}</Text>
          </View>

          <View style={[DashboardStyle.cardSmall, { backgroundColor: '#36A2EB' }]}>
            <Text style={DashboardStyle.kpiTitle}>Installations Fonctionnelles</Text>
            <Text style={DashboardStyle.kpiValue}>
              {stats.installationsByStatus['Fonctionnelle'] || 0}
            </Text>
          </View>

          <View style={[DashboardStyle.cardSmall, { backgroundColor: '#FFCE56' }]}>
            <Text style={DashboardStyle.kpiTitle}>Installations en Panne</Text>
            <Text style={DashboardStyle.kpiValue}>{stats.installationsByStatus['En panne'] || 0}</Text>
          </View>

          {/* Indicateur pour les armoires */}
          <View style={[DashboardStyle.cardSmall, { backgroundColor: '#9966FF' }]}>
            <Text style={DashboardStyle.kpiTitle}>Total des Armoires</Text>
            <Text style={DashboardStyle.kpiValue}>{stats.totalArmoires}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Décorations en Panne */}
      <Text style={DashboardStyle.subTitle}>Décorations en Panne</Text>
      {stats.decorationsEnPanne.length === 0 ? (
        <Text style={DashboardStyle.noDataText}>Aucune décoration en panne.</Text>
      ) : (
        <FlatList
          data={stats.decorationsEnPanne}
          keyExtractor={(item, index) => index.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={DashboardStyle.horizontalScroll}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('DetailsDebugScreen', { photo: item });
              }}
            >
              <View style={DashboardStyle.panneCard}>
                <PublicImage storagePath={item.imageUri} style={DashboardStyle.panneImage} />
                <Text style={DashboardStyle.panneName}>{item.name}</Text>
                <Text style={DashboardStyle.panneStatus}>{item.status}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Répartition des Types d'Installations */}
      <View style={DashboardStyle.cardLarge}>
        <Text style={DashboardStyle.chartTitle}>Répartition des Types d'Installations</Text>
        <View style={DashboardStyle.pieChartContainer}>
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
          <View style={DashboardStyle.centerTextContainer}>
            <Text style={DashboardStyle.centerText}>{stats.totalPhotos}</Text>
            <Text style={DashboardStyle.centerLabel}>Décors</Text>
          </View>
        </View>

        <View style={DashboardStyle.legendContainer}>
          {pieChartData.map((item, index) => (
            <View key={index} style={DashboardStyle.legendItem}>
              <View style={[DashboardStyle.legendColor, { backgroundColor: item.color }]} />
              <Text style={DashboardStyle.legendLabel}>
                {item.name}: {item.percentage}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Graphiques */}
      <View style={DashboardStyle.cardLarge}>
        <Text style={DashboardStyle.chartTitle}>Décorations Capturées par Jour</Text>
        <ScrollView horizontal={true}>
          <View>
            <BarChart
              data={barChartData}
              width={Math.max(screenWidth - 125, formattedDates.length * 50)}
              height={300}
              chartConfig={chartConfig}
              verticalLabelRotation={45}
              fromZero={true}
              style={[DashboardStyle.chartStyle, { marginLeft: -25}]} // Ajustement du marginLeft
              showValuesOnTopOfBars={true}
              xLabelsOffset={10} // Ajustement du xLabelsOffset
              yLabelsOffset={20}
              withVerticalLines={false} // Empêcher les lignes verticales de dépasser
            />
          </View>
        </ScrollView>
      </View>

      {/* Nouveau graphique des installations par armoire */}
      <View style={DashboardStyle.cardLarge}>
        <Text style={DashboardStyle.chartTitle}>Installations par Armoire</Text>
        {stats.armoireData && (
          <ScrollView horizontal={true}>
            <BarChart
              data={stats.armoireData}
              width={Math.max(screenWidth - 40, stats.armoireData.labels.length * 125)}
              height={600}
              chartConfig={chartConfig}
              verticalLabelRotation={45}
              fromZero={true}
              style={[DashboardStyle.chartStyle, { marginLeft: -25,}]} 
              showValuesOnTopOfBars={true}
              xLabelsOffset={-10}
              yLabelsOffset={20}
            />
          </ScrollView>
        )}
      </View>

      <View style={DashboardStyle.cardLarge}>
        <Text style={DashboardStyle.chartTitle}>Évolution Quotidienne</Text>
        <ScrollView horizontal={true}>
          <LineChart
            data={lineChartData}
            width={Math.max(screenWidth - 40, formattedDates.length * 50)}
            height={260}
            chartConfig={chartConfig}
            bezier
            style={[DashboardStyle.chartStyle, { marginLeft: -40 }]} 
            verticalLabelRotation={45}
          />
        </ScrollView>
      </View>
    </ScrollView>
  );
}

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
