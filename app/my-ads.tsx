import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc, DocumentData } from 'firebase/firestore';
import { deleteObject, ref } from 'firebase/storage';
import { db, storage } from '@/firebaseConfig';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function MyAdsScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [myAds, setMyAds] = useState<DocumentData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const adsCollection = collection(db, 'ads');
        const q = query(adsCollection, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const adsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMyAds(adsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching my ads: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);
    
    const handleDeleteAd = (ad: DocumentData) => {
        Alert.alert(
            "Delete Ad",
            `Are you sure you want to delete "${ad.title}"? This action cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive", 
                    onPress: async () => {
                        try {
                            // Delete images from Storage
                            for (const imageUrl of ad.imageUrls) {
                                const imageRef = ref(storage, imageUrl);
                                await deleteObject(imageRef);
                            }
                            // Delete ad document from Firestore
                            await deleteDoc(doc(db, 'ads', ad.id));
                            Alert.alert("Success", "Your ad has been deleted.");
                        } catch (error) {
                            console.error("Error deleting ad: ", error);
                            Alert.alert("Error", "Could not delete the ad. Please try again.");
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
    }
    
    if (!user) {
         return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Ionicons name="arrow-back" size={24} color="#333" /></TouchableOpacity>
                    <Text style={styles.headerTitle}>My Ads</Text>
                </View>
                <View style={styles.centered}>
                    <Text style={styles.infoText}>Please log in to manage your ads.</Text>
                </View>
            </View>
        );
    }
    
    const renderAdItem = ({ item }: { item: DocumentData }) => (
        <View style={styles.adCard}>
            <Image source={{ uri: item.imageUrls[0] }} style={styles.adImage} />
            <View style={styles.adContent}>
                <Text style={styles.adTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.adPrice}>₪{item.price.toLocaleString()}</Text>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={[styles.button, styles.editButton]} onPress={() => router.push(`/ad-edit/${item.id}`)}>
                        <Ionicons name="pencil-outline" size={18} color="#fff" />
                        <Text style={styles.buttonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={() => handleDeleteAd(item)}>
                        <Ionicons name="trash-outline" size={18} color="#fff" />
                        <Text style={styles.buttonText}>Delete</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                 <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Ads</Text>
            </View>
            {myAds.length === 0 && !loading ? (
                <View style={styles.centered}>
                    <Ionicons name="list-outline" size={60} color="#CCC" />
                    <Text style={styles.infoText}>You haven't posted any ads yet.</Text>
                </View>
            ) : (
                <FlatList
                    data={myAds}
                    renderItem={renderAdItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContainer}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F8F8' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    header: { 
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    backButton: { position: 'absolute', left: 20, top: 60 },
    headerTitle: { fontSize: 22, fontWeight: 'bold' },
    infoText: { fontSize: 18, color: '#555', textAlign: 'center' },
    listContainer: { padding: 15 },
    adCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        marginBottom: 15,
        flexDirection: 'row',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2.22,
        elevation: 3,
    },
    adImage: { width: 100, height: '100%', borderTopLeftRadius: 10, borderBottomLeftRadius: 10, backgroundColor: '#EEE' },
    adContent: { flex: 1, padding: 15 },
    adTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
    adPrice: { fontSize: 16, color: '#6A1B9A', fontWeight: 'bold', marginBottom: 15 },
    buttonContainer: { flexDirection: 'row' },
    button: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, marginRight: 10 },
    buttonText: { color: '#fff', marginLeft: 6, fontWeight: 'bold' },
    editButton: { backgroundColor: '#4285F4' },
    deleteButton: { backgroundColor: '#D32F2F' },
});
