// firebaseConfig.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_APIKEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTHDOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECTID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGEBUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_SENDERID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APPID,
};

// Initialize app once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// ✔️ No persistence config needed in Expo
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
