// App.js — Flamingo Nails Expo SDK 54
import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, Alert, Image, StyleSheet, ActivityIndicator, FlatList, Linking
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

import { auth, db } from './firebaseConfig';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';

import ReceptionistDashboard from './screens/ReceptionistDashboard';
import { SERVICES } from './services';

const Stack = createNativeStackNavigator();
const logo = require('./assets/logo.png');

// ------------------ SIGN IN ------------------
function SignInScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');

    async function signIn() {
        if (!email || !pass) return Alert.alert('Enter email and password');
        try {
            await signInWithEmailAndPassword(auth, email, pass);
            navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        } catch (e) {
            Alert.alert('Sign in error', e.message);
        }
    }

    return (
        <View style={styles.centeredContainer}>
            <Text style={styles.logoTitle}>Flamingo</Text>
            <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
            />
            <TextInput
                placeholder="Password"
                value={pass}
                onChangeText={setPass}
                secureTextEntry
                style={styles.input}
            />
            <TouchableOpacity style={styles.primaryBtn} onPress={signIn}>
                <Text style={styles.primaryBtnText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.secondaryBtnText}>Create Account</Text>
            </TouchableOpacity>
        </View>
    );
}

// ------------------ HOME ------------------
function HomeScreen({ navigation }) {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (u) => {
            setUser(u);
            if (u) {
                try {
                    const ref = doc(db, "users", u.uid);
                    const snap = await getDoc(ref);
                    setRole(snap.exists() ? snap.data().role : null);
                } catch (err) {
                    console.error(err);
                    setRole(null);
                }
            } else {
                setRole(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    if (loading) {
        return (
            <View style={styles.centeredContainer}>
                <ActivityIndicator size="large" color="#FF1493" />
            </View>
        );
    }

    const handleSignOut = async () => {
        await signOut(auth);
        Alert.alert('Signed out');
    };

    const openMap = (location) => {
        Linking.openURL(`https://www.google.com/maps?q=Flamingo+Nails,+${location}`);
    };

    return (
        <View style={styles.container}>
            <Image source={logo} style={styles.logo} resizeMode="contain" />
            <Text style={styles.title}>Welcome to Flamingo Nails</Text>
            <Text style={styles.subtitle}>Where beauty meets perfection 💅</Text>

            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Services')}>
                    <Text style={styles.buttonText}>💖 Book Appointment</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('MyBookings')}>
                    <Text style={styles.buttonText}>📅 My Bookings</Text>
                </TouchableOpacity>

                {user && role === 'receptionist' && (
                    <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('ReceptionistDashboard')}>
                        <Text style={styles.buttonText}>🪶 Receptionist Dashboard</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.footer}>
                {user ? (
                    <>
                        <Text style={styles.userText}>Signed in as: {user.email}</Text>
                        <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
                            <Text style={styles.signOutText}>Sign out</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <TouchableOpacity onPress={() => navigation.navigate('SignIn')} style={styles.signInBtn}>
                        <Text style={styles.signOutText}>Sign in / Sign up</Text>
                    </TouchableOpacity>
                )}

                <View style={styles.locationContainer}>
                    <TouchableOpacity onPress={() => openMap('Mangalore')}>
                        <Text style={styles.locationLink}>📍 Mangalore</Text>
                    </TouchableOpacity>
                    <Text style={styles.separator}> • </Text>
                    <TouchableOpacity onPress={() => openMap('Manipal')}>
                        <Text style={styles.locationLink}>📍 Manipal</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

// ------------------ SERVICES ------------------
function ServicesScreen({ navigation }) {
    const serviceImages = {
        nail_ext: require('./assets/services/nail_ext.png'),
        nail_ext_feet: require('./assets/services/nail_ext_feet.png'),
        overlay: require('./assets/services/overlay.png'),
        gel_removal: require('./assets/services/gel_removal.png'),
        nail_art_simple: require('./assets/services/nail_art_simple.png'),
        nail_art_complex: require('./assets/services/nail_art_complex.png'),
        lash_ext: require('./assets/services/lash_ext.png'),
        manicure: require('./assets/services/manicure.png'),
        pedicure: require('./assets/services/pedicure.png'),
        hair: require('./assets/services/hair.png'),
        eyebrows: require('./assets/services/eyebrows.png'),
        Bridal: require('./assets/services/Bridal.png'),
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#fff5f8', padding: 20 }}>
            <Image source={logo} style={{ width: 90, height: 90, alignSelf: 'center', marginBottom: 10 }} />
            <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#ff69b4', textAlign: 'center', marginBottom: 20 }}>
                💅 Flamingo Nails Services
            </Text>

            <FlatList
                data={SERVICES}
                keyExtractor={(i) => i.id}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => navigation.navigate('Book', { service: item })}
                        style={{ backgroundColor: '#ffe6ef', borderRadius: 15, marginBottom: 16 }}>
                        <Image source={serviceImages[item.id]} style={{ width: '100%', height: 160 }} resizeMode="cover" />
                        <View style={{ padding: 15 }}>
                            <Text style={{ fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 6 }}>{item.name}</Text>
                            <Text style={{ color: '#555' }}>Duration: {item.durationMins} mins</Text>
                            <Text style={{ color: '#000', fontSize: 16, fontWeight: 'bold', marginTop: 4 }}>₹{item.price}</Text>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}

// ------------------ APP ROOT ------------------
export default function App() {
    return (
        <PaperProvider>
            <NavigationContainer>
                <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="Home" component={HomeScreen} />
                    <Stack.Screen name="SignIn" component={SignInScreen} />
                    <Stack.Screen name="Services" component={ServicesScreen} />
                    <Stack.Screen name="MyBookings" component={() => <View><Text>My Bookings Placeholder</Text></View>} />
                    <Stack.Screen name="ReceptionistDashboard" component={ReceptionistDashboard} />
                </Stack.Navigator>
            </NavigationContainer>
        </PaperProvider>
    );
}

// ------------------ STYLES ------------------
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF5F8', alignItems: 'center', padding: 20 },
    centeredContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: 30, backgroundColor: '#fdf6f0' },
    logo: { width: 150, height: 150, marginBottom: 15 },
    logoTitle: { fontSize: 36, fontWeight: 'bold', color: '#ff6fa3', alignSelf: 'center', marginBottom: 40 },
    input: { borderWidth: 1, borderColor: '#ffb6c1', padding: 15, borderRadius: 12, marginBottom: 15, backgroundColor: '#fff', fontSize: 16 },
    primaryBtn: { backgroundColor: '#ff6fa3', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginBottom: 15 },
    primaryBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    secondaryBtn: { paddingVertical: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#ff6fa3', backgroundColor: '#fff' },
    secondaryBtnText: { color: '#ff6fa3', fontSize: 18, fontWeight: 'bold' },
    buttonContainer: { width: '100%', alignItems: 'center' },
    button: { width: '85%', backgroundColor: '#FFC0CB', borderRadius: 25, paddingVertical: 14, marginVertical: 8, alignItems: 'center' },
    buttonText: { fontSize: 16, color: '#fff', fontWeight: '600' },
    footer: { position: 'absolute', bottom: 40, alignItems: 'center' },
    userText: { fontSize: 14, color: '#333' },
    signOutBtn: { marginTop: 6 },
    signInBtn: { backgroundColor: '#FF69B4', borderRadius: 20, paddingVertical: 10, paddingHorizontal: 20, marginTop: 10 },
    signOutText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    locationContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
    locationLink: { color: '#D63384', fontWeight: 'bold', textDecorationLine: 'underline', fontSize: 15 },
    separator: { color: '#888', fontSize: 16, marginHorizontal: 4 },
    title: { fontSize: 26, fontWeight: '700', color: '#D63384', marginBottom: 5, textAlign: 'center' },
    subtitle: { fontSize: 16, color: '#555', textAlign: 'center', marginBottom: 30 },
});
