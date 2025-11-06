// firebaseConfig.js

import { initializeApp } from 'firebase/app';
import {
    getAuth,
    initializeAuth,
    getReactNativePersistence
} from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from "@react-native-async-storage/async-storage";

// ✅ Your actual config values
const firebaseConfig = {
    apiKey: "AIzaSyD-MAz6gkwvXeaZatLGjfEfy2naxFZtc1E",
    authDomain: "atproj-a2634.firebaseapp.com",
    databaseURL: "https://atproj-a2634-default-rtdb.firebaseio.com",
    projectId: "atproj-a2634",
    storageBucket: "atproj-a2634.appspot.com",
    messagingSenderId: "766446917106",
    appId: "1:766446917106:web:9f5147ec04aa20f32bc76b"
};

// ✅ Ensures authentication persists after app restart
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
});

// ✅ Firestore
export const db = getFirestore(app);