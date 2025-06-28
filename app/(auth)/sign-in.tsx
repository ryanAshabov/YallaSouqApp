import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseAuth } from '@/firebaseConfig';

export default function SignInScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignIn = async () => {
        if (!email || !password) {
            Alert.alert('Missing Fields', 'Please enter both email and password.');
            return;
        }

        setLoading(true);
        try {
            await signInWithEmailAndPassword(firebaseAuth, email, password);
            // On successful sign-in, the AuthProvider will detect the change
            // and the user will be redirected automatically or the UI will update.
            // We can explicitly navigate back or to the home screen.
            router.back();
        } catch (error: any) {
            // Provide more user-friendly error messages
            let errorMessage = 'An error occurred during sign-in.';
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                errorMessage = 'Invalid email or password. Please try again.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Please enter a valid email address.';
            }
            Alert.alert('Sign In Failed', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="close" size={30} color="#333" />
            </TouchableOpacity>

            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
            
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

            <TouchableOpacity style={styles.signInButton} onPress={handleSignIn} disabled={loading}>
                <Text style={styles.signInButtonText}>{loading ? 'Signing In...' : 'Sign In'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.replace('/auth/sign-up')}>
                <Text style={styles.switchText}>Don't have an account? <Text style={styles.switchLink}>Sign Up</Text></Text>
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
    signInButton: {
        backgroundColor: '#4285F4',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    signInButtonText: {
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
