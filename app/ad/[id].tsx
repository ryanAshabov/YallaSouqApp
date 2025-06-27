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
    createdAt?: Timestamp;
}

interface ChatDocumentData {
    adTitle: string;
    participants: string[];
    adId: string;
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
        if (isMyAd) return;
        if (!seller?.phoneNumber) {
            Alert.alert("No Phone Number", "The seller has not provided a phone number.");
            return;
        }
        const url = type === 'call' ? `tel:${seller.phoneNumber}` : `https://wa.me/${seller.phoneNumber.replace(/[^0-9]/g, '')}`;
        Linking.openURL(url).catch(() => Alert.alert("Error", "Could not perform this action."));
    };

    const handleChatPress = async () => {
        if (!user || !ad || !seller) {
            Alert.alert("Login Required", "Please sign in to start a chat.", [{ text: "Cancel" },{ text: "Sign In", onPress: () => router.push('/(auth)/sign-in') }]);
            return;
        }
        if (isMyAd) {
            Alert.alert("This is your ad", "You cannot start a chat with yourself.");
            return;
        }
        try {
            const chatsRef = collection(db, 'chats');
            const q = query(chatsRef, where('adId', '==', id), where('participants', 'array-contains', user.uid));
            const querySnapshot = await getDocs(q);
            
            let existingChat: Chat | null = null;
            for (const doc of querySnapshot.docs) {
                const data = doc.data() as ChatDocumentData;
                if (data.participants.includes(ad.userId)) {
                    existingChat = { id: doc.id, ...data };
                    break;
                }
            }

            if (existingChat) {
                router.push(`/chat/${existingChat.id}?adTitle=${encodeURIComponent(existingChat.adTitle)}`);
            } else {
                const newChatRef = await addDoc(chatsRef, {
                    adId: id,
                    adTitle: ad.title,
                    participants: [user.uid, ad.userId],
                    participantNames: { [user.uid]: user.displayName || user.email, [ad.userId]: seller?.displayName || seller.email },
                    lastMessage: "Chat started...",
                    lastMessageTimestamp: serverTimestamp(),
                    createdAt: serverTimestamp(),
                });
                router.push(`/chat/${newChatRef.id}?adTitle=${encodeURIComponent(ad.title)}`);
            }
        } catch (error) {
            console.error("Error starting chat: ", error);
        }
    };

    if (loading) return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
    if (!ad) return <View style={styles.centered}><Text>Ad not found.</Text></View>;

    return (
        <View style={styles.container}>
            <ScrollView>
                <View style={styles.imageSwiperContainer}>
                    <Swiper loop={false} dot={<View style={styles.swiperDot} />} activeDot={<View style={styles.swiperActiveDot} />} paginationStyle={{ bottom: 10 }}>
                        {ad.imageUrls.map((url: string, index: number) => <Image key={index} source={{ uri: url }} style={styles.image} />)}
                    </Swiper>
                </View>
                <View style={styles.headerButtons}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}><Ionicons name="arrow-back-circle" size={40} color="#fff" style={styles.headerIcon} /></TouchableOpacity>
                    {!isMyAd && (<TouchableOpacity onPress={handleToggleFavorite} style={styles.headerButton} disabled={isFavoriteLoading}><Ionicons name={isFavorited ? "heart" : "heart-outline"} size={36} color={isFavorited ? '#E91E63' : '#fff'} style={styles.headerIcon} /></TouchableOpacity>)}
                </View>
                <View style={styles.detailsContainer}>
                    <Text style={styles.title}>{ad.title}</Text>
                    <Text style={styles.price}>₪{ad.price.toLocaleString()}</Text>
                    <View style={styles.infoRow}><Ionicons name="pricetag-outline" size={20} color="#888" /><Text style={styles.infoText}>{ad.category}</Text></View>
                    <View style={styles.infoRow}><Ionicons name="location-outline" size={20} color="#888" /><Text style={styles.infoText}>{ad.location || 'Not specified'}</Text></View>
                    <View style={styles.infoRow}><Ionicons name="time-outline" size={20} color="#888" /><Text style={styles.infoText}>Posted on {ad.createdAt.toDate().toLocaleDateString()}</Text></View>
                    <View style={styles.separator} />
                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.description}>{ad.description}</Text>
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
                <TouchableOpacity style={[styles.contactButton, styles.callButton, (isMyAd || !seller?.phoneNumber) && styles.disabledButton]} onPress={() => handleContactPress('call')} disabled={isMyAd || !seller?.phoneNumber}><Ionicons name="call-outline" size={24} color="#fff" /><Text style={styles.contactButtonText}>Call</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.contactButton, styles.whatsappButton, (isMyAd || !seller?.phoneNumber) && styles.disabledButton]} onPress={() => handleContactPress('whatsapp')} disabled={isMyAd || !seller?.phoneNumber}><Ionicons name="logo-whatsapp" size={24} color="#fff" /><Text style={styles.contactButtonText}>WhatsApp</Text></TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    imageSwiperContainer: { height: 350, backgroundColor: '#EEE' },
    image: { width: '100%', height: 350, resizeMode: 'cover' },
    swiperDot: { backgroundColor: 'rgba(255,255,255,.3)', width: 8, height: 8, borderRadius: 4, marginLeft: 3, marginRight: 3 },
    swiperActiveDot: { backgroundColor: '#fff', width: 10, height: 10, borderRadius: 5, marginLeft: 3, marginRight: 3 },
    headerButtons: { position: 'absolute', top: 50, left: 15, right: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerButton: { padding: 5 },
    headerIcon: { textShadowColor: 'rgba(0, 0, 0, 0.5)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 3 },
    detailsContainer: { padding: 20, paddingTop: 30 },
    title: { fontSize: 26, fontWeight: 'bold', marginBottom: 8 },
    price: { fontSize: 22, fontWeight: 'bold', color: '#6A1B9A', marginBottom: 20 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    infoText: { marginLeft: 10, fontSize: 16, color: '#333' },
    separator: { height: 1, backgroundColor: '#EEE', marginVertical: 20 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
    description: { fontSize: 16, lineHeight: 24, color: '#555' },
    sellerContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F8F8', padding: 15, borderRadius: 10 },
    sellerAvatar: { width: 60, height: 60, borderRadius: 30, marginRight: 15, backgroundColor: '#E0E0E0' },
    sellerName: { fontSize: 18, fontWeight: 'bold' },
    sellerInfo: { fontSize: 14, color: '#666' },
    contactBar: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderTopColor: '#EEE', backgroundColor: '#fff' },
    contactButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 8, marginHorizontal: 5 },
    contactButtonText: { color: '#fff', marginLeft: 10, fontWeight: 'bold', fontSize: 16 },
    chatButton: { backgroundColor: '#4285F4' },
    callButton: { backgroundColor: '#E67E22' },
    whatsappButton: { backgroundColor: '#25D366' },
    disabledButton: { backgroundColor: '#BDBDBD' },
});
