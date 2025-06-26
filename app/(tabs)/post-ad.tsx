import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/AuthContext';
import { db, storage } from '@/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { CATEGORIES } from '@/constants/categories';

export default function PostAdScreen() {
    const { user } = useAuth();
    const router = useRouter();
    
    // Form state
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [images, setImages] = useState<string[]>([]);
    
    // Loading state
    const [uploading, setUploading] = useState(false);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            selectionLimit: 5,
            quality: 0.8,
        });

        if (!result.canceled) {
            setImages(result.assets.map(asset => asset.uri));
        }
    };

    const uploadImage = async (uri: string): Promise<string> => {
        const response = await fetch(uri);
        const blob = await response.blob();
        const storageRef = ref(storage, `ads/${user!.uid}/${Date.now()}-${Math.random().toString(36).substring(7)}`);
        const uploadTask = uploadBytesResumable(storageRef, blob);
      
        return new Promise((resolve, reject) => {
          uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload is ' + progress + '% done');
            },
            (error) => {
                reject(error);
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then(resolve);
            }
          );
        });
    };

    const handlePostAd = async () => {
        if (!title || !category || !price || !description || images.length === 0) {
            Alert.alert('Missing Information', 'Please fill all required fields and add at least one photo.');
            return;
        }

        setUploading(true);

        try {
            const imageUrls = await Promise.all(images.map(uri => uploadImage(uri)));
            await addDoc(collection(db, 'ads'), {
                userId: user!.uid,
                title,
                category,
                price: parseFloat(price),
                location,
                description,
                imageUrls,
                createdAt: serverTimestamp(),
                status: 'active',
            });

            Alert.alert('Success!', 'Your ad has been posted successfully.');
            
            setTitle('');
            setCategory('');
            setPrice('');
            setLocation('');
            setDescription('');
            setImages([]);
            router.push('/'); // Corrected path to home screen

        } catch (error) {
            console.error("Error posting ad: ", error);
            Alert.alert('Error', 'There was an error posting your ad. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    if (!user) {
        return (
            <View style={styles.centered}>
                <Text style={styles.loginPromptText}>You need to be logged in to post an ad.</Text>
                <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/(auth)/sign-in')}>
                    <Text style={styles.loginButtonText}>Sign In or Create Account</Text>
                </TouchableOpacity>
            </View>
        );
    }
    
    return (
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
            {uploading && (
                <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.uploadingText}>Posting your ad...</Text>
                </View>
            )}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Post an Ad</Text>
                <Text style={styles.headerSubtitle}>Sell your items quickly and easily</Text>
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

                <Text style={styles.label}>Photos (Up to 5) *</Text>
                <View style={styles.photosGrid}>
                    {images.map((uri, index) => (
                        <View key={index} style={styles.photoPreviewContainer}>
                           <Image source={{ uri }} style={styles.photoPreview} />
                           <TouchableOpacity onPress={() => setImages(images.filter(img => img !== uri))} style={styles.removeImageButton}>
                               <Ionicons name="close-circle" size={28} color="#D32F2F" />
                           </TouchableOpacity>
                        </View>
                    ))}
                    {images.length < 5 && (
                        <TouchableOpacity style={styles.photosContainer} onPress={pickImage}>
                            <Ionicons name="camera-outline" size={40} color="#4285F4" />
                            <Text style={styles.photosText}>Add Photos</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <TouchableOpacity style={styles.submitButton} onPress={handlePostAd} disabled={uploading}>
                    <Text style={styles.submitButtonText}>Post Your Ad</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    loginPromptText: { fontSize: 18, textAlign: 'center', marginBottom: 20 },
    loginButton: { backgroundColor: '#4285F4', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 8 },
    loginButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    uploadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
    uploadingText: { color: '#fff', marginTop: 15, fontSize: 16 },
    header: { backgroundColor: '#1DB954', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, alignItems: 'center' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    headerSubtitle: { fontSize: 16, color: '#fff', marginTop: 5 },
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
    photosGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    photosContainer: { width: 100, height: 100, borderRadius: 8, borderWidth: 2, borderColor: '#DDD', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F7F7', marginBottom: 10, marginRight: 10 },
    photosText: { marginTop: 5, fontSize: 14, color: '#4285F4' },
    photoPreviewContainer: { position: 'relative', marginRight: 10, marginBottom: 10 },
    photoPreview: { width: 100, height: 100, borderRadius: 8 },
    removeImageButton: { position: 'absolute', top: -10, right: -10, backgroundColor: '#fff', borderRadius: 15 },
    submitButton: { backgroundColor: '#1DB954', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 20 },
    submitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
