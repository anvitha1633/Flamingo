// App.js — Flamingo Nails Expo React Native prototype
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, TouchableOpacity, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { auth, db } from './firebaseConfig';
import ReceptionistDashboard from "./screens/ReceptionistDashboard";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import axios from 'axios';
import { SERVICES } from './services';
import { doc, getDoc } from 'firebase/firestore';
import { onSnapshot } from "firebase/firestore";

const Stack = createNativeStackNavigator();
const AI_BACKEND_URL = 'https://your-backend.example.com/ai-chat'; // replace with your deployed backend URL

// ------------------ SIGN IN ------------------
function SignInScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);

    async function signIn() {
        try {
            await signInWithEmailAndPassword(auth, email, pass);
            Alert.alert('Sign in successful');
            navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }], // or any screen you want to show after login
            });
        } catch (e) {
            Alert.alert('Sign in error', e.message);
        }
    }

    return (
        <View style={{ padding: 20, flex: 1, justifyContent: 'center' }}>
            <Text style={{ fontSize: 28, marginBottom: 10 }}>Flamingo</Text>
            <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={{ borderWidth: 1, padding: 8, marginBottom: 10 }}
            />
            <TextInput
                placeholder="Password"
                value={pass}
                onChangeText={setPass}
                secureTextEntry
                style={{ borderWidth: 1, padding: 8, marginBottom: 10 }}
            />
            <Button title="Sign in" onPress={signIn} />
            <View style={{ height: 10 }} />
            <Button title="Create account" onPress={() => navigation.navigate('SignUp')} />
        </View>
    );
}

// ------------------ SIGN UP ------------------
function SignUpScreen() {
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');

    async function signUp() {
        try {
            const cred = await createUserWithEmailAndPassword(auth, email, pass);
            const user = cred.user;

            // Create Firestore record via backend
            await fetch("https://flamingo-ctga.onrender.com/create-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    uid: user.uid,
                    email: user.email
                }),
            });

            Alert.alert('Account created');
        } catch (e) {
            Alert.alert('Sign up error', e.message);
        }
    }

    return (
        <View style={{ padding: 20, flex: 1, justifyContent: 'center' }}>
            <Text style={{ fontSize: 24, marginBottom: 10 }}>Create account</Text>
            <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                style={{ borderWidth: 1, padding: 8, marginBottom: 10 }}
            />
            <TextInput
                placeholder="Password"
                value={pass}
                onChangeText={setPass}
                secureTextEntry
                style={{ borderWidth: 1, padding: 8, marginBottom: 10 }}
            />
            <Button title="Sign up" onPress={signUp} />
        </View>
    );
}

// ------------------ HOME ------------------
function HomeScreen({ navigation }) {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            setUser(u);
            if (u) {
                const ref = doc(db, "users", u.uid);
                const snap = await getDoc(ref);
                if (snap.exists()) {
                    setRole(snap.data().role);
                } else {
                    setRole(null);
                }
            } else {
                setRole(null);
            }
        });
        return unsub;
    }, []);

    async function doSignOut() {
        await signOut(auth);
        Alert.alert("Signed out");
    }

    return (
        <View style={{ flex: 1, padding: 20 }}>
            <Text style={{ fontSize: 22 }}>Welcome to Flamingo Nails</Text>
            <Text style={{ marginTop: 8 }}>Locations: Mangalore, Manipal</Text>
            <View style={{ height: 12 }} />

            <Button title="Book Appointment" onPress={() => navigation.navigate('Services')} />
            <View style={{ height: 10 }} />
            <Button title="Chat with AI Assistant" onPress={() => navigation.navigate('Chat')} />
            <View style={{ height: 10 }} />
            <Button title="My Bookings" onPress={() => navigation.navigate('MyBookings')} />
            <View style={{ height: 20 }} />

            {user ? (
                <>
                    <Text>Signed in as: {user.email}</Text>
                    <View style={{ height: 8 }} />
                    <Button title="Sign out" onPress={doSignOut} />

                    {/* ✅ Only for Receptionist users */}
                    {role === "receptionist" && (
                        <>
                            <View style={{ height: 10 }} />
                            <Button
                                title="Receptionist Dashboard"
                                onPress={() => navigation.navigate('ReceptionistDashboard')}
                            />
                        </>
                    )}
                </>
            ) : (
                <Button title="Sign in / Sign up" onPress={() => navigation.navigate('SignIn')} />
            )}
        </View>
    );
}

