import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig'; // ✅ import Firestore and Auth

export default function SignupScreen({ navigation }) {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [service, setService] = useState('');

    async function handleSignup() {
        if (!email || !password || !name) {
            Alert.alert('Missing Info', 'Please fill in all required fields.');
            return;
        }

        try {
            // 🔥 1️⃣ Create user in Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 🔥 2️⃣ Save extra details to Firestore
            await setDoc(doc(db, 'users', user.uid), {
                name,
                email,
                service,
                createdAt: new Date().toISOString(),
            });

            Alert.alert('Signup successful!', 'Welcome to Flamingo Salon 💅');
            navigation.navigate('Home');
        } catch (error) {
            console.error('Signup Error:', error);
            Alert.alert('Error', error.message);
        }
    }

    return (
        <View style={{ padding: 20 }}>
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
                style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
            />
            <TextInput
                placeholder="Preferred Service (e.g. Nails, Lashes)"
                value={service}
                onChangeText={setService}
                style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
            />
            <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
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
