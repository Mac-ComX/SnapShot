// Importation des modules Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage} from 'firebase/storage';

// Configuration Firebase pour ton projet
const firebaseConfig = {
  apiKey: "AIzaSyAHl__r4c40TPW5infdn4vQ9HaYZS8OSR4",
  authDomain: "testapp-3c5cc.firebaseapp.com",
  projectId: "testapp-3c5cc",
  storageBucket: "testapp-3c5cc.appspot.com",
  messagingSenderId: "225262336385",
  appId: "1:225262336385:web:042247959b559a15295080"
};

// Initialiser l'application Firebase
const app = initializeApp(firebaseConfig);

// Initialiser Firestore
const db = getFirestore(app);

// Initialiser Firebase Storage
const storage = getStorage(app);

// Exporter les services Firebase pour être utilisés dans d'autres fichiers
export { db, storage };
