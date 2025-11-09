// App.js — Flamingo Nails Expo React Native prototype
import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, Button, FlatList, TouchableOpacity, Alert, Image, StyleSheet, SafeAreaView,
    ScrollView, ActivityIndicator
} from 'react-native';
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
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Tab, Tabs, TabScreen } from "react-native-paper-tabs";
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { useWindowDimensions } from 'react-native';
import { Provider as PaperProvider, Card } from 'react-native-paper';
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import * as Google from "expo-auth-session/providers/google";

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
  const [phone, setPhone] = useState("");
  const [googleResponse, setGoogleResponse] = useState(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: "<YOUR_EXPO_CLIENT_ID>",
    iosClientId: "<YOUR_IOS_CLIENT_ID>",
    androidClientId: "<YOUR_ANDROID_CLIENT_ID>",
  });

  // Handle Google response
  useEffect(() => {
    if (response?.type === "success") {
      setGoogleResponse(response); // Save response to use after phone is entered
    }
  }, [response]);

  const handleSignUp = async () => {
    if (!phone) return Alert.alert("Phone number is required");

    if (!googleResponse) return Alert.alert("Please sign in with Google first");

    try {
      const { id_token } = googleResponse.params;
      const credential = GoogleAuthProvider.credential(id_token);

      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;

      // Send user info to backend (Firestore)
      await fetch("https://flamingo-ctga.onrender.com/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          phone: phone,
        }),
      });

      Alert.alert("✅ Signed up successfully!");
    } catch (e) {
      Alert.alert("Sign-up error", e.message);
    }
  };

  return (
    <View style={{ padding: 20, flex: 1, justifyContent: "center" }}>
      <Text style={{ fontSize: 24, marginBottom: 10 }}>Sign Up</Text>

      {/* Phone Number Input */}
      <TextInput
        placeholder="Phone Number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        style={{ borderWidth: 1, padding: 8, marginBottom: 20 }}
      />

      {/* Google Sign-In Button */}
      <Button
        title="Sign In with Google"
        disabled={!request}
        onPress={() => promptAsync()}
      />

      <View style={{ height: 20 }} />

      {/* Complete Sign-Up */}
      <Button title="Complete Sign-Up" onPress={handleSignUp} />
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
    const user = auth.currentUser;

    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [isDatePickerVisible, setDatePickerVisible] = useState(false);
    const [isTimePickerVisible, setTimePickerVisible] = useState(false);

    const showDatePicker = () => setDatePickerVisible(true);
    const hideDatePicker = () => setDatePickerVisible(false);
    const showTimePicker = () => setTimePickerVisible(true);
    const hideTimePicker = () => setTimePickerVisible(false);

    const handleConfirmDate = (pickedDate) => {
        setDate(pickedDate.toISOString().split("T")[0]);
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
        if (!user) return Alert.alert("Please sign in first 💅");
        if (!date || !time) return Alert.alert("Please select both date and time");

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

            Alert.alert("Booking Confirmed 💖", `${service.name}\n${date} at ${time}`);
            navigation.popToTop();
        } catch (e) {
            Alert.alert("Error", e.message);
        }
    }

    return (
        <View style={styles.container}>
            <Image source={require("./assets/logo.png")} style={styles.logo} />

            <Text style={styles.title}>Book {service.name}</Text>
            <Text style={styles.subtitle}>💅 Choose your perfect time slot</Text>

            {/* Choose Date */}
            <TouchableOpacity onPress={showDatePicker} activeOpacity={0.85}>
                <LinearGradient
                    colors={["#FF80B5", "#FF1493"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.optionBtn}
                >
                    <Text style={styles.optionText}>
                        📅 {date ? date : "Choose Date"}
                    </Text>
                </LinearGradient>
            </TouchableOpacity>

            {/* Choose Time */}
            <TouchableOpacity onPress={showTimePicker} activeOpacity={0.85}>
                <LinearGradient
                    colors={["#FF80B5", "#FF1493"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.optionBtn}
                >
                    <Text style={styles.optionText}>
                        ⏰ {time ? time : "Choose Time"}
                    </Text>
                </LinearGradient>
            </TouchableOpacity>

            {/* Confirm Booking */}
            <TouchableOpacity onPress={confirmBooking} activeOpacity={0.85}>
                <LinearGradient
                    colors={["#FF80B5", "#FF1493"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.confirmBtn}
                >
                    <Text style={styles.confirmText}>💖 Confirm Booking</Text>
                </LinearGradient>
            </TouchableOpacity>

            {/* Date & Time Pickers */}
            <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                onConfirm={handleConfirmDate}
                onCancel={hideDatePicker}
            />
            <DateTimePickerModal
                isVisible={isTimePickerVisible}
                mode="time"
                onConfirm={handleConfirmTime}
                onCancel={hideTimePicker}
            />
        </View>
    );
}

const styles1 = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFE6F0",
        alignItems: "center",
        paddingTop: 40,
    },
    logo: {
        width: 110,
        height: 110,
        borderRadius: 20,
        marginBottom: 10,
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
        color: "#C2185B",
    },
    subtitle: {
        fontSize: 15,
        color: "#555",
        marginBottom: 30,
    },
    optionBtn: {
        width: 260,
        borderRadius: 30,
        paddingVertical: 12,
        alignItems: "center",
        marginVertical: 10,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 5,
        elevation: 3,
    },
    optionText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
    confirmBtn: {
        marginTop: 20,
        width: 260,
        paddingVertical: 14,
        borderRadius: 35,
        alignItems: "center",
        elevation: 5,
    },
    confirmText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },
    summary: {
        marginTop: 30,
        alignItems: "center",
        backgroundColor: "#fff",
        padding: 15,
        borderRadius: 20,
        width: "85%",
        elevation: 4,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#C2185B",
        marginBottom: 8,
    },
    summaryItem: {
        fontSize: 14,
        color: "#333",
    },
});

