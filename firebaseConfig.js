// firebaseConfig.js
// Replace placeholders with your Firebase project's config values from Firebase console


import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';


const firebaseConfig = {
    apiKey: "<FIREBASE_API_KEY>",
    authDomain: "<PROJECT>.firebaseapp.com",
    projectId: "<PROJECT_ID>",
    storageBucket: "<PROJECT>.appspot.com",
    messagingSenderId: "<SENDER_ID>",
    appId: "<APP_ID>"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);