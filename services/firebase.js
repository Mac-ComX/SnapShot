import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyDRY-j70w6lKRj0_9DGImi_Wr1Di-ZLCHg",
  authDomain: "camerastock-c5827.firebaseapp.com",
  projectId: "camerastock-c5827",
  storageBucket: "camerastock-c5827.appspot.com",
  messagingSenderId: "397659761555",
  appId: "1:397659761555:web:78c9aedf50640e52999666"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export const db = getFirestore(app);
export { storage };
