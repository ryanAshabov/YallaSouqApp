import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseAuth, db } from '@/firebaseConfig';

export default function SignUpScreen() {
    const router = useRouter();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignUp = async () => {
        if (!fullName || !email || !password || !confirmPassword) {
            Alert.alert('Missing Fields', 'Please fill in all fields.');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Password Mismatch', 'The passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            // 1. Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
            const user = userCredential.user;

            // 2. Update the user's profile with their full name
            await updateProfile(user, {
                displayName: fullName,
            });

            // 3. Create a corresponding document in the 'users' collection in Firestore
            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, {
                displayName: fullName,
                email: email,
                createdAt: serverTimestamp(),
                favorites: [],
                // pushToken will be added by the AuthProvider later
            });

            // Manually trigger a reload of the user to ensure the latest data (incl. displayName) is available
            await user.reload();
            
            // On successful sign-up, navigate to the profile tab
            router.replace('/(tabs)/profile');

        } catch (error: any) {
            let errorMessage = 'An error occurred during sign-up.';
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'This email address is already in use.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Please enter a valid email address.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'The password must be at least 6 characters long.';
            }
            Alert.alert('Sign Up Failed', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="close" size={30} color="#333" />
            </TouchableOpacity>

            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join our community</Text>
            
            <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
            />
            <TextInput
                style={styles.input}
                placeholder="Email Address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
            />

            <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.signUpButtonText}>Create Account</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.replace('/auth/sign-in')}>
                <Text style={styles.switchText}>Already have an account? <Text style={styles.switchLink}>Sign In</Text></Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 25,
        backgroundColor: '#fff',
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    subtitle: {
        fontSize: 18,
        color: '#666',
        marginBottom: 40,
    },
    input: {
        backgroundColor: '#F7F7F7',
        borderRadius: 10,
        padding: 18,
        fontSize: 16,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    signUpButton: {
        backgroundColor: '#4285F4',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    signUpButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    switchText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: '#666',
    },
    switchLink: {
        color: '#4285F4',
        fontWeight: 'bold',
    },
});
