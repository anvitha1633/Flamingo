// firebaseConfig.js
import { initializeApp, getApps, getApp } from "firebase/app";
import {
    initializeAuth,
    getReactNativePersistence,
} from "firebase/auth/react-native";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";

// Firebase config
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_APIKEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTHDOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECTID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGEBUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_SENDERID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APPID,
};

// Avoid duplicate initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 🔥 PERSISTENCE FIX
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

const db = getFirestore(app);

export { auth, db };
