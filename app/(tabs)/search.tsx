import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, query, where, getDocs, DocumentData, Query, QueryConstraint } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { useDebounce } from '@/hooks/useDebounce';
import FilterModal from '@/components/FilterModal';

type Filters = { category: string; minPrice: string; maxPrice: string };

export default function SearchScreen() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<DocumentData[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    
    // --- Filter State ---
    const [modalVisible, setModalVisible] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState<Filters>({ category: '', minPrice: '', maxPrice: '' });
    
    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    const performSearch = useCallback(async (text: string, filters: Filters) => {
        if (text.length < 2 && !filters.category && !filters.minPrice && !filters.maxPrice) {
            setResults([]);
            setHasSearched(false);
            return;
        }

        setLoading(true);
        setHasSearched(true);
        try {
            let q: Query<DocumentData> = collection(db, 'ads');
            const constraints: QueryConstraint[] = [];
            
            // Text search constraint
            if (text) {
                constraints.push(where('title', '>=', text));
                constraints.push(where('title', '<=', text + '\uf8ff'));
            }
            
            // Filter constraints
            if (filters.category) {
                constraints.push(where('category', '==', filters.category));
            }
            if (filters.minPrice) {
                constraints.push(where('price', '>=', parseFloat(filters.minPrice)));
            }
            if (filters.maxPrice) {
                constraints.push(where('price', '<=', parseFloat(filters.maxPrice)));
            }
            
            if (constraints.length > 0) {
                q = query(q, ...constraints);
            }

            const querySnapshot = await getDocs(q);
            const searchResults = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setResults(searchResults);
        } catch (error) {
            console.error("Error searching ads: ", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        performSearch(debouncedSearchQuery, appliedFilters);
    }, [debouncedSearchQuery, appliedFilters, performSearch]);

    const handleApplyFilters = (filters: Filters) => {
        setAppliedFilters(filters);
    };
    
    const filterCount = Object.values(appliedFilters).filter(v => v).length;

    const renderAdItem = ({ item }: { item: DocumentData }) => (
        <TouchableOpacity style={styles.resultItem} onPress={() => router.push(`/ad/${item.id}`)}>
            <Image source={{ uri: item.imageUrls[0] }} style={styles.resultImage} />
            <View style={styles.resultTextContainer}>
                <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.resultPrice}>₪{item.price.toLocaleString()}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Search</Text>
            </View>

            <View style={styles.searchSection}>
                <View style={styles.searchBarContainer}>
                    <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
                    <TextInput
                        placeholder="What are you looking for?"
                        style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    <TouchableOpacity style={styles.filterButton} onPress={() => setModalVisible(true)}>
                        {filterCount > 0 && <View style={styles.filterBadge}><Text style={styles.filterBadgeText}>{filterCount}</Text></View>}
                        <Ionicons name="filter-outline" size={24} color="#555" />
                    </TouchableOpacity>
                </View>
            </View>
            
            <FilterModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onApply={handleApplyFilters}
            />

            {loading ? (
                <ActivityIndicator size="large" style={styles.centered} />
            ) : hasSearched ? (
                results.length > 0 ? (
                    <FlatList
                        data={results}
                        renderItem={renderAdItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.resultsList}
                    />
                ) : (
                    <View style={styles.centered}>
                        <Ionicons name="sad-outline" size={60} color="#CCC" />
                        <Text style={styles.noResultsText}>No results found</Text>
                        <Text style={styles.noResultsSubText}>Try adjusting your search or filters</Text>
                    </View>
                )
            ) : (
                <View style={styles.centered}>
                    <Ionicons name="search-circle-outline" size={100} color="#E0E0E0" />
                    <Text style={styles.startSearchText}>Start typing to search for ads</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { paddingTop: 60, paddingBottom: 10, paddingHorizontal: 20 },
    headerTitle: { fontSize: 28, fontWeight: 'bold' },
    searchSection: { padding: 20, paddingTop: 10 },
    searchBarContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F3F3', borderRadius: 12, paddingHorizontal: 15 },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, height: 50, fontSize: 16 },
    filterButton: { position: 'relative', marginLeft: 10 },
    filterBadge: { position: 'absolute', top: -5, right: -8, backgroundColor: '#E91E63', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
    filterBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    startSearchText: { marginTop: 15, fontSize: 16, color: '#666' },
    noResultsText: { marginTop: 15, fontSize: 18, fontWeight: '600', color: '#555' },
    noResultsSubText: { marginTop: 8, fontSize: 14, color: '#888' },
    resultsList: { paddingHorizontal: 20 },
    resultItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#EEE' },
    resultImage: { width: 60, height: 60, borderRadius: 8, marginRight: 15, backgroundColor: '#EEE' },
    resultTextContainer: { flex: 1 },
    resultTitle: { fontSize: 16, fontWeight: '600' },
    resultPrice: { fontSize: 14, color: '#6A1B9A', marginTop: 4 },
});
