import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { doc, getDocs, collection, query, where, DocumentData } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function FavoritesScreen() {
    const { user, favorites: favoriteIds } = useAuth();
    const router = useRouter();
    const [favoriteAds, setFavoriteAds] = useState<DocumentData[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchFavoriteAds = useCallback(async () => {
        if (!user || favoriteIds.length === 0) {
            setFavoriteAds([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const adsRef = collection(db, 'ads');
            // Firestore 'in' query is limited to 10 items. For more, you'd need multiple queries.
            // For this app, we'll assume a user won't have more than 10-30 favorites for simplicity.
            const q = query(adsRef, where('__name__', 'in', favoriteIds));
            const querySnapshot = await getDocs(q);
            const adsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setFavoriteAds(adsData);
        } catch (error) {
            console.error("Error fetching favorite ads: ", error);
        } finally {
            setLoading(false);
        }
    }, [user, favoriteIds]);

    useEffect(() => {
        fetchFavoriteAds();
    }, [fetchFavoriteAds]);

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>My Favorites</Text>
                </View>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" />
                </View>
            </View>
        );
    }
    
    if (!user) {
        return (
             <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>My Favorites</Text>
                </View>
                <View style={styles.centered}>
                    <Ionicons name="heart-dislike-outline" size={60} color="#CCC" />
                    <Text style={styles.infoText}>Please log in to see your favorites.</Text>
                    <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/auth/sign-in')}>
                        <Text style={styles.loginButtonText}>Sign In</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (favoriteAds.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>My Favorites</Text>
                </View>
                <View style={styles.centered}>
                    <Ionicons name="heart-outline" size={60} color="#CCC" />
                    <Text style={styles.infoText}>You haven't saved any ads yet.</Text>
                    <Text style={styles.infoSubText}>Tap the heart icon on an ad to save it here.</Text>
                </View>
            </View>
        );
    }
    
    const renderFavoriteItem = ({ item }: { item: DocumentData }) => (
        <TouchableOpacity 
            style={styles.adCard} 
            onPress={() => router.push(`/ad/${item.id}`)}
        >
            <Image source={{ uri: item.imageUrls[0] }} style={styles.adImage} />
            <View style={styles.adCardContent}>
               <Text style={styles.adTitle} numberOfLines={2}>{item.title}</Text>
               <Text style={styles.adPrice}>₪{item.price.toLocaleString()}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Favorites</Text>
            </View>
            <FlatList
                data={favoriteAds}
                renderItem={renderFavoriteItem}
                keyExtractor={item => item.id}
                numColumns={2}
                contentContainerStyle={styles.listContainer}
                onRefresh={fetchFavoriteAds}
                refreshing={loading}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    infoText: {
        fontSize: 18,
        color: '#555',
        textAlign: 'center',
        marginTop: 15,
    },
    infoSubText: {
        fontSize: 14,
        color: '#888',
        marginTop: 10,
        textAlign: 'center',
    },
    loginButton: {
        marginTop: 20,
        backgroundColor: '#4285F4',
        paddingVertical: 10,
        paddingHorizontal: 30,
        borderRadius: 8,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    listContainer: {
        padding: 10,
    },
    adCard: {
        flex: 1/2,
        backgroundColor: '#FFF',
        borderRadius: 8,
        margin: 5,
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
        backgroundColor: '#EEE',
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
        color: '#6A1B9A',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
