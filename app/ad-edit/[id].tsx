import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORIES } from '@/constants/categories';

export default function AdEditScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user } = useAuth();
    const router = useRouter();

    // Form state
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    
    // Loading state
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        const fetchAdData = async () => {
            if (!id) return;
            try {
                const docRef = doc(db, 'ads', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const ad = docSnap.data();
                    // Security check: ensure the current user is the owner of the ad
                    if (ad.userId !== user?.uid) {
                        Alert.alert("Unauthorized", "You are not allowed to edit this ad.");
                        router.back();
                        return;
                    }
                    setTitle(ad.title);
                    setCategory(ad.category);
                    setPrice(ad.price.toString());
                    setLocation(ad.location);
                    setDescription(ad.description);
                } else {
                    Alert.alert("Not Found", "This ad does not exist.");
                    router.back();
                }
            } catch (error) {
                console.error("Error fetching ad for edit: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAdData();
    }, [id, user]);

    const handleUpdateAd = async () => {
        if (!title || !category || !price || !description) {
            Alert.alert('Missing Information', 'Please fill all required fields.');
            return;
        }

        setUpdating(true);
        const adDocRef = doc(db, 'ads', id);

        try {
            await updateDoc(adDocRef, {
                title,
                category,
                price: parseFloat(price),
                location,
                description,
                updatedAt: serverTimestamp(),
            });

            Alert.alert('Success!', 'Your ad has been updated.');
            router.back(); // Go back to the "My Ads" screen

        } catch (error) {
            console.error("Error updating ad: ", error);
            Alert.alert('Error', 'There was an error updating your ad.');
        } finally {
            setUpdating(false);
        }
    };
    
    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
    }

    return (
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
            {updating && (
                <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.uploadingText}>Updating your ad...</Text>
                </View>
            )}
            <View style={styles.header}>
                 <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Your Ad</Text>
            </View>

            <View style={styles.form}>
                <Text style={styles.label}>Title *</Text>
                <TextInput style={styles.input} placeholder="What are you selling?" value={title} onChangeText={setTitle} />

                <Text style={styles.label}>Category *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
                    {CATEGORIES.map(cat => (
                        <TouchableOpacity 
                            key={cat.name} 
                            style={[styles.categoryButton, category === cat.name && { backgroundColor: cat.color, borderColor: cat.color }]}
                            onPress={() => setCategory(cat.name)}
                        >
                            <Text style={[styles.categoryButtonText, category === cat.name && { color: '#fff' }]}>{cat.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <Text style={styles.label}>Price *</Text>
                <View style={styles.priceInputContainer}>
                    <Text style={styles.priceCurrencySymbol}>₪</Text>
                    <TextInput style={styles.priceInput} placeholder="Enter price in ILS" value={price} onChangeText={setPrice} keyboardType="numeric" />
                </View>
                
                <Text style={styles.label}>Location</Text>
                <View style={styles.locationInputContainer}>
                    <Ionicons name="location-outline" size={24} color="#888" />
                    <TextInput style={styles.locationInput} placeholder="City or area" value={location} onChangeText={setLocation} />
                </View>

                <Text style={styles.label}>Description *</Text>
                <TextInput style={[styles.input, styles.descriptionInput]} placeholder="Describe your item in detail..." value={description} onChangeText={setDescription} multiline />
                
                <TouchableOpacity style={styles.submitButton} onPress={handleUpdateAd} disabled={updating}>
                    <Text style={styles.submitButtonText}>Update Ad</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}


const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    uploadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
    uploadingText: { color: '#fff', marginTop: 15, fontSize: 16 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4285F4', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
    backButton: { position: 'absolute', left: 20, top: 58 },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
    form: { padding: 20 },
    label: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#333' },
    input: { backgroundColor: '#F7F7F7', borderRadius: 8, padding: 15, fontSize: 16, marginBottom: 20, borderWidth: 1, borderColor: '#EEE' },
    priceInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7F7F7', borderRadius: 8, paddingHorizontal: 15, marginBottom: 20, borderWidth: 1, borderColor: '#EEE' },
    priceCurrencySymbol: { fontSize: 18, marginRight: 10, color: '#888' },
    priceInput: { flex: 1, paddingVertical: 15, fontSize: 16 },
    locationInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7F7F7', borderRadius: 8, paddingHorizontal: 15, marginBottom: 20, borderWidth: 1, borderColor: '#EEE' },
    locationInput: { flex: 1, paddingVertical: 15, fontSize: 16, marginLeft: 10 },
    descriptionInput: { height: 120, textAlignVertical: 'top' },
    categoryContainer: { flexDirection: 'row', marginBottom: 20 },
    categoryButton: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, marginRight: 10, borderWidth: 1.5, borderColor: '#DDD' },
    categoryButtonText: { color: '#555', fontWeight: '600' },
    submitButton: { backgroundColor: '#4285F4', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 20 },
    submitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
