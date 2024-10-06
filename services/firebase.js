// Importation des modules Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage} from 'firebase/storage';

// Configuration Firebase pour ton projet
const firebaseConfig = {
  apiKey: "AIzaSyDRY-j70w6lKRj0_9DGImi_Wr1Di-ZLCHg",
  authDomain: "camerastock-c5827.firebaseapp.com",
  projectId: "camerastock-c5827",
  storageBucket: "camerastock-c5827.appspot.com",
  messagingSenderId: "397659761555",
  appId: "1:397659761555:web:78c9aedf50640e52999666"
};

// Initialiser l'application Firebase
const app = initializeApp(firebaseConfig);

// Initialiser Firestore
const db = getFirestore(app);

// Initialiser Firebase Storage
const storage = getStorage(app);

// Exporter les services Firebase pour être utilisés dans d'autres fichiers
export { db, storage };
