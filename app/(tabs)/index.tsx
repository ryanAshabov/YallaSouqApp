import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CATEGORIES } from '@/constants/categories';
import { db } from '@/firebaseConfig';
import { collection, query, orderBy, limit, onSnapshot, DocumentData } from 'firebase/firestore';

export default function HomeScreen() {
    const router = useRouter();
    const [recentAds, setRecentAds] = useState<DocumentData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const adsCollection = collection(db, 'ads');
        const q = query(adsCollection, orderBy('createdAt', 'desc'), limit(10));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const adsData: DocumentData[] = [];
            querySnapshot.forEach((doc) => {
                adsData.push({ id: doc.id, ...doc.data() });
            });
            setRecentAds(adsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching recent ads: ", error);
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    const handleCategoryPress = (categoryName: string) => {
        const urlFriendlyName = categoryName.replace(/ /g, '-');
        router.push(`/category/${urlFriendlyName}`);
    };

    const handleAdPress = (adId: string) => {
        router.push(`/ad/${adId}`);
    };

    const homeScreenCategories = CATEGORIES.slice(0, 8);

    const renderRecentAds = () => {
        if (loading) {
            return <ActivityIndicator size="large" color="#6A1B9A" style={{ marginTop: 20 }} />;
        }

        if (recentAds.length === 0) {
            return (
                <View style={styles.noAdsContainer}>
                    <Ionicons name="eye-off-outline" size={50} color="#CCC" />
                    <Text style={styles.noAdsText}>No ads have been posted yet.</Text>
                    <Text style={styles.noAdsSubText}>Be the first to post one!</Text>
                </View>
            );
        }

        return (
            <View style={styles.recentAdsContainer}>
                {recentAds.map((ad) => (
                    <TouchableOpacity key={ad.id} style={styles.adCard} onPress={() => handleAdPress(ad.id)}>
                        <Image source={{ uri: ad.imageUrls[0] }} style={styles.adImage} />
                        <View style={styles.adCardContent}>
                           <Text style={styles.adTitle} numberOfLines={2}>{ad.title}</Text>
                           <Text style={styles.adPrice}>₪{ad.price.toLocaleString()}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Yalla Souq</Text>
                <Text style={styles.headerSubtitle}>Buy and sell anything, anywhere</Text>
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
                <TextInput placeholder="What are you looking for?" style={styles.searchInput} />
            </View>

            <Text style={styles.sectionTitle}>Browse Categories</Text>
            <View style={styles.categoriesContainer}>
                {homeScreenCategories.map((category) => (
                    <TouchableOpacity 
                        key={category.name} 
                        style={styles.categoryBox}
                        onPress={() => handleCategoryPress(category.name)}
                    >
                        <View style={[styles.categoryIconContainer, { backgroundColor: category.color }]}>
                            <Ionicons name={category.icon as any} size={28} color="#fff" />
                        </View>
                        <Text style={styles.categoryText}>{category.name}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.sectionTitle}>Recent Ads</Text>
            {renderRecentAds()}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        backgroundColor: '#6A1B9A',
        padding: 20,
        paddingTop: 60,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#E0E0E0',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 25,
        marginHorizontal: 15,
        marginTop: -25,
        marginBottom: 10,
        paddingHorizontal: 15,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        height: 50,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 15,
        marginTop: 30,
        marginBottom: 15,
    },
    categoriesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
    },
    categoryBox: {
        width: '22%',
        alignItems: 'center',
        marginBottom: 20,
    },
    categoryIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryText: {
        textAlign: 'center',
        fontWeight: '600',
        fontSize: 12,
    },
    noAdsContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 50,
    },
    noAdsText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#555',
        marginTop: 10,
    },
    noAdsSubText: {
        fontSize: 14,
        color: '#888',
        marginTop: 5,
    },
    recentAdsContainer: {
        paddingHorizontal: 15,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    adCard: {
        width: '48%',
        backgroundColor: '#FFF',
        borderRadius: 8,
        marginBottom: 15,
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
        height: 36, // Ensure consistent height
    },
    adPrice: {
        color: '#6A1B9A',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
