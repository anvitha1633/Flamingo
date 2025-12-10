import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';

export default function SignupScreen({ navigation }) {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [service, setService] = useState('');

    async function handleSignup() {
        if (!email || !password || !name || !phone) {
            Alert.alert('Missing Info', 'Please fill in all required fields.');
            return;
        }

        try {
            // 1️⃣ Create auth user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            console.log("🔥 FRONTEND Sending:", {
                uid: user.uid,
                name,
                phone,
                email,
                service,
                role: "customer"
            });

            // 2️⃣ SEND TO BACKEND
            const response = await fetch("https://flamingo-ctga.onrender.com/create-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    uid: user.uid,
                    name,
                    phone,
                    email,
                    service: service || null,
                    role: "customer"
                }),
            });

            const data = await response.json();
            console.log("🔥 BACKEND RESPONSE:", data);

            if (!data.success) {
                throw new Error(data.error || "Unknown backend error");
            }

            Alert.alert('Signup successful!', 'Welcome to Flamingo Salon 💅');
            navigation.navigate('Home');

        } catch (error) {
            console.error('Signup Error:', error);
            Alert.alert('Error', error.message);
        }
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#fff", padding: 20 }}>
            <Text style={{ fontSize: 22, marginBottom: 20 }}>Create Account</Text>

            <TextInput
                placeholder="Full Name"
                value={name}
                onChangeText={setName}
                style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
            />
            <TextInput
                placeholder="Phone Number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
            />
            <TextInput
                placeholder="Preferred Service (optional)"
                value={service}
                onChangeText={setService}
                style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
            />
            <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
            />
            <TextInput
                placeholder="Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
            />

            <Button title="Sign Up" onPress={handleSignup} />

            <Text
                style={{ marginTop: 15, color: 'blue', textAlign: 'center' }}
                onPress={() => navigation.navigate('Login')}
            >
                Already have an account? Log in
            </Text>
        </View>
    );
}
