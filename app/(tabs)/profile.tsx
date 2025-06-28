import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { firebaseAuth } from '@/firebaseConfig';
import { signOut } from 'firebase/auth';

export default function ProfileScreen() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        try {
            await signOut(firebaseAuth);
        } catch (error) {
            console.error('Error signing out: ', error);
        }
    };
    
    const memberSince = user?.metadata.creationTime ? new Date(user.metadata.creationTime).getFullYear() : '';

    if (isLoading) {
        return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
    }

    return (
        <View style={{flex: 1, backgroundColor: '#F7F7F7'}}>
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerText}>Profile</Text>
            </View>

            {user ? (
                <View style={styles.loggedInContainer}>
                    <View style={styles.userInfoSection}>
                        <Image 
                            source={user.photoURL ? { uri: user.photoURL } : require('../../assets/images/icon.png')} 
                            style={styles.avatar}
                        />
                        <Text style={styles.userName}>{user.displayName || 'No name set'}</Text>
                        <Text style={styles.userEmail}>{user.email}</Text>
                        <Text style={styles.memberSince}>Member since {memberSince}</Text>
                    </View>

                    <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/profile-edit')}>
                        <Ionicons name="create-outline" size={22} color="#444" />
                        <Text style={styles.profileButtonText}>Edit Profile</Text>
                         <Ionicons name="chevron-forward" size={22} color="#CCC" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/my-ads')}>
                        <Ionicons name="list-outline" size={22} color="#444" />
                        <Text style={styles.profileButtonText}>Manage My Ads</Text>
                         <Ionicons name="chevron-forward" size={22} color="#CCC" />
                    </TouchableOpacity>

                     <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Settings</Text>
                        <TouchableOpacity style={styles.profileButton}>
                            <Ionicons name="notifications-outline" size={22} color="#444" />
                            <Text style={styles.profileButtonText}>Notifications</Text>
                            <Ionicons name="chevron-forward" size={22} color="#CCC" />
                        </TouchableOpacity>
                    </View>
                    
                     <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Help</Text>
                         <TouchableOpacity style={styles.profileButton}>
                            <Ionicons name="help-circle-outline" size={22} color="#444" />
                            <Text style={styles.profileButtonText}>Help & Support</Text>
                            <Ionicons name="chevron-forward" size={22} color="#CCC" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.profileButton}>
                            <Ionicons name="document-text-outline" size={22} color="#444" />
                            <Text style={styles.profileButtonText}>Terms & Privacy</Text>
                            <Ionicons name="chevron-forward" size={22} color="#CCC" />
                        </TouchableOpacity>
                    </View>
                    
                    <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                        <Ionicons name="log-out-outline" size={22} color="#D32F2F" />
                        <Text style={styles.signOutButtonText}>Sign Out</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.loggedOutContainer}>
                    <View style={styles.authContainer}>
                        <Ionicons name="person-circle-outline" size={100} color="#E0E0E0" />
                        <Text style={styles.loggedOutTitle}>Your Profile</Text>
                        <Text style={styles.loggedOutSubtitle}>Sign in to manage your ads and view your profile.</Text>
                        <TouchableOpacity style={styles.signInButton} onPress={() => router.push('/auth/sign-in')}>
                            <Text style={styles.signInButtonText}>Sign In</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.createAccountButton} onPress={() => router.push('/auth/sign-up')}>
                            <Text style={styles.createAccountButtonText}>Create New Account</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Yalla Souq <Text style={styles.betaTag}>BETA</Text></Text>
                    </View>
                </View>
            )}
        </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        backgroundColor: '#F7F7F7',
        paddingBottom: 40,
    },
    centered: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    header: { 
        paddingTop: 60, 
        paddingBottom: 20, 
        paddingHorizontal: 20, 
        backgroundColor: '#fff', 
        borderBottomWidth: 1, 
        borderBottomColor: '#EEE' 
    },
    headerText: { 
        fontSize: 24, 
        fontWeight: 'bold', 
        textAlign: 'center' 
    },
    loggedInContainer: { 
        alignItems: 'center', 
        paddingVertical: 20 
    },
    userInfoSection: { 
        alignItems: 'center', 
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 15,
        backgroundColor: '#E0E0E0',
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    userEmail: { 
        fontSize: 16, 
        color: '#666',
        marginTop: 4,
    },
    memberSince: {
        fontSize: 14,
        color: '#999',
        marginTop: 6,
    },
    section: {
        width: '100%',
        marginTop: 20,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#999',
        marginLeft: 10,
        marginBottom: 10,
    },
    profileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 10,
        width: '90%',
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    profileButtonText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 15,
    },
    signOutButton: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: '#fff', 
        padding: 15, 
        borderRadius: 10, 
        width: '90%', 
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#FFE0E0'
    },
    signOutButtonText: { 
        color: '#D32F2F', 
        fontSize: 16, 
        fontWeight: 'bold', 
        marginLeft: 10 
    },
    loggedOutContainer: {
        paddingTop: 40,
    },
    authContainer: { 
        padding: 20,
        alignItems: 'center',
    },
    loggedOutTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
    },
    loggedOutSubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
    },
    signInButton: { 
        backgroundColor: '#4285F4', 
        padding: 15, 
        borderRadius: 10, 
        alignItems: 'center', 
        marginBottom: 15,
        width: '100%',
    },
    signInButtonText: { 
        color: '#fff', 
        fontSize: 18, 
        fontWeight: 'bold' 
    },
    createAccountButton: { 
        backgroundColor: '#fff', 
        padding: 15, 
        borderRadius: 10, 
        alignItems: 'center', 
        borderWidth: 1, 
        borderColor: '#4285F4',
        width: '100%',
    },
    createAccountButtonText: { 
        color: '#4285F4', 
        fontSize: 18, 
        fontWeight: 'bold' 
    },
    footer: { 
        marginTop: 30, 
        alignItems: 'center', 
        paddingHorizontal: 20, 
        paddingBottom: 40 
    },
    footerText: { 
        fontSize: 16, 
        fontWeight: 'bold' 
    },
    betaTag: { 
        backgroundColor: '#FFC107', 
        color: '#000', 
        paddingHorizontal: 6, 
        paddingVertical: 2, 
        borderRadius: 4, 
        overflow: 'hidden', 
        fontSize: 12, 
        fontWeight: 'bold' 
    },
});
