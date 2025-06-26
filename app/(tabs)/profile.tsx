import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/firebaseConfig';
import { signOut } from 'firebase/auth';

export default function ProfileScreen() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Error signing out: ', error);
        }
    };

    if (isLoading) {
        return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerText}>Profile</Text>
            </View>

            {user ? (
                <View style={styles.loggedInContainer}>
                    <View style={styles.userInfoSection}>
                        <Ionicons name="person-circle-outline" size={80} color="#CCC" />
                        <Text style={styles.userEmail}>{user.email}</Text>
                    </View>
                    
                    <TouchableOpacity style={styles.manageAdsButton} onPress={() => router.push('/my-ads')}>
                        <Ionicons name="list-outline" size={24} color="#fff" />
                        <Text style={styles.manageAdsButtonText}>Manage My Ads</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                        <Ionicons name="log-out-outline" size={22} color="#D32F2F" />
                        <Text style={styles.signOutButtonText}>Sign Out</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.loggedOutContainer}>
                    <View style={styles.authContainer}>
                        <TouchableOpacity style={styles.signInButton} onPress={() => router.push('/(auth)/sign-in')}>
                            <Text style={styles.signInButtonText}>Sign In to Your Account</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.createAccountButton} onPress={() => router.push('/(auth)/sign-up')}>
                            <Text style={styles.createAccountButtonText}>Create New Account</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Yalla Souq <Text style={styles.betaTag}>BETA</Text></Text>
                    </View>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7F7F7' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EEE' },
    headerText: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
    loggedInContainer: { alignItems: 'center', padding: 20 },
    userInfoSection: { alignItems: 'center', marginBottom: 30 },
    userEmail: { fontSize: 18, fontWeight: '600', marginTop: 10 },
    manageAdsButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4285F4', padding: 15, borderRadius: 10, width: '100%', marginBottom: 15 },
    manageAdsButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
    signOutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEE', padding: 12, borderRadius: 10, width: '100%', borderWidth: 1, borderColor: '#FCC' },
    signOutButtonText: { color: '#D32F2F', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
    loggedOutContainer: {},
    authContainer: { padding: 20 },
    signInButton: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 15 },
    signInButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    createAccountButton: { backgroundColor: '#fff', padding: 15, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#4285F4' },
    createAccountButtonText: { color: '#4285F4', fontSize: 18, fontWeight: 'bold' },
    footer: { marginTop: 30, alignItems: 'center', paddingHorizontal: 20, paddingBottom: 40 },
    footerText: { fontSize: 16, fontWeight: 'bold' },
    betaTag: { backgroundColor: '#FFC107', color: '#000', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden', fontSize: 12, fontWeight: 'bold' },
});
