import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { collection, query, where, orderBy, onSnapshot, DocumentData } from 'firebase/firestore';
import { db, auth } from '@/firebaseConfig';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function MessagesScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [chats, setChats] = useState<DocumentData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const chatsCollection = collection(db, 'chats');
        const q = query(
            chatsCollection, 
            where('participants', 'array-contains', user.uid),
            orderBy('lastMessageTimestamp', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const chatsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setChats(chatsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching chats: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);
    
    const getOtherParticipant = (participants: string[], names: { [key: string]: string }) => {
        const otherId = participants.find(p => p !== user?.uid);
        return names[otherId!] || 'Unknown User';
    };

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
    }
    
    if (!user) {
        return (
            <View style={styles.centered}>
                <Text style={styles.infoText}>Please log in to see your messages.</Text>
                <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/(auth)/sign-in')}>
                    <Text style={styles.loginButtonText}>Sign In</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (chats.length === 0) {
        return (
            <View style={styles.centered}>
                 <Ionicons name="chatbubbles-outline" size={60} color="#CCC" />
                <Text style={styles.infoText}>You have no messages yet.</Text>
                <Text style={styles.infoSubText}>Start a conversation from an ad page.</Text>
            </View>
        );
    }
    
    const renderChatItem = ({ item }: { item: DocumentData }) => (
        <TouchableOpacity 
            style={styles.chatItem} 
            onPress={() => router.push(`/chat/${item.id}?adTitle=${encodeURIComponent(item.adTitle)}`)}
        >
            <Ionicons name="person-circle-outline" size={50} color="#DDD" style={styles.avatar} />
            <View style={styles.chatContent}>
                <View style={styles.chatHeader}>
                    <Text style={styles.chatName}>{getOtherParticipant(item.participants, item.participantNames)}</Text>
                    <Text style={styles.chatTime}>
                        {item.lastMessageTimestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
                <Text style={styles.adTitle} numberOfLines={1}>{item.adTitle}</Text>
                <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Messages</Text>
            </View>
            <FlatList
                data={chats}
                renderItem={renderChatItem}
                keyExtractor={item => item.id}
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
    },
    infoSubText: {
        fontSize: 14,
        color: '#888',
        marginTop: 10,
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
    chatItem: {
        flexDirection: 'row',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
        alignItems: 'center',
    },
    avatar: {
        marginRight: 15,
    },
    chatContent: {
        flex: 1,
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    chatName: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    chatTime: {
        fontSize: 12,
        color: '#999',
    },
    adTitle: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
        marginBottom: 4,
    },
    lastMessage: {
        fontSize: 14,
        color: '#333',
    },
});
