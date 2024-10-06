// Importation des modules Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage} from 'firebase/storage';

// Configuration Firebase pour ton projet
const firebaseConfig = {
  apiKey: "AIzaSyABI-GvNcR32yUAS4-BWlYka4BBv6rTRMw",
  authDomain: "illuminations-vda.firebaseapp.com",
  projectId: "illuminations-vda",
  storageBucket: "illuminations-vda.appspot.com",
  messagingSenderId: "574292872540",
  appId: "1:574292872540:web:8cbbad8daa51c02b470599"
};

// Initialiser l'application Firebase
const app = initializeApp(firebaseConfig);

// Initialiser Firestore
const db = getFirestore(app);

// Initialiser Firebase Storage
const storage = getStorage(app);

// Exporter les services Firebase pour être utilisés dans d'autres fichiers
export { db, storage };
