import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORIES } from '@/constants/categories';

export default function CategoryScreen() {
    const router = useRouter();
    const { category: categoryName } = useLocalSearchParams<{ category: string }>();

    const category = CATEGORIES.find(c => c.name.replace(/ /g, '-') === categoryName);

    if (!category) {
        return (
            <View style={styles.container}>
                <Text>Category not found!</Text>
            </View>
        );
    }

    const headerStyle = {
        backgroundColor: category.color,
    };

    return (
        <ScrollView style={styles.container}>
            <View style={[styles.header, headerStyle]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Ionicons name={category.icon as any} size={40} color="#fff" style={styles.headerIcon} />
                <Text style={styles.headerTitle}>{category.name}</Text>
                <Text style={styles.headerSubtitle}>Select a {category.name} category to continue</Text>
            </View>

            <View style={styles.listContainer}>
                <TouchableOpacity style={styles.listItem}>
                     <View style={[styles.listItemIconContainer, { backgroundColor: `${category.color}20` }]}>
                        <Ionicons name={category.icon as any} size={24} color={category.color} />
                    </View>
                    <View style={styles.listItemTextContainer}>
                        <Text style={styles.listItemTitle}>View All {category.name}</Text>
                        <Text style={styles.listItemSubtitle}>Browse all items in this category</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={22} color="#AAA" />
                </TouchableOpacity>
                
                <Text style={styles.subcategoriesTitle}>Subcategories</Text>

                {category.subcategories.map((subcategory, index) => (
                    <TouchableOpacity key={index} style={styles.listItem}>
                        <View style={[styles.listItemIconContainer, { backgroundColor: `${category.color}20` }]}>
                          <Ionicons name={category.icon as any} size={24} color={category.color} />
                        </View>
                        <View style={styles.listItemTextContainer}>
                            <Text style={styles.listItemTitle}>{subcategory.name}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={22} color="#AAA" />
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F8F8',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 30,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    backButton: {
        position: 'absolute',
        top: 60,
        left: 20,
    },
    headerIcon: {
        marginBottom: 10,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#fff',
        marginTop: 5,
    },
    listContainer: {
        padding: 20,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2.22,
        elevation: 3,
    },
    listItemIconContainer: {
        padding: 12,
        borderRadius: 50,
        marginRight: 15,
    },
    listItemTextContainer: {
        flex: 1,
    },
    listItemTitle: {
        fontSize: 17,
        fontWeight: '600',
    },
    listItemSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    subcategoriesTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginVertical: 10,
        marginLeft: 5,
    },
});
