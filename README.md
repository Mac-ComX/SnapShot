
# Projet de Gestion des Décorations Urbaines

## Description
Cette application mobile permet de gérer, visualiser et suivre les décorations urbaines, y compris les photos, les armoires et les notes associées. Elle offre une interface utilisateur intuitive pour les tâches courantes telles que la prise de photos, la maintenance, la visualisation des installations sur une carte, et bien plus.

## Fonctionnalités
- **Carte interactive** : Affichage des installations et armoires sur une carte avec des marqueurs interactifs.
- **Prise de photos** : Capture et gestion des photos des décorations urbaines.
- **Gestion des armoires** : Liste et détails des armoires d'installation.
- **Tableau de bord** : Vue d'ensemble des statistiques des installations.
- **Notes** : Ajout et gestion de notes associées aux installations.
- **Galerie** : Navigation par années, villes, et rues pour visualiser les photos.
- **Maintenance** : Gestion des pannes et réparations.

## Installation
### Prérequis
- [Node.js](https://nodejs.org/)
- [Expo CLI](https://expo.dev/)
- Compte Firebase avec un projet configuré.

### Étapes
1. Clonez le dépôt :
   ```bash
   git clone <url-du-repo>
   ```
2. Installez les dépendances :
   ```bash
   npm install
   ```
3. Configurez Firebase :
   - Ajoutez le fichier `firebase-config.js` dans `src/services` avec vos identifiants Firebase.
4. Lancez l'application :
   ```bash
   expo start
   ```

## Structure du Projet
```
src/
├── components/           # Composants réutilisables
├── navigation/           # Gestion des stacks et drawers
├── screens/              # Écrans principaux
├── hooks/                # Hooks personnalisés pour Firebase
├── services/             # Services Firebase
├── Styles/               # Styles des composants et écrans
├── utils/                # Fonctions utilitaires
```

## Navigation
- **`DrawerNavigator`** : Gestion des écrans principaux via un menu latéral.
- **Stacks** :
  - `DashboardStack` : Tableau de bord.
  - `MapScreenStack` : Carte et détails des installations.
  - `CameraStack` : Prise de photos et prévisualisations.
  - `ArmoireStack` : Gestion des armoires.
  - `MaintenanceStack` : Gestion des pannes et réparations.
  - `GalerieStack` : Galerie photos organisée par années, villes et rues.
  - `NotesStack` : Gestion des notes.

## Dépendances Clés
- **React Navigation** : Gestion de la navigation entre écrans.
- **Firebase** : Backend pour les données et stockage des photos.
- **Expo** : Plateforme pour le développement mobile.
- **React Native Vector Icons** : Icônes pour l'interface utilisateur.

## Contribution
1. Forkez le dépôt.
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/nom-de-la-fonctionnalité`).
3. Committez vos modifications (`git commit -m "Ajout de la fonctionnalité X"`).
4. Poussez votre branche (`git push origin feature/nom-de-la-fonctionnalité`).
5. Ouvrez une Pull Request.

## Licence
Ce projet est sous licence [MIT](LICENSE).
