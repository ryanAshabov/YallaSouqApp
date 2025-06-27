import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, ActivityIndicator, TouchableOpacity, Linking, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, DocumentData, Timestamp, limit } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import Swiper from 'react-native-swiper';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// --- Type Definitions ---
interface Ad extends DocumentData {
    id: string;
    userId: string;
    title: string;
    price: number;
    imageUrls: string[];
    category: string;
    subcategory: string;
    location?: string;
    description: string;
    createdAt: Timestamp;
}

interface Seller extends DocumentData {
    displayName?: string;
    email: string;
    photoURL?: string;
    phoneNumber?: string;
    createdAt?: Timestamp;
}

// --- Main Component ---
export default function AdDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { user, favorites, addToFavorites, removeFromFavorites } = useAuth();
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];

    // --- State Management ---
    const [ad, setAd] = useState<Ad | null>(null);
    const [seller, setSeller] = useState<Seller | null>(null);
    const [similarAds, setSimilarAds] = useState<Ad[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);

    const isMyAd = user && ad ? user.uid === ad.userId : false;
    const isFavorited = ad ? favorites.includes(ad.id) : false;

    // --- Data Fetching ---
    useEffect(() => {
        const fetchAdData = async () => {
            if (!id) return;
            setLoading(true);
            setAd(null);
            setSimilarAds([]);

            try {
                const adDocRef = doc(db, 'ads', id);
                const adDocSnap = await getDoc(adDocRef);

                if (adDocSnap.exists()) {
                    const adData = { id: adDocSnap.id, ...adDocSnap.data() } as Ad;
                    setAd(adData);

                    const sellerDocRef = doc(db, 'users', adData.userId);
                    const sellerDocSnap = await getDoc(sellerDocRef);
                    if (sellerDocSnap.exists()) {
                        setSeller(sellerDocSnap.data() as Seller);
                    }

                    const adsRef = collection(db, 'ads');
                    const similarAdsQuery = query(
                        adsRef,
                        where('subcategory', '==', adData.subcategory),
                        where('id', '!=', id),
                        limit(6)
                    );
                    const similarAdsSnapshot = await getDocs(similarAdsQuery);
                    const fetchedSimilarAds = similarAdsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ad));
                    setSimilarAds(fetchedSimilarAds);
                }
            } catch (error) {
                console.error("Error fetching ad details: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAdData();
    }, [id]);

    const handleViewProfile = () => {
        if (ad?.userId) {
            router.push(`/user/${ad.userId}`);
        }
    };

    if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={themeColors.primary} /></View>;
    if (!ad) return <View style={styles.centered}><Text style={{ color: themeColors.text }}>Ad not found.</Text></View>;

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            <ScrollView>
                {/* Swiper and Header Buttons here */}
                
                <View style={styles.detailsContainer}>
                    {/* Ad details like title, price etc. */}
                    <View style={styles.separator} />
                    <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Seller Information</Text>
                    <TouchableOpacity onPress={handleViewProfile} disabled={isMyAd}>
                        <View style={[styles.sellerContainer, { backgroundColor: themeColors.background, borderColor: themeColors.primary, borderWidth: isMyAd ? 0 : 1 }]}>
                            <Image source={seller?.photoURL ? { uri: seller.photoURL } : require('@/assets/images/avatar.png')} style={styles.sellerAvatar} />
                            <View style={styles.sellerInfo}>
                                <Text style={[styles.sellerName, { color: themeColors.text }]}>{seller?.displayName || 'Seller'}</Text>
                                <Text style={{ color: themeColors.icon }}>Member since {seller?.createdAt ? new Date(seller.createdAt.toDate()).getFullYear() : 'N/A'}</Text>
                            </View>
                            {!isMyAd && <Ionicons name="chevron-forward" size={24} color={themeColors.primary} />}
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Similar Ads Section */}
                {similarAds.length > 0 && (
                    <View style={styles.similarAdsSection}>
                        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Similar Ads</Text>
                        {/* ScrollView for similar ads here */}
                    </View>
                )}
            </ScrollView>
            {/* Contact Bar here */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    detailsContainer: { padding: 20 },
    separator: { height: 1, backgroundColor: '#EEE', marginVertical: 20 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
    sellerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 10,
    },
    sellerAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 15,
    },
    sellerInfo: {
        flex: 1,
    },
    sellerName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    similarAdsSection: {
        marginTop: 20,
        paddingLeft: 20,
    },
    // ... other styles
});
