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
        const trimmedName = name.trim();
        const trimmedPhone = phone.trim();
        const trimmedService = service.trim();
        const trimmedEmail = email.trim();

        // 1. Mandatory check for all fields
        if (!trimmedName || !trimmedPhone || !trimmedService || !trimmedEmail || !password) {
            Alert.alert('All Fields Mandatory', 'Please fill in all the details in the form.');
            return;
        }

        // 2. Name validation
        if (trimmedName.length < 2) {
            Alert.alert('Invalid Name', 'Please enter your full name (at least 2 characters).');
            return;
        }

        // 3. Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return;
        }

        // 4. Phone validation
        const cleanPhone = trimmedPhone.replace(/[\s\-\(\)]/g, '');
        const phoneRegex = /^[0-9]{10,15}$/;
        if (!phoneRegex.test(cleanPhone)) {
            Alert.alert('Invalid Phone Number', 'Please enter a valid phone number (10 to 15 digits).');
            return;
        }

        // 5. Password validation
        if (password.length < 6) {
            Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
            return;
        }

        try {
            // 🔥 1️⃣ Create user in Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
            const user = userCredential.user;

            // 🔥 2️⃣ Save extra details to Firestore
            await setDoc(doc(db, 'users', user.uid), {
                name: trimmedName,
                phone: trimmedPhone,
                email: trimmedEmail.toLowerCase(),
                service: trimmedService,
                createdAt: new Date().toISOString(),
            });

            Alert.alert('Signup Successful! 🎉', 'Welcome to Flamingo Salon 💅', [
                {
                    text: 'Continue',
                    onPress: () => navigation.navigate('Home'),
                },
            ]);
        } catch (error) {
            console.error('Signup Error:', error);
            Alert.alert('Error', error.message);
        }
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#fff", padding: 20 }}>
            <Text style={{ fontSize: 22, marginBottom: 20 }}>Create Account</Text>

            <TextInput
                placeholder="Full Name *"
                value={name}
                onChangeText={setName}
                style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
            />
            <TextInput
                placeholder="Phone Number (10 digits) *"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
            />
            <TextInput
                placeholder="Preferred Service (e.g. Nails, Lashes) *"
                value={service}
                onChangeText={setService}
                style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
            />
            <TextInput
                placeholder="Email *"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
            />
            <TextInput
                placeholder="Password (min. 6 chars) *"
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
