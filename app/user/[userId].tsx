import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, ActivityIndicator, TouchableOpacity, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, collection, query, where, getDocs, orderBy, DocumentData } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// --- Type Definitions ---
interface UserProfile extends DocumentData {
    displayName: string;
    photoURL?: string;
    createdAt: any;
}

interface Ad extends DocumentData {
    id: string;
    title: string;
    price: number;
    imageUrls: string[];
}

// --- Main Component ---
export default function UserProfileScreen() {
    const { userId } = useLocalSearchParams<{ userId: string }>();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];

    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [userAds, setUserAds] = useState<Ad[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch user profile data
                const userDocRef = doc(db, 'users', userId);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    setUserProfile(userDocSnap.data() as UserProfile);
                }

                // Fetch user ads
                const adsRef = collection(db, 'ads');
                const q = query(adsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                const adsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ad));
                setUserAds(adsData);

            } catch (error) {
                console.error("Error fetching user data: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userId]);
    
    const renderAdCard = ({ item }: { item: Ad }) => (
        <TouchableOpacity style={[styles.adCard, { backgroundColor: themeColors.background }]} onPress={() => router.push(`/ad/${item.id}`)}>
            <Image source={{ uri: item.imageUrls[0] }} style={styles.adImage} />
            <View style={styles.adCardContent}>
                <Text style={[styles.adTitle, { color: themeColors.text }]} numberOfLines={2}>{item.title}</Text>
                <Text style={[styles.adPrice, { color: themeColors.primary }]}>₪{item.price.toLocaleString()}</Text>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color={themeColors.primary} /></View>;
    }

    if (!userProfile) {
        return <View style={styles.centered}><Text style={{color: themeColors.text}}>User not found.</Text></View>;
    }

    return (
        <FlatList
            ListHeaderComponent={
                <View style={[styles.headerContainer, { backgroundColor: themeColors.background }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={themeColors.text} />
                    </TouchableOpacity>
                    <Image
                        source={userProfile.photoURL ? { uri: userProfile.photoURL } : require('@/assets/images/avatar.png')}
                        style={styles.avatar}
                    />
                    <Text style={[styles.userName, { color: themeColors.text }]}>{userProfile.displayName}</Text>
                    <Text style={[styles.memberSince, { color: themeColors.icon }]}>
                        Member since {new Date(userProfile.createdAt?.toDate()).getFullYear()}
                    </Text>
                    <View style={styles.separator} />
                    <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Ads by {userProfile.displayName}</Text>
                </View>
            }
            data={userAds}
            renderItem={renderAdCard}
            keyExtractor={item => item.id}
            numColumns={2}
            contentContainerStyle={styles.adsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
                 <View style={styles.centered}>
                    <Text style={{color: themeColors.text}}>This user has no active ads.</Text>
                </View>
            }
        />
    );
}

// --- Styles ---
const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 50,
    },
    headerContainer: {
        alignItems: 'center',
        paddingVertical: 30,
        paddingHorizontal: 20,
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: '#4285F4',
        marginBottom: 15,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    memberSince: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    separator: {
        height: 1,
        backgroundColor: '#EEE',
        width: '100%',
        marginVertical: 10,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        alignSelf: 'flex-start'
    },
    adsList: {
        paddingHorizontal: 10,
    },
    adCard: {
        width: '48%',
        margin: '1%',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
        overflow: 'hidden',
    },
    adImage: {
        height: 120,
        width: '100%',
    },
    adCardContent: {
        padding: 10,
    },
    adTitle: {
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 4,
        height: 36,
    },
    adPrice: {
        fontWeight: 'bold',
        fontSize: 16,
    },
});
