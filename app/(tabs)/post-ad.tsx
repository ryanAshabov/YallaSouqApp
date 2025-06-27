import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/AuthContext';
import { db, storage } from '@/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { CATEGORIES, Category, Subcategory, Filter } from '@/constants/categories';

// A dynamic component to render different filter input types
const FilterInput = ({ filter, value, onChange }: { filter: Filter, value: any, onChange: (value: any) => void }) => {
    switch (filter.type) {
        case 'text':
            return <TextInput style={styles.input} placeholder={filter.placeholder} value={value} onChangeText={onChange} />;
        case 'range': // Simplified to a text input for now
            return <TextInput style={styles.input} placeholder={`${filter.label} (e.g., 100-500)`} value={value} onChangeText={onChange} keyboardType="numeric" />;
        case 'radio':
            return (
                <View style={styles.radioGroup}>
                    {filter.options?.map(option => (
                        <TouchableOpacity key={option} style={[styles.radioButton, value === option && styles.radioSelected]} onPress={() => onChange(option)}>
                            <Text style={[styles.radioText, value === option && styles.radioTextSelected]}>{option}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            );
        // Add more cases for 'select', 'location', 'checkbox' as needed
        default:
            return <TextInput style={styles.input} placeholder={filter.label} value={value} onChangeText={onChange} />;
    }
};

export default function PostAdScreen() {
    const { user } = useAuth();
    const router = useRouter();

    // Form state
    const [title, setTitle] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null);
    const [description, setDescription] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [adSpecifics, setAdSpecifics] = useState<Record<string, any>>({});
    
    // Loading state
    const [uploading, setUploading] = useState(false);

    const handleSelectCategory = (category: Category) => {
        setSelectedCategory(category);
        setSelectedSubcategory(null); // Reset subcategory when main category changes
        setAdSpecifics({}); // Reset specifics
    };

    const handleSelectSubcategory = (subcategory: Subcategory) => {
        setSelectedSubcategory(subcategory);
        setAdSpecifics({}); // Reset specifics when subcategory changes
    };

    const handleSpecificsChange = (filterName: string, value: any) => {
        setAdSpecifics(prev => ({ ...prev, [filterName]: value }));
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Camera roll access is required.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            selectionLimit: 5,
            quality: 0.8,
        });
        if (!result.canceled) {
            setImages(prev => [...prev, ...result.assets.map(a => a.uri)].slice(0, 5));
        }
    };

    const uploadImage = async (uri: string): Promise<string> => {
        const response = await fetch(uri);
        const blob = await response.blob();
        const storageRef = ref(storage, `ads/${user!.uid}/${Date.now()}`);
        await uploadBytesResumable(storageRef, blob);
        return getDownloadURL(storageRef);
    };

    const handlePostAd = async () => {
        const price = adSpecifics.price; // Assuming price is a key in specifics
        if (!title || !selectedCategory || !selectedSubcategory || !price || !description || images.length === 0) {
            Alert.alert('Missing Information', 'Please complete all fields and add at least one image.');
            return;
        }
        setUploading(true);
        try {
            const imageUrls = await Promise.all(images.map(uploadImage));
            await addDoc(collection(db, 'ads'), {
                userId: user!.uid,
                title,
                description,
                imageUrls,
                category: selectedCategory.name,
                subcategory: selectedSubcategory.name,
                ...adSpecifics, // Save all dynamic fields
                createdAt: serverTimestamp(),
                status: 'active',
            });
            Alert.alert('Success!', 'Your ad has been posted.');
            router.push('/(tabs)/');
        } catch (error) {
            console.error("Error posting ad: ", error);
            Alert.alert('Error', 'Failed to post your ad.');
        } finally {
            setUploading(false);
        }
    };

    if (!user) {
        return (
            <View style={styles.centered}>
                <Text style={styles.loginPromptText}>Please log in to post an ad.</Text>
                <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/(auth)/sign-in')}>
                    <Text style={styles.loginButtonText}>Sign In</Text>
                </TouchableOpacity>
            </View>
        );
    }
    
    return (
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
            {uploading && <View style={styles.uploadingOverlay}><ActivityIndicator size="large" color="#fff" /><Text style={styles.uploadingText}>Posting...</Text></View>}
            <View style={styles.header}><Text style={styles.headerTitle}>Post a New Ad</Text></View>

            <View style={styles.form}>
                <Text style={styles.label}>1. Choose a Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
                    {CATEGORIES.map(cat => (
                        <TouchableOpacity key={cat.name} style={[styles.categoryButton, selectedCategory?.name === cat.name && { backgroundColor: cat.color, borderColor: cat.color }]} onPress={() => handleSelectCategory(cat)}>
                            <Text style={[styles.categoryButtonText, selectedCategory?.name === cat.name && { color: '#fff' }]}>{cat.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {selectedCategory && (
                    <>
                        <Text style={styles.label}>2. Choose a Subcategory</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
                            {selectedCategory.subcategories.map(subcat => (
                                <TouchableOpacity key={subcat.name} style={[styles.categoryButton, selectedSubcategory?.name === subcat.name && { backgroundColor: selectedCategory.color, borderColor: selectedCategory.color }]} onPress={() => handleSelectSubcategory(subcat)}>
                                    <Text style={[styles.categoryButtonText, selectedSubcategory?.name === subcat.name && { color: '#fff' }]}>{subcat.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </>
                )}
                
                {selectedSubcategory && (
                    <>
                        <Text style={styles.label}>3. Ad Details</Text>
                        <TextInput style={styles.input} placeholder="Ad Title (e.g., iPhone 13 Pro Max)" value={title} onChangeText={setTitle} />
                        <TextInput style={[styles.input, styles.descriptionInput]} placeholder="Detailed description..." value={description} onChangeText={setDescription} multiline />
                        
                        {selectedSubcategory.filters.map(filter => (
                           <View key={filter.name}>
                               <Text style={styles.filterLabel}>{filter.label}</Text>
                               <FilterInput filter={filter} value={adSpecifics[filter.name]} onChange={(value) => handleSpecificsChange(filter.name, value)} />
                           </View>
                        ))}

                        <Text style={styles.label}>4. Photos (Up to 5)</Text>
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
                    </>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9f9f9' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    loginPromptText: { fontSize: 18, textAlign: 'center', marginBottom: 20 },
    loginButton: { backgroundColor: '#4285F4', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 8 },
    loginButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    uploadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
    uploadingText: { color: '#fff', marginTop: 15, fontSize: 16 },
    header: { backgroundColor: '#fff', paddingVertical: 20, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', textAlign: 'center' },
    form: { padding: 20 },
    label: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10, color: '#444' },
    filterLabel: { fontSize: 16, fontWeight: '600', marginBottom: 10, color: '#555' },
    input: { backgroundColor: '#fff', borderRadius: 8, padding: 15, fontSize: 16, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
    descriptionInput: { height: 120, textAlignVertical: 'top' },
    categoryContainer: { flexDirection: 'row', marginBottom: 10, paddingVertical: 5 },
    categoryButton: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 25, marginRight: 10, borderWidth: 1.5, borderColor: '#ddd', backgroundColor: '#fff' },
    categoryButtonText: { color: '#555', fontWeight: '600', fontSize: 14 },
    photosGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
    photosContainer: { width: 100, height: 100, borderRadius: 8, borderWidth: 2, borderColor: '#ddd', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0', marginBottom: 10, marginRight: 10 },
    photosText: { marginTop: 5, fontSize: 14, color: '#4285F4' },
    photoPreviewContainer: { position: 'relative', marginRight: 10, marginBottom: 10 },
    photoPreview: { width: 100, height: 100, borderRadius: 8 },
    removeImageButton: { position: 'absolute', top: -10, right: -10, backgroundColor: '#fff', borderRadius: 15 },
    submitButton: { backgroundColor: '#1DB954', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 30 },
    submitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    radioGroup: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 },
    radioButton: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 20, borderWidth: 1.5, borderColor: '#ddd', marginRight: 10, marginBottom: 10 },
    radioSelected: { backgroundColor: '#4285F4', borderColor: '#4285F4' },
    radioText: { fontWeight: '600', color: '#555' },
    radioTextSelected: { color: '#fff' },
});