// ------------------ MY BOOKINGS ------------------
function MyBookingsScreen() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = auth.currentUser;

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "bookings"),
            where("customerEmail", "==", user.email)
        );

        const unsub = onSnapshot(q, (snap) => {
            const arr = snap.docs.map((d) => {
                const data = d.data();
                return {
                    id: d.id,
                    serviceName: data.serviceType,
                    date: data.appointmentDate,
                    time: data.appointmentTime,
                    status: data.status || "pending",
                };
            });
            setBookings(arr);
            setLoading(false);
        });

        return unsub;
    }, [user]);

    const getStatusColor = (status) => {
        switch (status) {
            case "confirmed":
                return ["#4ade80", "#22c55e"];
            case "rebook-suggested":
                return ["#facc15", "#eab308"];
            default:
                return ["#f87171", "#ef4444"];
        }
    };

    const renderBooking = ({ item }) => (
        <LinearGradient
            colors={["#fff", "#fdf2f8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
        >
            <View style={styles.cardHeader}>
                <MaterialIcons name="spa" size={26} color="#ec4899" />
                <Text style={styles.service}>{item.serviceName}</Text>
            </View>

            <View style={styles.detailRow}>
                <MaterialIcons name="calendar-today" size={20} color="#555" />
                <Text style={styles.detailText}>{item.date}</Text>
            </View>

            <View style={styles.detailRow}>
                <MaterialIcons name="access-time" size={20} color="#555" />
                <Text style={styles.detailText}>{item.time}</Text>
            </View>

            <LinearGradient
                colors={getStatusColor(item.status)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statusBadge}
            >
                <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
            </LinearGradient>
        </LinearGradient>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={["#FF80B5", "#FF1493"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>My Bookings 💅</Text>
            </LinearGradient>

            {loading ? (
                <ActivityIndicator size="large" color="#FF1493" style={{ marginTop: 50 }} />
            ) : bookings.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <MaterialIcons name="event-busy" size={45} color="#bbb" />
                    <Text style={styles.emptyText}>No bookings yet</Text>
                </View>
            ) : (
                <FlatList
                    data={bookings}
                    keyExtractor={(i) => i.id}
                    renderItem={renderBooking}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </View>
    );
}

const styles2 = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#ffe4ec",
    },
    header: {
        paddingVertical: 18,
        alignItems: "center",
        justifyContent: "center",
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        elevation: 4,
    },
    headerTitle: {
        color: "#fff",
        fontSize: 22,
        fontWeight: "bold",
    },
    listContent: {
        paddingVertical: 20,
    },
    card: {
        marginHorizontal: 16,
        marginBottom: 15,
        borderRadius: 18,
        padding: 18,
        elevation: 3,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 6,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    service: {
        fontSize: 18,
        fontWeight: "600",
        marginLeft: 8,
        color: "#c2185b",
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 3,
    },
    detailText: {
        marginLeft: 8,
        fontSize: 16,
        color: "#444",
    },
    statusBadge: {
        alignSelf: "flex-start",
        marginTop: 10,
        paddingVertical: 4,
        paddingHorizontal: 14,
        borderRadius: 12,
    },
    statusText: {
        color: "#fff",
        fontSize: 13,
        fontWeight: "bold",
    },
    emptyContainer: {
        alignItems: "center",
        marginTop: 60,
    },
    emptyText: {
        fontSize: 16,
        color: "#888",
        marginTop: 10,
    },
});

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
