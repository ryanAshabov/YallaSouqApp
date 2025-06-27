import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, ActivityIndicator, TouchableOpacity, Linking, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, DocumentData, Timestamp } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import Swiper from 'react-native-swiper';

// Define types for better type safety
interface Ad extends DocumentData {
    id: string;
    userId: string;
    title: string;
    price: number;
    imageUrls: string[];
    category: string;
    location?: string;
    description: string;
    createdAt: Timestamp;
}

interface Seller extends DocumentData {
    displayName?: string;
    email: string;
    photoURL?: string;
    phoneNumber?: string;
    createdAt: Timestamp;
}

interface ChatDocumentData {
    adTitle: string;
    participants: string[];
}

interface Chat extends ChatDocumentData {
    id: string;
}

export default function AdDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { user, favorites, addToFavorites, removeFromFavorites } = useAuth();

    const [ad, setAd] = useState<Ad | null>(null);
    const [seller, setSeller] = useState<Seller | null>(null);
    const [loading, setLoading] = useState(true);
    
    const isMyAd = user && ad ? user.uid === ad.userId : false;
    const isFavorited = ad ? favorites.includes(ad.id) : false;
    const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);

    useEffect(() => {
        const fetchAdAndSeller = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const adDocRef = doc(db, 'ads', id);
                const adDocSnap = await getDoc(adDocRef);

                if (adDocSnap.exists()) {
                    const adData = { id: adDocSnap.id, ...adDocSnap.data() } as Ad;
                    setAd(adData);

                    if (adData.userId) {
                        const sellerDocRef = doc(db, 'users', adData.userId);
                        const sellerDocSnap = await getDoc(sellerDocRef);
                        if (sellerDocSnap.exists()) {
                            setSeller(sellerDocSnap.data() as Seller);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching ad details: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAdAndSeller();
    }, [id]);

    const handleToggleFavorite = async () => {
        if (!user || !ad) {
             Alert.alert("Login Required", "Please sign in to save favorites.", [
                { text: "Cancel" },
                { text: "Sign In", onPress: () => router.push('/(auth)/sign-in') }
            ]);
            return;
        }
        setIsFavoriteLoading(true);
        try {
            if (isFavorited) {
                await removeFromFavorites(ad.id);
            } else {
                await addToFavorites(ad.id);
            }
        } catch (error) {
            console.error("Error toggling favorite: ", error);
        } finally {
            setIsFavoriteLoading(false);
        }
    };
    
    const handleContactPress = (type: 'call' | 'whatsapp') => {
        if (!seller?.phoneNumber) {
            Alert.alert("No Phone Number", "The seller has not provided a phone number.");
            return;
        }
        const url = type === 'call' ? `tel:${seller.phoneNumber}` : `https://wa.me/${seller.phoneNumber}`;
        Linking.openURL(url).catch(() => Alert.alert("Error", "Could not perform this action."));
    };

    const handleChatPress = async () => {
        // ... (existing chat logic remains the same)
    };

    if (loading) return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
    if (!ad) return <View style={styles.centered}><Text>Ad not found.</Text></View>;

    return (
        <View style={styles.container}>
            <ScrollView>
                <View style={styles.imageSwiperContainer}><Swiper loop={false} dot={<View style={styles.swiperDot} />} activeDot={<View style={styles.swiperActiveDot} />} paginationStyle={{ bottom: 10 }}>{ad.imageUrls.map((url: string, index: number) => <Image key={index} source={{ uri: url }} style={styles.image} />)}</Swiper></View>
                <View style={styles.headerButtons}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}><Ionicons name="arrow-back-circle" size={40} color="#fff" style={styles.headerIcon} /></TouchableOpacity>
                    {!isMyAd && (<TouchableOpacity onPress={handleToggleFavorite} style={styles.headerButton} disabled={isFavoriteLoading}><Ionicons name={isFavorited ? "heart" : "heart-outline"} size={36} color={isFavorited ? '#E91E63' : '#fff'} style={styles.headerIcon} /></TouchableOpacity>)}
                </View>
                <View style={styles.detailsContainer}>
                    <Text style={styles.title}>{ad.title}</Text>
                    {/* ... (rest of the ad details) */}
                    <View style={styles.separator} />
                    <Text style={styles.sectionTitle}>Seller Information</Text>
                     <View style={styles.sellerContainer}>
                        <Image source={seller?.photoURL ? { uri: seller.photoURL } : require('@/assets/images/avatar.png')} style={styles.sellerAvatar} />
                        <View>
                            <Text style={styles.sellerName}>{seller?.displayName || 'Seller'}</Text>
                            <Text style={styles.sellerInfo}>Member since {seller?.createdAt ? new Date(seller.createdAt.toDate()).getFullYear() : 'N/A'}</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
            <View style={styles.contactBar}>
                <TouchableOpacity style={[styles.contactButton, styles.chatButton, isMyAd && styles.disabledButton]} onPress={handleChatPress} disabled={isMyAd}><Ionicons name="chatbubbles-outline" size={24} color="#fff" /><Text style={styles.contactButtonText}>Chat</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.contactButton, styles.callButton, !seller?.phoneNumber && styles.disabledButton]} onPress={() => handleContactPress('call')} disabled={!seller?.phoneNumber}><Ionicons name="call-outline" size={24} color="#fff" /><Text style={styles.contactButtonText}>Call</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.contactButton, styles.whatsappButton, !seller?.phoneNumber && styles.disabledButton]} onPress={() => handleContactPress('whatsapp')} disabled={!seller?.phoneNumber}><Ionicons name="logo-whatsapp" size={24} color="#fff" /><Text style={styles.contactButtonText}>WhatsApp</Text></TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    // ... existing styles
    sellerAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 15,
        backgroundColor: '#E0E0E0',
    },
    // Add other new styles or adjust existing ones if needed
});
