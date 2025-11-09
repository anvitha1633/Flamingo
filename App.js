// App.js — Flamingo Nails Expo React Native prototype
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, TouchableOpacity, Alert, Image, StyleSheet } from 'react-native';
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
import { Linking } from 'react-native';
import DateTimePicker from "@react-native-community/datetimepicker";

const Stack = createNativeStackNavigator();
// ✅ Import logo image
const logo = require('./assets/logo.png');
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
                const ref = doc(db, 'users', u.uid);
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
        Alert.alert('Signed out');
    }

    // 🔗 Open Google Maps links
    const openMapMangalore = () => {
        Linking.openURL('https://www.google.com/maps?q=Flamingo+Nails,+Mangalore');
    };

    const openMapManipal = () => {
        Linking.openURL('https://www.google.com/maps?q=Flamingo+Nails,+Manipal');
    };

    return (
        <View style={styles.container}>
            {/* 🦩 App Logo */}
            <Image
                source={require('./assets/logo.png')}
                style={styles.logo}
                resizeMode="contain"
            />

            {/* 🌸 Welcome text */}
            <Text style={styles.title}>Welcome to Flamingo Nails</Text>
            <Text style={styles.subtitle}>Where beauty meets perfection 💅</Text>

            {/* 🌺 Buttons */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate('Services')}
                >
                    <Text style={styles.buttonText}>💖 Book Appointment</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate('Chat')}
                >
                    <Text style={styles.buttonText}>💬 Chat with AI Assistant</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate('MyBookings')}
                >
                    <Text style={styles.buttonText}>📅 My Bookings</Text>
                </TouchableOpacity>

                {/* 🧾 Receptionist Dashboard */}
                {user && role === 'receptionist' && (
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => navigation.navigate('ReceptionistDashboard')}
                    >
                        <Text style={styles.buttonText}>🪶 Receptionist Dashboard</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* 🌼 Footer Section */}
            <View style={styles.footer}>
                {user ? (
                    <>
                        <Text style={styles.userText}>Signed in as: {user.email}</Text>
                        <TouchableOpacity onPress={doSignOut} style={styles.signOutBtn}>
                            <Text style={styles.signOutText}>Sign out</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <TouchableOpacity
                        onPress={() => navigation.navigate('SignIn')}
                        style={styles.signInBtn}
                    >
                        <Text style={styles.signOutText}>Sign in / Sign up</Text>
                    </TouchableOpacity>
                )}

                {/* 📍Clickable locations */}
                <View style={styles.locationContainer}>
                    <TouchableOpacity onPress={openMapMangalore}>
                        <Text style={styles.locationLink}>📍 Mangalore</Text>
                    </TouchableOpacity>
                    <Text style={styles.separator}> • </Text>
                    <TouchableOpacity onPress={openMapManipal}>
                        <Text style={styles.locationLink}>📍 Manipal</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF5F8',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    logo: {
        width: 150,
        height: 150,
        marginBottom: 15,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: '#D63384',
        marginBottom: 5,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
        marginBottom: 30,
    },
    buttonContainer: {
        width: '100%',
        alignItems: 'center',
    },
    button: {
        width: '85%',
        backgroundColor: '#FFC0CB',
        borderRadius: 25,
        paddingVertical: 14,
        marginVertical: 8,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
    buttonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
    footer: {
        position: 'absolute',
        bottom: 40,
        alignItems: 'center',
    },
    userText: {
        fontSize: 14,
        color: '#333',
    },
    signOutBtn: {
        marginTop: 6,
    },
    signInBtn: {
        backgroundColor: '#FF69B4',
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
        marginTop: 10,
    },
    signOutText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    locationLink: {
        color: '#D63384',
        fontWeight: 'bold',
        textDecorationLine: 'underline',
        fontSize: 15,
    },
    separator: {
        color: '#888',
        fontSize: 16,
        marginHorizontal: 4,
    },
});