// ------------------ SERVICES ------------------
function ServicesScreen({ navigation }) {
    return (
        <View style={{ flex: 1, padding: 20 }}>
            <Text style={{ fontSize: 20, marginBottom: 10 }}>Services</Text>
            <FlatList
                data={SERVICES}
                keyExtractor={(i) => i.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Book', { service: item })}
                        style={{ padding: 12, borderWidth: 1, marginBottom: 8 }}
                    >
                        <Text style={{ fontSize: 16 }}>{item.name}</Text>
                        <Text>Duration: {item.durationMins} mins • ₹{item.price}</Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}

// ------------------ BOOK ------------------
function BookScreen({ route, navigation }) {
    const { service } = route.params;
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const user = auth.currentUser;

    async function confirmBooking() {
        if (!user) { Alert.alert('Please sign in'); return; }
        if (!date || !time) { Alert.alert('Pick date & time'); return; }
        try {
            await fetch("https://flamingo-ctga.onrender.com/book", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerId: user.uid,
                    customerName: user.displayName || data.customerEmail.split('@')[0],
                    customerEmail: user.email,
                    appointmentDate: date,
                    appointmentTime: time,
                    serviceType: service.name,
                }),
            });

            Alert.alert('Booking created', `Service: ${service.name}\n${date} ${time}`);
            navigation.popToTop();
        } catch (e) {
            Alert.alert('Error', e.message);
        }
    }

    return (
        <View style={{ padding: 20 }}>
            <Text style={{ fontSize: 20 }}>{service.name}</Text>
            <TextInput
                placeholder="YYYY-MM-DD (e.g. 2025-11-10)"
                value={date}
                onChangeText={setDate}
                style={{ borderWidth: 1, padding: 8, marginTop: 12 }}
            />
            <TextInput
                placeholder="HH:MM (24h, e.g. 15:30)"
                value={time}
                onChangeText={setTime}
                style={{ borderWidth: 1, padding: 8, marginTop: 8 }}
            />
            <View style={{ height: 12 }} />
            <Button title="Confirm Booking" onPress={confirmBooking} />
        </View>
    );
}

// ------------------ MY BOOKINGS ------------------
function MyBookingsScreen() {
    const [bookings, setBookings] = useState([]);
    const user = auth.currentUser;

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'appointments'),
            where('customerEmail', '==', user.email) // ✅ matching Firestore field
        );

        const unsub = onSnapshot(q, snap => {
            const arr = snap.docs.map(d => {
                const data = d.data();
                return {
                    id: d.id,
                    customer: data.customerEmail, // ✅ Show email instead of name
                    serviceName: data.serviceType, // ✅ map to UI field
                    date: data.appointmentDate,    // ✅ map to UI field
                    time: data.appointmentTime,    // ✅ map to UI field
                    status: data.status || "pending"
                };
            });

            setBookings(arr);
        });

        return unsub;
    }, [user]);


    return (
        <View style={{ flex: 1, padding: 20 }}>
            <Text style={{ fontSize: 20, marginBottom: 10 }}>My Bookings</Text>
            <FlatList
                data={bookings}
                keyExtractor={(i) => i.id}
                renderItem={({ item }) => (
                    <View style={{ padding: 10, borderWidth: 1, marginBottom: 8 }}>
                        <Text>{item.serviceType}</Text>
                        <Text>{item.appointmentDate} {item.appointmentTime}</Text>
                        <Text>Status: {item.status}</Text>
                    </View>
                )}
            />
        </View>
    );
}

// ------------------ CHAT ------------------
function ChatScreen() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');

    async function sendMessage() {
        if (!input.trim()) return;

        const userMsg = { from: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);

        try {
            const res = await fetch('https://flamingo-ctga.onrender.com/ai-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: input })
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();
            const botMsg = { from: 'bot', text: data.reply || '(no reply)' };
            setMessages(prev => [...prev, botMsg]);
        } catch (err) {
            console.error('Error sending message:', err);
            const botMsg = { from: 'bot', text: 'Error: Could not reach AI backend.' };
            setMessages(prev => [...prev, botMsg]);
        }

        setInput('');
    }

    return (
        <View style={{ flex: 1, padding: 20 }}>
            <FlatList
                data={messages}
                keyExtractor={(_, i) => i.toString()}
                renderItem={({ item }) => (
                    <View
                        style={{
                            alignSelf: item.from === 'user' ? 'flex-end' : 'flex-start',
                            backgroundColor: item.from === 'user' ? '#ffb6c1' : '#e0e0e0',
                            padding: 10,
                            borderRadius: 10,
                            marginVertical: 4,
                            maxWidth: '80%',
                        }}
                    >
                        <Text>{item.text}</Text>
                    </View>
                )}
            />

            <View style={{ flexDirection: 'row', marginTop: 10 }}>
                <TextInput
                    style={{ flex: 1, borderWidth: 1, padding: 8 }}
                    value={input}
                    onChangeText={setInput}
                    placeholder="Type your message..."
                />
                <Button title="Send" onPress={sendMessage} />
            </View>
        </View>
    );
}


// ------------------ APP ROOT ------------------
export default function App() {
    return (
        <NavigationContainer>
            <Stack.Navigator>
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="SignIn" component={SignInScreen} />
                <Stack.Screen name="SignUp" component={SignUpScreen} />
                <Stack.Screen name="Services" component={ServicesScreen} />
                <Stack.Screen name="Book" component={BookScreen} />
                <Stack.Screen name="MyBookings" component={MyBookingsScreen} />
                <Stack.Screen name="Chat" component={ChatScreen} />
                <Stack.Screen
                    name="ReceptionistDashboard"
                    component={ReceptionistDashboard}
                    options={{ title: "Receptionist Dashboard" }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
