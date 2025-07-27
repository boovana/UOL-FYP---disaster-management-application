

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage'; 

import { initializeAuth, getReactNativePersistence, getAuth , GoogleAuthProvider} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';


const firebaseConfig = {
  apiKey: "AIzaSyBbFqJll0vy_RLUpNJyzYCmVePa2N79wLA",
  authDomain: "sturdy-layout-462317-b2.firebaseapp.com",
  projectId: "sturdy-layout-462317-b2",
  storageBucket: "sturdy-layout-462317-b2.firebasestorage.app",
  messagingSenderId: "839917662899",
  appId: "1:839917662899:web:a8801a11d770657d2036c6"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const db = getFirestore(app);
const storage = getStorage(app);

let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  auth = getAuth(app);
}

// const app = initializeApp(firebaseConfig);
// const auth = initializeAuth(app, {
//   persistence: getReactNativePersistence(AsyncStorage),
// });

export { auth , GoogleAuthProvider, db, storage};
