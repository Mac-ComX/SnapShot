// hooks/useFirestoreData.js
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

// Hook générique pour récupérer des données depuis Firestore
const useFirestoreData = (collectionName, filters = [], listen = true) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const collectionRef = collection(db, collectionName);
    let q = collectionRef;

    // Appliquer les filtres si présents
    if (filters.length > 0) {
      filters.forEach((filter) => {
        q = query(q, where(filter.field, filter.operator, filter.value));
      });
    }

    const unsubscribe = listen
      ? onSnapshot(
          q,
          (snapshot) => {
            const result = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setData(result);
            setLoading(false);
          },
          (err) => {
            console.error('Error fetching data:', err);
            setError('Error fetching data');
            setLoading(false);
          }
        )
      : () => {}; // Si `listen` est `false`, on n'écoute pas les changements.

    return () => unsubscribe();
  }, [collectionName, filters, listen]);

  return { data, loading, error };
};

export default useFirestoreData;
