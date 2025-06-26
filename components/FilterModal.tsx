import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORIES } from '@/constants/categories';

interface Props {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: { category: string; minPrice: string; maxPrice: string }) => void;
}

export default function FilterModal({ visible, onClose, onApply }: Props) {
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const handleApply = () => {
    onApply({ category, minPrice, maxPrice });
    onClose();
  };
  
  const handleClear = () => {
    setCategory('');
    setMinPrice('');
    setMaxPrice('');
    onApply({ category: '', minPrice: '', maxPrice: '' });
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Filters</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView>
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryContainer}>
                {CATEGORIES.map(cat => (
                    <TouchableOpacity 
                        key={cat.name} 
                        style={[styles.categoryButton, category === cat.name && styles.categoryButtonSelected]}
                        onPress={() => setCategory(cat.name)}
                    >
                        <Text style={[styles.categoryButtonText, category === cat.name && styles.categoryButtonTextSelected]}>{cat.name}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.label}>Price Range (₪)</Text>
            <View style={styles.priceRangeContainer}>
              <TextInput
                style={styles.priceInput}
                placeholder="Min Price"
                value={minPrice}
                onChangeText={setMinPrice}
                keyboardType="numeric"
              />
              <Text style={styles.priceSeparator}>-</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="Max Price"
                value={maxPrice}
                onChangeText={setMaxPrice}
                keyboardType="numeric"
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
                <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
    modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { height: '80%', backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    headerTitle: { fontSize: 22, fontWeight: 'bold' },
    label: { fontSize: 18, fontWeight: '600', marginBottom: 15, color: '#333' },
    categoryContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
    categoryButton: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, marginRight: 10, marginBottom: 10, backgroundColor: '#F3F3F3', borderWidth: 1, borderColor: '#EEE' },
    categoryButtonSelected: { backgroundColor: '#4285F4', borderColor: '#4285F4' },
    categoryButtonText: { color: '#555', fontWeight: '600' },
    categoryButtonTextSelected: { color: '#fff' },
    priceRangeContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
    priceInput: { flex: 1, backgroundColor: '#F7F7F7', borderRadius: 8, padding: 15, fontSize: 16, borderWidth: 1, borderColor: '#EEE', textAlign: 'center' },
    priceSeparator: { fontSize: 20, marginHorizontal: 10 },
    footer: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 15, marginTop: 'auto' },
    clearButton: { padding: 15, borderRadius: 10 },
    clearButtonText: { fontSize: 18, fontWeight: 'bold', color: '#888' },
    applyButton: { backgroundColor: '#4285F4', padding: 15, borderRadius: 10, paddingHorizontal: 30 },
    applyButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
