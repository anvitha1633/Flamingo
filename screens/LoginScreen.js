import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';  // ensure path is correct

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    async function handleLogin() {
        const trimmedEmail = email.trim();
        if (!trimmedEmail || !password) {
            Alert.alert('Missing Details', 'Please enter both your email and password.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return;
        }

        try {
            // 🔥 Firebase Sign-In
            await signInWithEmailAndPassword(auth, trimmedEmail, password);
            Alert.alert('Welcome Back! 🎉', 'You have signed in successfully.', [
                {
                    text: 'Continue',
                    onPress: () => navigation.navigate('Home'),
                },
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Login Error', error.message);
        }
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#fff", padding: 20 }}>
            <Text style={{ fontSize: 22, marginBottom: 20 }}>Sign In</Text>

            <TextInput
                placeholder="Email *"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
            />
            <TextInput
                placeholder="Password *"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
            />

            <Button title="Login" onPress={handleLogin} />

            <Text
                style={{ marginTop: 15, color: 'blue', textAlign: 'center' }}
                onPress={() => navigation.navigate('Signup')}
            >
                Don’t have an account? Sign up
            </Text>
        </View>
    );
}
