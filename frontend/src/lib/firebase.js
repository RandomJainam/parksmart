import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyB2mGC1FYDHxdKH02o-2r_kSU1X07omeoE",
  authDomain: "spark-12f5f.firebaseapp.com",
  projectId: "spark-12f5f",
  storageBucket: "spark-12f5f.firebasestorage.app",
  messagingSenderId: "647068680623",
  appId: "1:647068680623:web:4b1db25b2db2c604322f5a"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export const initAuth = () => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('User authenticated:', user.uid);
        resolve(user);
      } else {
        signInAnonymously(auth)
          .then((userCredential) => {
            console.log('Anonymous sign-in successful:', userCredential.user.uid);
            resolve(userCredential.user);
          })
          .catch((error) => {
            console.error('Anonymous sign-in error:', error);
            resolve(null);
          });
      }
      unsubscribe();
    });
  });
};
