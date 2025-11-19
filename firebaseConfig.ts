// firebaseConfig.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import {
  child,
  get,
  getDatabase,
  push,
  ref,
  remove,
  set,
  update
} from "firebase/database";

// ==================== CONFIGURATION FIREBASE ====================
const firebaseConfig = {
  apiKey: "AIzaSyDhmyQkOoSxxo4TbjUtpALNIPMzr0FfsXE",
  authDomain: "auth-a2378.firebaseapp.com",
  databaseURL: "https://auth-a2378-default-rtdb.firebaseio.com",
  projectId: "auth-a2378",
  storageBucket: "auth-a2378.firebasestorage.app",
  messagingSenderId: "55538985218",
  appId: "1:55538985218:web:eff73f863a961acee87a1b"
};

// ==================== INITIALISATION ====================
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// ✅ Auth avec persistance (React Native)
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// ✅ Base de données en temps réel
export const db = getDatabase(app);

// ===============================================================
// ✅ ENREGISTRER UN UTILISATEUR DANS LA REALTIME DATABASE
// ===============================================================
export const saveUserToRealtimeDB = async (uid: string, userData: any) => {
  const userRef = ref(db, `users/${uid}`);
  await set(userRef, { ...userData, createdAt: new Date().toISOString() });
};

// ===============================================================
// ✅ AJOUTER UN PRODUIT LIÉ À UN UTILISATEUR
// ===============================================================
export const addProduct = async (uid: string, productData: any) => {
  const productsRef = ref(db, `products/${uid}`);
  const newProductRef = push(productsRef);
  await set(newProductRef, { ...productData, createdAt: new Date().toISOString() });
};

// ===============================================================
// ✅ RÉCUPÉRER LES PRODUITS D’UN UTILISATEUR
// ===============================================================
export const getUserProducts = async (uid: string) => {
  const dbRef = ref(db);
  const snapshot = await get(child(dbRef, `products/${uid}`));
  if (snapshot.exists()) {
    const data = snapshot.val();
    return Object.keys(data).map((key) => ({ id: key, ...data[key] }));
  }
  return [];
};

// ===============================================================
// ✅ METTRE À JOUR UN PRODUIT
// ===============================================================
export const updateProduct = async (uid: string, productId: string, updatedData: any) => {
  const productRef = ref(db, `products/${uid}/${productId}`);
  await update(productRef, updatedData);
};

// ===============================================================
// ✅ SUPPRIMER UN PRODUIT
// ===============================================================
export const deleteProduct = async (uid: string, productId: string) => {
  const productRef = ref(db, `products/${uid}/${productId}`);
  await remove(productRef);
};