// ------------------ SERVICES ------------------
function ServicesScreen({ navigation }) {
    // map service ID to local images
    const serviceImages = {
        nail_ext: require("./assets/services/nail_ext.png"),
        nail_ext_feet: require("./assets/services/nail_ext_feet.png"),
        overlay: require("./assets/services/overlay.png"),
        gel_removal: require("./assets/services/gel_removal.png"),
        nail_art_simple: require("./assets/services/nail_art_simple.png"),
        nail_art_complex: require("./assets/services/nail_art_complex.png"),
        lash_ext: require("./assets/services/lash_ext.png"),
        manicure: require("./assets/services/manicure.png"),
        pedicure: require("./assets/services/pedicure.png"),
        hair: require("./assets/services/hair.png"),
        eyebrows: require("./assets/services/eyebrows.png"),
        Bridal: require("./assets/services/Bridal.png")
    };

    return (
        <View style={{ flex: 1, backgroundColor: "#fff5f8", padding: 20 }}>
            {/* 🦩 Logo */}
            <Image
                source={require("./assets/logo.png")}
                style={{
                    width: 90,
                    height: 90,
                    alignSelf: "center",
                    marginBottom: 10,
                    borderRadius: 45,
                }}
                resizeMode="contain"
            />

            {/* Title */}
            <Text
                style={{
                    fontSize: 26,
                    fontWeight: "bold",
                    color: "#ff69b4",
                    textAlign: "center",
                    marginBottom: 20,
                }}
            >
                💅 Flamingo Nails Services
            </Text>

            {/* List of services */}
            <FlatList
                data={SERVICES}
                keyExtractor={(i) => i.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => navigation.navigate("Book", { service: item })}
                        style={{
                            backgroundColor: "#ffe6ef",
                            borderRadius: 15,
                            marginBottom: 16,
                            overflow: "hidden",
                            shadowColor: "#000",
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                            elevation: 2,
                        }}
                    >
                        <Image
                            source={serviceImages[item.id]}
                            style={{ width: "100%", height: 160 }}
                            resizeMode="cover"
                        />

                        <View style={{ padding: 15 }}>
                            <Text
                                style={{
                                    fontSize: 18,
                                    fontWeight: "600",
                                    color: "#333",
                                    marginBottom: 6,
                                }}
                            >
                                {item.name}
                            </Text>
                            <Text style={{ color: "#555" }}>
                                Duration: {item.durationMins} mins
                            </Text>
                            <Text
                                style={{
                                    color: "#000",
                                    fontSize: 16,
                                    fontWeight: "bold",
                                    marginTop: 4,
                                }}
                            >
                                ₹{item.price}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}


// ------------------ BOOK ------------------
function BookScreen({ route, navigation }) {
    const { service } = route.params;
    const [date, setDate] = useState(null);
    const [time, setTime] = useState(null);
    const [isDatePickerVisible, setDatePickerVisible] = useState(false);
    const [isTimePickerVisible, setTimePickerVisible] = useState(false);
    const user = auth.currentUser;

    const showDatePicker = () => setDatePickerVisible(true);
    const hideDatePicker = () => setDatePickerVisible(false);
    const showTimePicker = () => setTimePickerVisible(true);
    const hideTimePicker = () => setTimePickerVisible(false);

    const handleConfirmDate = (pickedDate) => {
        setDate(pickedDate.toISOString().split("T")[0]); // YYYY-MM-DD
        hideDatePicker();
    };

    const handleConfirmTime = (pickedTime) => {
        const formatted = pickedTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
        setTime(formatted);
        hideTimePicker();
    };

    async function confirmBooking() {
        if (!user) return Alert.alert("Please sign in first");
        if (!date || !time) return Alert.alert("Please select date and time");

        try {
            await fetch("https://flamingo-ctga.onrender.com/book", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerId: user.uid,
                    customerName: user.displayName || user.email.split("@")[0],
                    customerEmail: user.email,
                    appointmentDate: date,
                    appointmentTime: time,
                    serviceType: service.name,
                }),
            });

            Alert.alert(
                "Booking Confirmed 💅",
                `${service.name}\n${date} at ${time}`
            );
            navigation.popToTop();
        } catch (e) {
            Alert.alert("Error", e.message);
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Book {service.name}</Text>

            <TouchableOpacity style={styles.selectBtn} onPress={showDatePicker}>
                <Text style={styles.btnText}>
                    {date ? `📅 ${date}` : "Select Date"}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.selectBtn} onPress={showTimePicker}>
                <Text style={styles.btnText}>
                    {time ? `⏰ ${time}` : "Select Time"}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmBtn} onPress={confirmBooking}>
                <Text style={styles.confirmText}>Confirm Booking 💖</Text>
            </TouchableOpacity>

            {/* Date Picker */}
            <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                onConfirm={handleConfirmDate}
                onCancel={hideDatePicker}
            />

            {/* Time Picker */}
            <DateTimePickerModal
                isVisible={isTimePickerVisible}
                mode="time"
                onConfirm={handleConfirmTime}
                onCancel={hideTimePicker}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFF5F8",
        padding: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    header: {
        fontSize: 24,
        fontWeight: "700",
        color: "#D63384",
        marginBottom: 30,
        textAlign: "center",
    },
    selectBtn: {
        width: "85%",
        backgroundColor: "#FFC0CB",
        paddingVertical: 14,
        borderRadius: 25,
        alignItems: "center",
        marginVertical: 8,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    btnText: {
        fontSize: 16,
        color: "#fff",
        fontWeight: "600",
    },
    confirmBtn: {
        marginTop: 30,
        backgroundColor: "#FF69B4",
        paddingVertical: 15,
        width: "85%",
        borderRadius: 25,
        alignItems: "center",
    },
    confirmText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
    },
});

// ------------------ MY BOOKINGS ------------------
function MyBookingsScreen() {
    const [bookings, setBookings] = useState([]);
    const user = auth.currentUser;

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "bookings"),
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
                        <Text>{item.serviceName}</Text>
                        <Text>{item.date} {item.time}</Text>
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
